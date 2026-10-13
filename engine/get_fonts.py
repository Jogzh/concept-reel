# -*- coding: utf-8 -*-
"""Download and validate Concept Reel's fonts and SIL OFL license files.

python engine/get_fonts.py          # repair missing or invalid assets
python engine/get_fonts.py --check  # validate offline; exit 1 when repair is needed
"""
import argparse
import json
import os
import struct
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

BASE = "https://raw.githubusercontent.com/google/fonts/main/ofl/"
FONT_DIR = Path(__file__).resolve().parent / "fonts"
FONTS = {
    "NotoSerifSC-VF.ttf": "notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
    "NotoSansSC-VF.ttf": "notosanssc/NotoSansSC%5Bwght%5D.ttf",
    "CormorantGaramond.ttf": "cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf",
    "CormorantGaramond-Italic.ttf": "cormorantgaramond/CormorantGaramond-Italic%5Bwght%5D.ttf",
    "Lora.ttf": "lora/Lora%5Bwght%5D.ttf",
    "Lora-Italic.ttf": "lora/Lora-Italic%5Bwght%5D.ttf",
    "JetBrainsMono.ttf": "jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf",
    "CourierPrime-Regular.ttf": "courierprime/CourierPrime-Regular.ttf",
    "OFL-NotoSerifSC.txt": "notoserifsc/OFL.txt",
    "OFL-NotoSansSC.txt": "notosanssc/OFL.txt",
    "OFL-CormorantGaramond.txt": "cormorantgaramond/OFL.txt",
    "OFL-Lora.txt": "lora/OFL.txt",
    "OFL-JetBrainsMono.txt": "jetbrainsmono/OFL.txt",
    "OFL-CourierPrime.txt": "courierprime/OFL.txt",
}
MAX_ASSET_BYTES = 64 * 1024 * 1024


def validate_asset(path, name=None):
    """Reject error pages, truncated sfnt files and unrelated license text."""
    path = Path(path)
    name = name or path.name
    size = path.stat().st_size
    if size < 1000 or size > MAX_ASSET_BYTES:
        raise ValueError(f"unexpected file size: {size} bytes")
    with path.open("rb") as source:
        if name.endswith(".txt"):
            content = source.read().decode("utf-8-sig")
            if "SIL OPEN FONT LICENSE" not in content.upper() or "Version 1.1" not in content:
                raise ValueError("not a SIL Open Font License 1.1 document")
            if "<html" in content.lower() or "<!doctype" in content.lower():
                raise ValueError("received an HTML page instead of a license")
            return
        header = source.read(12)
        if header[:4] not in (b"\x00\x01\x00\x00", b"OTTO"):
            raise ValueError("not a TrueType/OpenType font (possibly an error page)")
        count = struct.unpack(">H", header[4:6])[0]
        if not 1 <= count <= 256 or 12 + count * 16 > size:
            raise ValueError("invalid or truncated font table directory")
        tags = set()
        for _ in range(count):
            tag, _, offset, length = struct.unpack(">4sIII", source.read(16))
            if tag in tags or offset < 12 + count * 16 or offset + length > size:
                raise ValueError("invalid or truncated font table")
            tags.add(tag)
        if not {b"head", b"name", b"cmap", b"maxp"}.issubset(tags):
            raise ValueError("font is missing required tables")


def inspect_assets(directory=FONT_DIR):
    assets = []
    for name in FONTS:
        path = Path(directory) / name
        status, detail = "ok", "valid"
        try:
            validate_asset(path)
        except FileNotFoundError:
            status, detail = "missing", "file not found"
        except (OSError, ValueError, UnicodeError, struct.error) as error:
            status, detail = "invalid", str(error)
        assets.append({"name": name, "status": status, "detail": detail})
    return assets


def download_asset(name, directory=FONT_DIR, timeout=180):
    """Validate a temporary file before atomically replacing the destination."""
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        request = urllib.request.Request(BASE + FONTS[name], headers={"User-Agent": "Concept-Reel-fonts/1.0"})
        with urllib.request.urlopen(request, timeout=timeout) as response:
            with tempfile.NamedTemporaryFile(dir=directory, prefix=".font-", suffix=".tmp", delete=False) as output:
                temporary = Path(output.name)
                total = 0
                while chunk := response.read(1024 * 1024):
                    total += len(chunk)
                    if total > MAX_ASSET_BYTES:
                        raise ValueError("download exceeds the 64 MiB asset limit")
                    output.write(chunk)
                output.flush()
                os.fsync(output.fileno())
        validate_asset(temporary, name)
        temporary.chmod(0o644)
        os.replace(temporary, directory / name)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def positive_timeout(value):
    seconds = float(value)
    if not 0 < seconds < float("inf"):
        raise argparse.ArgumentTypeError("timeout must be a positive finite number")
    return seconds


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="check assets without downloading")
    parser.add_argument("--json", action="store_true", help="print machine-readable diagnostics")
    parser.add_argument("--directory", type=Path, default=FONT_DIR, help="font directory (default: engine/fonts)")
    parser.add_argument("--timeout", type=positive_timeout, default=180, help="download timeout in seconds")
    args = parser.parse_args(argv)
    failures = {}
    if not args.check:
        for asset in inspect_assets(args.directory):
            if asset["status"] == "ok":
                continue
            name = asset["name"]
            if not args.json:
                print(f"下载 {name} …", flush=True)
            try:
                download_asset(name, args.directory, args.timeout)
            except (OSError, ValueError, UnicodeError, struct.error, urllib.error.URLError) as error:
                failures[name] = str(error)
    assets = inspect_assets(args.directory)
    for asset in assets:
        if asset["name"] in failures:
            asset["download_error"] = failures[asset["name"]]
    ok = all(asset["status"] == "ok" for asset in assets)
    if args.json:
        print(json.dumps({"ok": ok, "directory": str(args.directory.resolve()), "assets": assets}, ensure_ascii=False, indent=2))
    else:
        print("字体和许可证齐全且有效。" if ok else "字体检查未通过：")
        for asset in assets:
            if asset["status"] != "ok":
                print(f"  {asset['name']}: {asset.get('download_error', asset['detail'])}")
                print(f"    手动下载：{BASE + FONTS[asset['name']]}")
        if not ok:
            print("运行 python engine/get_fonts.py 重试；也可手动下载后放到", args.directory.resolve())
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
