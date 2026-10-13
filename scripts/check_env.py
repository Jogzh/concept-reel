#!/usr/bin/env python3
"""Check Concept Reel's local rendering environment without installing anything."""
import argparse
import importlib
import importlib.metadata
import json
import shutil
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
DEPENDENCIES = {"playwright": "playwright.sync_api", "numpy": "numpy", "scipy": "scipy", "Pillow": "PIL"}


class ScriptSources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sources = []

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            source = dict(attrs).get("src")
            if source:
                self.sources.append(source)


def result(name, ok, detail, hint=None):
    item = {"name": name, "ok": bool(ok), "detail": detail}
    if hint and not ok:
        item["hint"] = hint
    return item


def command_check(name):
    executable = shutil.which(name)
    if not executable:
        return result(name, False, "executable not found on PATH", "Install FFmpeg and ensure ffmpeg/ffprobe are on PATH.")
    try:
        process = subprocess.run([executable, "-version"], capture_output=True, text=True, timeout=10)
        output = (process.stdout or process.stderr).splitlines()
        return result(name, process.returncode == 0, output[0] if output else f"exit code {process.returncode}")
    except (OSError, subprocess.TimeoutExpired) as error:
        return result(name, False, str(error))


def browser_check(browser):
    hint = "Run python -m playwright install chromium." if browser == "chromium" else "Install Google Chrome, or use --browser chromium."
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as playwright:
            kwargs = {"headless": True, "timeout": 15000}
            if browser == "chrome":
                kwargs["channel"] = "chrome"
            instance = playwright.chromium.launch(**kwargs)
            try:
                version = instance.version
            finally:
                instance.close()
        return result(f"browser:{browser}", True, f"launch succeeded ({version})")
    except Exception as error:
        detail = str(error).strip().splitlines()[0] if str(error).strip() else type(error).__name__
        return result(f"browser:{browser}", False, detail[:500], hint)


def project_check(project, name=None):
    missing = [name for name in ("index.html", "film.js") if not (project / name).is_file()]
    if missing:
        return result(name or f"project:{project.name}", False, "missing: " + ", ".join(missing), "Create a project with scripts/new_film.py, or add the engine HTML template.")
    try:
        html = (project / "index.html").read_text(encoding="utf-8")
    except (OSError, UnicodeError) as error:
        return result(name or f"project:{project.name}", False, str(error))
    parser = ScriptSources()
    parser.feed(html)
    missing_scripts = []
    for src in parser.sources:
        try:
            url = urlsplit(src)
            if url.scheme or url.netloc:
                continue
            path = unquote(url.path)
            if "\x00" in path or "\\" in path:
                raise ValueError("invalid local script path")
            # Match render.Handler: decode before routing and contain resolved symlinks.
            if path.startswith("/engine/"):
                root, relative = (ROOT / "engine").resolve(), path[len("/engine/"):]
            else:
                root, relative = project.resolve(), path.lstrip("/") or "index.html"
            local = (root / relative).resolve()
            if not local.is_relative_to(root) or not local.is_file():
                missing_scripts.append(src)
        except (OSError, RuntimeError, ValueError):
            missing_scripts.append(src)
    detail = "index.html and film.js present; local scripts resolved"
    if missing_scripts:
        detail = "unresolved scripts: " + ", ".join(missing_scripts)
    return result(name or f"project:{project.name}", not missing_scripts, detail, "Use /engine/vk.js and /engine/vk-kit.js for shared engine scripts.")


def collect_checks(browser="chromium", project=None):
    checks = [result("python", sys.version_info >= (3, 10), sys.version.split()[0], "Use Python 3.10 or newer.")]
    for distribution, module in DEPENDENCIES.items():
        try:
            importlib.import_module(module)
            version = importlib.metadata.version(distribution)
            checks.append(result(f"dependency:{distribution}", True, version))
        except Exception as error:
            checks.append(result(f"dependency:{distribution}", False, str(error).splitlines()[0][:300], "Run python -m pip install -r requirements.txt in your virtual environment."))
    checks.extend(command_check(name) for name in ("ffmpeg", "ffprobe"))
    checks.append(browser_check(browser))
    resources = ("engine/index.html", "engine/vk.js", "engine/vk-kit.js", "engine/render.py", "engine/audio.py", "engine/get_fonts.py")
    missing = [path for path in resources if not (ROOT / path).is_file()]
    checks.append(result("engine", not missing, "missing: " + ", ".join(missing) if missing else "all engine resources present"))
    sys.path.insert(0, str(ROOT))
    try:
        from engine.get_fonts import inspect_assets
        for asset in inspect_assets(ROOT / "engine/fonts"):
            checks.append(result("font:" + asset["name"], asset["status"] == "ok", asset["detail"], "Run python engine/get_fonts.py."))
    except (ImportError, OSError) as error:
        checks.append(result("fonts", False, str(error)))
    finally:
        sys.path.pop(0)
    examples = sorted((ROOT / "examples").glob("*/film.js"))
    checks.append(result("examples", bool(examples), f"{len(examples)} bundled projects found"))
    checks.extend(project_check(film.parent, "example:" + film.parent.name) for film in examples)
    if project is not None:
        checks.append(project_check(project.resolve()))
    return checks


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="print machine-readable diagnostics")
    parser.add_argument("--browser", choices=("chromium", "chrome"), default="chromium", help="browser to launch (matches render.py)")
    parser.add_argument("--project", type=Path, help="also check an individual project")
    args = parser.parse_args(argv)
    checks = collect_checks(args.browser, args.project)
    ok = all(check["ok"] for check in checks)
    if args.json:
        print(json.dumps({"ok": ok, "browser": args.browser, "checks": checks}, ensure_ascii=False, indent=2))
    else:
        for check in checks:
            print(f"[{'OK' if check['ok'] else 'FAIL'}] {check['name']}: {check['detail']}")
            if "hint" in check:
                print("       " + check["hint"])
        print("Environment ready." if ok else "Environment needs attention; resolve the FAIL entries above.")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
