# -*- coding: utf-8 -*-
"""Render deterministic film.js projects with Playwright and ffmpeg.

  python engine/render.py <project>                     renders/raw.mp4
  python engine/render.py <project> --jobs 4             render in parallel
  python engine/render.py <project> --stills 2.5 8.5      individual PNG frames
  python engine/render.py <project> --sheet [16]          review/sheet.jpg
  python engine/render.py <project> --sheet 3.5 9 21.5    selected times
  python engine/render.py <project> --motion 8.2 10.6 [12]
  python engine/render.py <project> --clip 0 12 [name]
  python engine/render.py <project> --events              audio/events.json
  python engine/render.py <project> --det                 determinism check
  python engine/render.py <project> --serve [--port 8765]

The default browser is Playwright's bundled Chromium. Use --browser chrome
to use an installed Google Chrome. Project assets are served locally, with
the shared engine mounted at /engine/.
"""
import argparse
import hashlib
import http.server
import io
import json
import math
import random
import shutil
import subprocess
import sys
import tempfile
import threading
import uuid
from pathlib import Path
from urllib.parse import unquote, urlsplit

ENGINE = Path(__file__).resolve().parent
ASSET_CHUNK_SIZE = 64 * 1024
BROWSER_ARGS = ["--disable-lcd-text", "--run-all-compositor-stages-before-draw",
                "--force-color-profile=srgb"]


class Handler(http.server.SimpleHTTPRequestHandler):
    proj = None

    def translate_path(self, path):
        path = unquote(urlsplit(path).path)
        if "\x00" in path or "\\" in path:
            raise PermissionError("Invalid asset path")
        if path.startswith("/engine/"):
            root, relative = ENGINE.resolve(), path[len("/engine/"):]
        else:
            root, relative = self.proj.resolve(), path.lstrip("/") or "index.html"
        target = (root / relative).resolve()
        if not target.is_relative_to(root):
            raise PermissionError("Asset path escapes its root")
        return str(target)

    def send_head(self):
        try:
            return super().send_head()
        except PermissionError:
            self.send_error(403, "Asset path is outside the project or engine")
            return None

    def copyfile(self, source, outputfile):
        # Bound each socket.sendall: simultaneous large font transfers can exceed
        # macOS socket buffers when shutil uses its larger platform default.
        shutil.copyfileobj(source, outputfile, length=ASSET_CHUNK_SIZE)

    def do_GET(self):
        if urlsplit(self.path).path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


def serve(proj, port=0):
    handler = type("ProjectHandler", (Handler,), {"proj": Path(proj).resolve()})
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}/"


def open_page(playwright, url, browser="chromium"):
    launch = {"args": BROWSER_ARGS}
    if browser == "chrome":
        launch["channel"] = "chrome"
    browser_instance = playwright.chromium.launch(**launch)
    diagnostics = []
    page_errors = []
    try:
        page = browser_instance.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
        page._render_errors = page_errors

        def console(message):
            if message.type in ("error", "warning"):
                diagnostics.append(message.text)
                print("[page]", message.text, file=sys.stderr)

        def pageerror(error):
            page_errors.append(str(error))
            diagnostics.append(str(error))
            print("[pageerror]", error, file=sys.stderr)

        page.on("console", console)
        page.on("pageerror", pageerror)
        page.on("requestfailed", lambda request: diagnostics.append(f"{request.url}: {request.failure}"))
        response = page.goto(url)
        if response is not None and response.status >= 400:
            raise RuntimeError(f"Project page returned HTTP {response.status}")
        try:
            page.wait_for_function("window.READY === true || Boolean(window.READY_ERROR)", timeout=180000)
        except Exception as error:
            detail = "; ".join(diagnostics[-8:]) or "check index.html, film.js, and font assets"
            raise RuntimeError(f"Project did not become ready: {detail}") from error
        ready_error = page.evaluate("window.READY_ERROR || null")
        if ready_error:
            raise RuntimeError(f"Project initialization failed: {ready_error}")
        if page_errors:
            raise RuntimeError("Project initialization failed: " + "; ".join(page_errors[-8:]))
        if not page.evaluate("typeof window.seek === 'function'"):
            raise RuntimeError("film.js must expose window.seek(t)")
        timeline(page)
        return browser_instance, page
    except BaseException:
        browser_instance.close()
        raise


def timeline(page):
    end, fps = page.evaluate("END"), page.evaluate("FPS")
    for name, value in (("END", end), ("FPS", fps)):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0:
            raise ValueError(f"film.js {name} must be a finite positive number")
    if round(end * fps) < 1:
        raise ValueError("Film duration must contain at least one frame")
    return end, fps


def validate_times(times, end):
    for value in times:
        if not math.isfinite(value) or not 0 <= value <= end:
            raise ValueError(f"Frame time {value} must be between 0 and END ({end:g})")


def shot(page, t):
    if not math.isfinite(t) or t < 0:
        raise ValueError("Frame time must be finite and nonnegative")
    check_page_errors(page)
    page.evaluate("(t) => window.seek(t)", t)
    check_page_errors(page)
    frame = page.screenshot(type="png")
    check_page_errors(page)
    return frame


def check_page_errors(page):
    # Playwright dispatches asynchronous page errors during evaluate/screenshot too.
    errors = getattr(page, "_render_errors", ())
    if isinstance(errors, list) and errors:
        raise RuntimeError("Project runtime failed: " + "; ".join(errors[-8:]))


def with_page(proj, fn, browser="chromium"):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as error:
        raise RuntimeError("Install requirements.txt and run python -m playwright install chromium") from error
    server, url = serve(proj)
    try:
        with sync_playwright() as playwright:
            instance, page = open_page(playwright, url, browser)
            try:
                return fn(page)
            finally:
                instance.close()
    finally:
        server.shutdown()
        server.server_close()


def stills(proj, ts, browser="chromium"):
    (proj / "review").mkdir(exist_ok=True)

    def go(page):
        end, _ = timeline(page)
        validate_times(ts, end)
        for t in ts:
            (proj / f"review/s_{t:07.2f}.png").write_bytes(shot(page, t))

    with_page(proj, go, browser)
    print("stills:", len(ts))


def sheet(proj, args, name="sheet", browser="chromium"):
    from PIL import Image, ImageDraw, ImageFont
    (proj / "review").mkdir(exist_ok=True)

    def go(page):
        end, _ = timeline(page)
        if len(args) > 1:
            ts = [float(value) for value in args]
        else:
            count = int(args[0]) if args else 16
            if count < 1:
                raise ValueError("Sheet frame count must be positive")
            ts = [(i + .5) * end / count for i in range(count)]
        validate_times(ts, end)
        cols = 4 if len(ts) > 6 else 2 if len(ts) > 1 else 1
        width = 1920 // cols
        height = width * 9 // 16
        image = Image.new("RGB", (cols * width, math.ceil(len(ts) / cols) * height), (20, 20, 20))
        draw = ImageDraw.Draw(image)
        try:
            font = ImageFont.truetype(str(ENGINE / "fonts/JetBrainsMono.ttf"), 18)
        except OSError:
            font = ImageFont.load_default()
        for i, t in enumerate(ts):
            with Image.open(io.BytesIO(shot(page, t))) as frame:
                thumb = frame.convert("RGB").resize((width, height), Image.Resampling.LANCZOS)
            x, y = (i % cols) * width, (i // cols) * height
            image.paste(thumb, (x, y))
            draw.rectangle([x, y + height - 24, x + 78, y + height], fill=(0, 0, 0))
            draw.text((x + 5, y + height - 22), f"{t:.2f}", font=font, fill=(255, 230, 0))
        destination = proj / f"review/{name}.jpg"
        image.save(destination, quality=90)
        print("sheet:", destination, len(ts))

    with_page(proj, go, browser)


def stop_process(process):
    """Reap a running encoder/worker after an error or interrupt."""
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()


def encoder_error(log, returncode):
    log.seek(0)
    detail = log.read().decode("utf-8", errors="replace").strip()[-4000:]
    return RuntimeError(f"ffmpeg exited with status {returncode}" + (f": {detail}" if detail else ""))


def frames(proj, out, a=0.0, b=None, browser="chromium"):
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)

    def go(page):
        end, fps = timeline(page)
        stop = end if b is None else b
        validate_times([a, stop], end)
        first, last = round(a * fps), round(stop * fps)
        if a >= stop or last <= first:
            raise ValueError("Clip must have increasing times and contain at least one frame")
        # Publish only completed files; an existing render survives a failed run.
        with tempfile.TemporaryDirectory(prefix=".render-", dir=out.parent) as temporary, tempfile.TemporaryFile() as log:
            destination = Path(temporary) / "video.mp4"
            process = subprocess.Popen([
                "ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", "-preset", "medium",
                "-movflags", "+faststart", str(destination)
            ], stdin=subprocess.PIPE, stderr=log)
            try:
                try:
                    for i in range(first, last):
                        process.stdin.write(shot(page, i / fps))
                        if (i - first) % 150 == 0:
                            print(f"  {i - first}/{last - first}", flush=True)
                    process.stdin.close()
                except BrokenPipeError:
                    process.wait()
                    raise encoder_error(log, process.returncode)
                returncode = process.wait()
                if returncode:
                    raise encoder_error(log, returncode)
                destination.replace(out)
            finally:
                if process.stdin and not process.stdin.closed:
                    try:
                        process.stdin.close()
                    except BrokenPipeError:
                        pass
                stop_process(process)
        print("done", out, f"{(last - first) / fps:.2f}s")

    with_page(proj, go, browser)


def frames_parallel(proj, out, jobs, browser="chromium"):
    """Render complete, nonoverlapping frame ranges and concatenate them."""
    if jobs < 1:
        raise ValueError("Jobs must be positive")
    end, fps = with_page(proj, timeline, browser)
    total = round(end * fps)
    jobs = min(jobs, total)
    cuts = [total * i // jobs for i in range(jobs + 1)]
    renders = proj / "renders"
    renders.mkdir(exist_ok=True)
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    token = uuid.uuid4().hex
    parts, processes, logs = [], [], []
    with tempfile.TemporaryDirectory(prefix=".parts-", dir=renders) as temporary:
        temporary = Path(temporary)
        try:
            for i in range(jobs):
                name = f"_part_{token}_{i:02d}"
                parts.append(renders / f"{name}.mp4")
                log = open(temporary / f"worker_{i}.log", "wb+")
                logs.append(log)
                processes.append(subprocess.Popen([
                    sys.executable, str(Path(__file__).resolve()), str(proj), "--clip",
                    repr(cuts[i] / fps), repr(min(end, cuts[i + 1] / fps)), name,
                    "--browser", browser
                ], stdout=None if i == 0 else log, stderr=log))
            # Evaluate every wait: any(generator) leaves later children running after a failure.
            statuses = [process.wait() for process in processes]
            failed = [i for i, status in enumerate(statuses) if status]
            if failed:
                details = []
                for i in failed:
                    logs[i].seek(0)
                    text = logs[i].read().decode("utf-8", errors="replace").strip()[-2000:]
                    details.append(f"part {i + 1} (status {statuses[i]}): {text}")
                raise RuntimeError("Parallel render failed: " + "; ".join(details))
            # Generated filenames contain no quotes. Relative entries also support project paths containing quotes.
            listing = temporary / "parts.txt"
            listing.write_text("".join(f"file '../{part.name}'\n" for part in parts), encoding="utf-8")
            destination = temporary / "video.mp4"
            result = subprocess.run([
                "ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing),
                "-c", "copy", "-movflags", "+faststart", str(destination)
            ], capture_output=True, text=True)
            if result.returncode:
                raise RuntimeError(f"ffmpeg concat failed (status {result.returncode}): {result.stderr.strip()[-4000:]}")
            destination.replace(out)
        finally:
            for process in processes:
                stop_process(process)
            for log in logs:
                log.close()
            for part in parts:
                part.unlink(missing_ok=True)
    print("done", out, f"{total / fps:.2f}s", f"({jobs} workers)")


def events(proj, browser="chromium"):
    (proj / "audio").mkdir(exist_ok=True)

    def go(page):
        event_list = page.evaluate("events()")
        metadata = page.evaluate("({end: END, fps: FPS, meta: META})")
        with (proj / "audio/events.json").open("w", encoding="utf-8") as destination:
            json.dump({**metadata, "events": event_list}, destination, ensure_ascii=False, indent=2)
        print("events:", len(event_list))

    with_page(proj, go, browser)


def det(proj, n=12, browser="chromium"):
    def go(page):
        end, _ = timeline(page)
        rng = random.Random(7)
        times = [round(rng.uniform(0, end), 3) for _ in range(n)]
        hashes = {t: hashlib.sha256(shot(page, t)).digest() for t in times}
        order = times[:]
        rng.shuffle(order)
        bad = [t for t in order if hashlib.sha256(shot(page, t)).digest() != hashes[t]]
        print("deterministic" if not bad else f"NOT deterministic at {bad}; check persistent state and Math.random()")
        return not bad

    return with_page(proj, go, browser)


def finite_time(value):
    try:
        result = float(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("expected a time in seconds") from error
    if not math.isfinite(result) or result < 0:
        raise argparse.ArgumentTypeError("time must be finite and nonnegative")
    return result


def positive_int(value):
    try:
        result = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("expected a positive integer") from error
    if result < 1:
        raise argparse.ArgumentTypeError("value must be a positive integer")
    return result


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("project", type=Path, help="directory containing index.html and film.js")
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--stills", nargs="+", type=finite_time, metavar="TIME")
    modes.add_argument("--sheet", nargs="*", metavar="COUNT_OR_TIME", help="one frame count (default 16), or multiple times")
    modes.add_argument("--motion", nargs="+", metavar="VALUE", help="START END [COUNT], default 12 frames")
    modes.add_argument("--clip", nargs="+", metavar="VALUE", help="START END [NAME], default _clip")
    modes.add_argument("--events", action="store_true")
    modes.add_argument("--det", action="store_true")
    modes.add_argument("--serve", action="store_true")
    parser.add_argument("--jobs", type=positive_int, default=1, help="parallel workers for a full film")
    parser.add_argument("--browser", choices=("chromium", "chrome"), default="chromium")
    parser.add_argument("--port", type=int, help="preview port (default 8765; 0 chooses an available port)")
    args = parser.parse_args(argv)
    try:
        if args.sheet is not None:
            if len(args.sheet) == 1:
                args.sheet = [positive_int(args.sheet[0])]
            else:
                args.sheet = [finite_time(value) for value in args.sheet]
        if args.motion is not None:
            if len(args.motion) not in (2, 3):
                raise ValueError("--motion expects START END [COUNT]")
            start, end = map(finite_time, args.motion[:2])
            count = positive_int(args.motion[2]) if len(args.motion) == 3 else 12
            if start >= end or count < 2:
                raise ValueError("--motion needs START < END and COUNT >= 2")
            args.motion = (start, end, count)
        if args.clip is not None:
            if len(args.clip) not in (2, 3):
                raise ValueError("--clip expects START END [NAME]")
            start, end = map(finite_time, args.clip[:2])
            name = args.clip[2] if len(args.clip) == 3 else "_clip"
            if start >= end:
                raise ValueError("--clip needs START < END")
            if not name or name in (".", "..") or "/" in name or "\\" in name or "\x00" in name:
                raise ValueError("--clip NAME must be a filename without directory components")
            args.clip = (start, end, name)
        mode_selected = any(value is not None for value in (args.stills, args.sheet, args.motion, args.clip)) or args.events or args.det or args.serve
        if args.jobs != 1 and mode_selected:
            raise ValueError("--jobs only applies to full-film rendering")
        if args.port is not None and (not args.serve or not 0 <= args.port <= 65535):
            raise ValueError("--port requires --serve and must be between 0 and 65535")
    except (ValueError, argparse.ArgumentTypeError) as error:
        parser.error(str(error))
    args.port = 8765 if args.port is None else args.port
    args.project = args.project.resolve()
    for required in ("index.html", "film.js"):
        if not (args.project / required).is_file():
            parser.error(f"Project is missing {required}: {args.project}")
    return args


def main(argv=None):
    args = parse_args(argv)
    proj = args.project
    try:
        if args.serve:
            server, url = serve(proj, args.port)
            print("preview:", url + "?play", "(Ctrl+C to stop)", flush=True)
            try:
                threading.Event().wait()
            except KeyboardInterrupt:
                pass
            finally:
                server.shutdown()
                server.server_close()
        elif args.stills is not None:
            stills(proj, args.stills, args.browser)
        elif args.sheet is not None:
            sheet(proj, args.sheet, browser=args.browser)
        elif args.motion is not None:
            start, end, count = args.motion
            sheet(proj, [start + (end - start) * i / (count - 1) for i in range(count)],
                  f"motion_{start:g}-{end:g}", args.browser)
        elif args.clip is not None:
            start, end, name = args.clip
            frames(proj, proj / f"renders/{name}.mp4", start, end, args.browser)
        elif args.events:
            events(proj, args.browser)
        elif args.det:
            return 0 if det(proj, browser=args.browser) else 1
        elif args.jobs > 1:
            frames_parallel(proj, proj / "renders/raw.mp4", args.jobs, args.browser)
        else:
            frames(proj, proj / "renders/raw.mp4", browser=args.browser)
    except KeyboardInterrupt:
        print("Render interrupted", file=sys.stderr)
        return 130
    except Exception as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
