"""Render boundary and failure checks; no browser installation is needed."""
import contextlib
import io
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from urllib.error import HTTPError
from urllib.request import urlopen

from engine import render


class ProjectTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.project = Path(self.temporary.name) / "film's project"
        self.project.mkdir()
        (self.project / "index.html").write_text("<h1>film</h1>", encoding="utf-8")
        (self.project / "film.js").write_text("// test", encoding="utf-8")

    def parse(self, *arguments):
        return render.parse_args([str(self.project), *arguments])

    def fake_page(self, end=2.0, fps=2):
        page = Mock()
        page.evaluate.side_effect = lambda expression, *args: {"END": end, "FPS": fps}.get(expression)
        return page


class CliTests(ProjectTest):
    def test_defaults_and_browser_selection(self):
        self.assertEqual(self.parse().browser, "chromium")
        self.assertEqual(self.parse("--browser", "chrome").browser, "chrome")
        self.assertEqual(self.parse("--serve", "--port", "0").port, 0)

    def test_sheet_and_motion_preserve_supported_forms(self):
        self.assertEqual(self.parse("--sheet").sheet, [])
        self.assertEqual(self.parse("--sheet", "16").sheet, [16])
        self.assertEqual(self.parse("--sheet", "1.5", "2").sheet, [1.5, 2])
        self.assertEqual(self.parse("--motion", "0", "2").motion, (0, 2, 12))
        self.assertEqual(self.parse("--clip", "0", "2").clip, (0, 2, "_clip"))

    def test_invalid_arguments_fail_before_rendering(self):
        invalid = [
            ["--stills", "nan"], ["--stills", "-1"], ["--clip", "2", "1"],
            ["--clip", "0", "1", "../escape"], ["--clip", "0", "1", "a\\b"],
            ["--motion", "0", "1", "1"], ["--motion", "0"],
            ["--sheet", "0"], ["--sheet", "1.5"], ["--sheet", "1", "inf"],
            ["--jobs", "0"], ["--jobs", "2", "--events"],
            ["--events", "--det"], ["--serve", "--port", "65536"], ["--port", "9000"]
        ]
        for arguments in invalid:
            with self.subTest(arguments=arguments), contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as error:
                    self.parse(*arguments)
                self.assertEqual(error.exception.code, 2)

    def test_missing_html_is_reported(self):
        (self.project / "index.html").unlink()
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as error:
            self.parse()
        self.assertEqual(error.exception.code, 2)

    def test_runtime_failure_and_determinism_have_nonzero_status(self):
        with patch.object(render, "frames", side_effect=RuntimeError("encoder failed")), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(render.main([str(self.project)]), 1)
        with patch.object(render, "det", return_value=False):
            self.assertEqual(render.main([str(self.project), "--det"]), 1)


class ServerTests(ProjectTest):
    def test_asset_transfer_uses_bounded_chunks_without_truncation(self):
        class BoundedWriter(io.BytesIO):
            def write(self, chunk):
                if len(chunk) > 64 * 1024:
                    raise OSError("socket transfer is too large")
                return super().write(chunk)

        data = b"font bytes" * 100000
        destination = BoundedWriter()
        render.Handler.copyfile(None, io.BytesIO(data), destination)
        self.assertEqual(destination.getvalue(), data)

    def test_encoded_names_and_root_assets_are_served(self):
        (self.project / "hello 世界.txt").write_text("asset", encoding="utf-8")
        server, url = render.serve(self.project)
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        with urlopen(url + "hello%20%E4%B8%96%E7%95%8C.txt") as response:
            self.assertEqual(response.read(), b"asset")
            self.assertEqual(response.headers["Cache-Control"], "no-store")
        with urlopen(url + "?play") as response:
            self.assertEqual(response.read(), b"<h1>film</h1>")
        with urlopen(url + "engine/vk.js") as response:
            self.assertEqual(response.status, 200)

    def test_traversal_and_symlinks_cannot_escape_asset_roots(self):
        secret = Path(self.temporary.name) / "secret.txt"
        secret.write_text("private", encoding="utf-8")
        (self.project / "linked.txt").symlink_to(secret)
        server, url = render.serve(self.project)
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        for path in ("%2e%2e/secret.txt", "linked.txt", "engine/%2e%2e/README.md", "%00", "%5c..%5csecret.txt"):
            with self.subTest(path=path), self.assertRaises(HTTPError) as error:
                urlopen(url + path)
            self.assertEqual(error.exception.code, 403)
            error.exception.close()


class BrowserTests(unittest.TestCase):
    def browser(self):
        playwright = Mock()
        browser = playwright.chromium.launch.return_value
        page = browser.new_page.return_value
        page.goto.return_value.status = 200
        page.evaluate.side_effect = lambda expression: {
            "window.READY_ERROR || null": None, "typeof window.seek === 'function'": True,
            "END": 2, "FPS": 30
        }[expression]
        return playwright, browser, page

    def test_bundled_chromium_is_default_and_chrome_is_explicit(self):
        playwright, _, _ = self.browser()
        render.open_page(playwright, "http://localhost/")
        self.assertNotIn("channel", playwright.chromium.launch.call_args.kwargs)
        render.open_page(playwright, "http://localhost/", "chrome")
        self.assertEqual(playwright.chromium.launch.call_args.kwargs["channel"], "chrome")

    def test_initialization_error_is_reported_and_browser_closed(self):
        playwright, browser, page = self.browser()
        page.evaluate.return_value = "font load failed"
        page.evaluate.side_effect = None
        with self.assertRaisesRegex(RuntimeError, "font load failed"):
            render.open_page(playwright, "http://localhost/")
        browser.close.assert_called_once()
        self.assertIn("READY_ERROR", page.wait_for_function.call_args.args[0])

    def test_timeout_contains_page_error(self):
        playwright, browser, page = self.browser()

        def wait(*args, **kwargs):
            callbacks = dict(call.args for call in page.on.call_args_list)
            callbacks["pageerror"]("film.js: unknown method")
            raise TimeoutError("not ready")

        page.wait_for_function.side_effect = wait
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaisesRegex(RuntimeError, "unknown method"):
            render.open_page(playwright, "http://localhost/")
        browser.close.assert_called_once()

    def test_invalid_film_metadata_is_rejected(self):
        for end, fps in ((0, 30), (2, 0), (float("nan"), 30), (2, True), (.01, 1)):
            with self.subTest(end=end, fps=fps):
                page = Mock()
                page.evaluate.side_effect = lambda expression: {"END": end, "FPS": fps}[expression]
                with self.assertRaises(ValueError):
                    render.timeline(page)

    def test_async_page_error_during_screenshot_fails_the_frame(self):
        playwright, _, page = self.browser()
        render.open_page(playwright, "http://localhost/")
        page.evaluate.side_effect = None
        callbacks = dict(call.args for call in page.on.call_args_list)

        def screenshot(**kwargs):
            callbacks["pageerror"]("async draw failed")
            return b"partial frame"

        page.screenshot.side_effect = screenshot
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaisesRegex(RuntimeError, "async draw failed"):
            render.shot(page, .5)


class EncodingTests(ProjectTest):
    def fake_process(self, status=0):
        process = Mock()
        process.stdin = io.BytesIO()
        process.returncode = status
        process.wait.return_value = status
        process.poll.return_value = status
        return process

    def callback(self, _project, fn, browser="chromium"):
        return fn(self.fake_page())

    def test_failed_encoder_preserves_existing_render_and_cleans_staging(self):
        out = self.project / "renders/raw.mp4"
        out.parent.mkdir()
        out.write_bytes(b"previous render")
        process = self.fake_process(7)

        def start(command, **kwargs):
            Path(command[-1]).write_bytes(b"partial")
            kwargs["stderr"].write(b"libx264 unavailable")
            return process

        with patch.object(render, "with_page", side_effect=self.callback), patch.object(render, "shot", return_value=b"frame"), patch.object(render.subprocess, "Popen", side_effect=start):
            with self.assertRaisesRegex(RuntimeError, "libx264 unavailable"):
                render.frames(self.project, out)
        self.assertEqual(out.read_bytes(), b"previous render")
        self.assertEqual(list(out.parent.iterdir()), [out])

    def test_success_publishes_render_and_renders_each_frame_once(self):
        out = self.project / "renders/raw.mp4"
        process = self.fake_process()

        def start(command, **kwargs):
            Path(command[-1]).write_bytes(b"complete")
            return process

        with patch.object(render, "with_page", side_effect=self.callback), patch.object(render, "shot", return_value=b"frame") as shot, patch.object(render.subprocess, "Popen", side_effect=start):
            render.frames(self.project, out, .5, 2)
        self.assertEqual(out.read_bytes(), b"complete")
        self.assertEqual([call.args[1] for call in shot.call_args_list], [.5, 1, 1.5])

    def test_page_failure_terminates_encoder(self):
        out = self.project / "renders/raw.mp4"
        process = self.fake_process()
        process.poll.return_value = None
        with patch.object(render, "with_page", side_effect=self.callback), patch.object(render, "shot", side_effect=RuntimeError("draw failed")), patch.object(render.subprocess, "Popen", return_value=process):
            with self.assertRaisesRegex(RuntimeError, "draw failed"):
                render.frames(self.project, out)
        process.terminate.assert_called_once()
        process.wait.assert_called_once_with(timeout=5)
        self.assertFalse(out.exists())

    def test_clip_outside_duration_never_launches_encoder(self):
        with patch.object(render, "with_page", side_effect=self.callback), patch.object(render.subprocess, "Popen") as launch:
            with self.assertRaises(ValueError):
                render.frames(self.project, self.project / "renders/raw.mp4", 0, 4)
        launch.assert_not_called()

    def test_failed_worker_does_not_skip_waiting_for_other_workers(self):
        processes = [self.fake_process(1), self.fake_process(0), self.fake_process(0)]

        def start(command, **kwargs):
            name = command[6]
            (self.project / "renders" / f"{name}.mp4").write_bytes(b"part")
            return processes.pop(0)

        children = processes[:]
        with patch.object(render, "with_page", return_value=(2, 3)), patch.object(render.subprocess, "Popen", side_effect=start), patch.object(render.subprocess, "run") as concat:
            with self.assertRaisesRegex(RuntimeError, "part 1"):
                render.frames_parallel(self.project, self.project / "renders/raw.mp4", 3)
        for process in children:
            process.wait.assert_called_once_with()
        concat.assert_not_called()
        self.assertEqual(list((self.project / "renders").iterdir()), [])

    def test_parallel_caps_workers_and_preserves_frame_boundaries(self):
        commands = []

        def start(command, **kwargs):
            commands.append(command)
            (self.project / "renders" / f"{command[6]}.mp4").write_bytes(b"part")
            return self.fake_process()

        def concat(command, **kwargs):
            listing = Path(command[command.index("-i") + 1]).read_text()
            self.assertEqual(listing.count("file '"), 3)
            self.assertNotIn("film's project", listing)
            Path(command[-1]).write_bytes(b"concatenated")
            return subprocess.CompletedProcess(command, 0, "", "")

        with patch.object(render, "with_page", return_value=(1.2, 3)), patch.object(render.subprocess, "Popen", side_effect=start), patch.object(render.subprocess, "run", side_effect=concat):
            render.frames_parallel(self.project, self.project / "renders/raw.mp4", 3, "chrome")
        ranges = [(round(float(command[4]) * 3), round(float(command[5]) * 3)) for command in commands]
        self.assertEqual(ranges, [(0, 1), (1, 2), (2, 4)])
        self.assertTrue(all(command[-2:] == ["--browser", "chrome"] for command in commands))
        self.assertEqual((self.project / "renders/raw.mp4").read_bytes(), b"concatenated")
        self.assertEqual(list((self.project / "renders").iterdir()), [self.project / "renders/raw.mp4"])

    def test_concat_failure_preserves_existing_render_and_cleans_parts(self):
        out = self.project / "renders/raw.mp4"
        out.parent.mkdir()
        out.write_bytes(b"previous")

        def start(command, **kwargs):
            (out.parent / f"{command[6]}.mp4").write_bytes(b"part")
            return self.fake_process()

        result = subprocess.CompletedProcess([], 9, "", "invalid stream")
        with patch.object(render, "with_page", return_value=(1, 2)), patch.object(render.subprocess, "Popen", side_effect=start), patch.object(render.subprocess, "run", return_value=result):
            with self.assertRaisesRegex(RuntimeError, "invalid stream"):
                render.frames_parallel(self.project, out, 2)
        self.assertEqual(out.read_bytes(), b"previous")
        self.assertEqual(list(out.parent.iterdir()), [out])

    def test_parallel_never_starts_empty_segments(self):
        commands = []

        def start(command, **kwargs):
            commands.append(command)
            (self.project / "renders" / f"{command[6]}.mp4").write_bytes(b"part")
            return self.fake_process()

        def concat(command, **kwargs):
            Path(command[-1]).write_bytes(b"video")
            return subprocess.CompletedProcess(command, 0, "", "")

        with patch.object(render, "with_page", return_value=(1, 2)), patch.object(render.subprocess, "Popen", side_effect=start), patch.object(render.subprocess, "run", side_effect=concat):
            render.frames_parallel(self.project, self.project / "renders/raw.mp4", 8)
        self.assertEqual(len(commands), 2)
        self.assertEqual([(float(command[4]), float(command[5])) for command in commands], [(0, .5), (.5, 1)])


if __name__ == "__main__":
    unittest.main()
