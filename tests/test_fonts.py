import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from engine import get_fonts


class FontAssetTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.directory = Path(self.temporary.name)
        self.addCleanup(self.temporary.cleanup)
        self.name = "CourierPrime-Regular.ttf"
        self.valid_font = (get_fonts.FONT_DIR / self.name).read_bytes()

    def test_bundled_font_and_license_are_valid(self):
        get_fonts.validate_asset(get_fonts.FONT_DIR / self.name)
        get_fonts.validate_asset(get_fonts.FONT_DIR / "OFL-CourierPrime.txt")

    def test_html_and_truncated_fonts_are_rejected(self):
        for content in (b"<!doctype html><html>Not a font</html>" * 100, self.valid_font[:2048]):
            path = self.directory / self.name
            path.write_bytes(content)
            with self.assertRaises(ValueError):
                get_fonts.validate_asset(path)

    def test_unrelated_license_is_rejected(self):
        path = self.directory / "OFL-CourierPrime.txt"
        path.write_text("Not an open font license. " * 100, encoding="utf-8")
        with self.assertRaises(ValueError):
            get_fonts.validate_asset(path)

    def test_failed_validation_preserves_existing_file_and_cleans_temporary(self):
        path = self.directory / self.name
        path.write_bytes(self.valid_font)
        with patch.object(get_fonts.urllib.request, "urlopen", return_value=io.BytesIO(b"<html>Proxy error</html>" * 100)):
            with self.assertRaises(ValueError):
                get_fonts.download_asset(self.name, self.directory)
        self.assertEqual(path.read_bytes(), self.valid_font)
        self.assertEqual(list(self.directory.iterdir()), [path])

    def test_successful_download_replaces_corrupt_asset(self):
        path = self.directory / self.name
        path.write_bytes(b"broken")
        with patch.object(get_fonts.urllib.request, "urlopen", return_value=io.BytesIO(self.valid_font)):
            get_fonts.download_asset(self.name, self.directory)
        self.assertEqual(path.read_bytes(), self.valid_font)
        self.assertEqual(list(self.directory.iterdir()), [path])

    def test_interrupted_download_leaves_no_partial_asset(self):
        class InterruptedDownload(io.BytesIO):
            def read(self, size=-1):
                if self.tell():
                    raise TimeoutError("network interrupted")
                return super().read(1024)

        with patch.object(get_fonts.urllib.request, "urlopen", return_value=InterruptedDownload(self.valid_font)):
            with self.assertRaises(TimeoutError):
                get_fonts.download_asset(self.name, self.directory)
        self.assertEqual(list(self.directory.iterdir()), [])

    def test_check_is_read_only_and_returns_failure_for_missing_asset(self):
        absent_directory = self.directory / "absent"
        output = io.StringIO()
        with patch.dict(get_fonts.FONTS, {self.name: "courierprime/CourierPrime-Regular.ttf"}, clear=True), \
                patch.object(get_fonts.urllib.request, "urlopen") as network, contextlib.redirect_stdout(output):
            status = get_fonts.main(["--check", "--json", "--directory", str(absent_directory)])
        self.assertEqual(status, 1)
        self.assertFalse(absent_directory.exists())
        network.assert_not_called()
        diagnostics = json.loads(output.getvalue())
        self.assertFalse(diagnostics["ok"])
        self.assertEqual(diagnostics["assets"][0]["status"], "missing")

    def test_check_returns_success_for_valid_assets(self):
        (self.directory / self.name).write_bytes(self.valid_font)
        with patch.dict(get_fonts.FONTS, {self.name: "courierprime/CourierPrime-Regular.ttf"}, clear=True), \
                contextlib.redirect_stdout(io.StringIO()):
            status = get_fonts.main(["--check", "--directory", str(self.directory)])
        self.assertEqual(status, 0)

    def test_failed_download_has_nonzero_status_and_json_error(self):
        output = io.StringIO()
        with patch.dict(get_fonts.FONTS, {self.name: "courierprime/CourierPrime-Regular.ttf"}, clear=True), \
                patch.object(get_fonts.urllib.request, "urlopen", side_effect=TimeoutError("network interrupted")), \
                contextlib.redirect_stdout(output):
            status = get_fonts.main(["--json", "--directory", str(self.directory)])
        self.assertEqual(status, 1)
        self.assertIn("network interrupted", json.loads(output.getvalue())["assets"][0]["download_error"])


if __name__ == "__main__":
    unittest.main()
