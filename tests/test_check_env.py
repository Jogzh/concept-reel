import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import check_env


class EnvironmentCheckTests(unittest.TestCase):
    def test_missing_entrypoint_is_reported(self):
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            (project / "film.js").write_text("// scene", encoding="utf-8")
            report = check_env.project_check(project)
        self.assertFalse(report["ok"])
        self.assertIn("index.html", report["detail"])

    def test_shared_engine_and_missing_chapter_scripts_are_resolved(self):
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            (project / "film.js").write_text("// scene", encoding="utf-8")
            html = '<!-- <script src="unused-chapter.js"></script> --><script src="/engine/vk.js"></script><script src="/film.js?v=1"></script>'
            (project / "index.html").write_text(html, encoding="utf-8")
            self.assertTrue(check_env.project_check(project)["ok"])
            (project / "index.html").write_text(html + '<script src="ch1.js"></script>', encoding="utf-8")
            report = check_env.project_check(project)
            self.assertFalse(report["ok"])
            self.assertIn("ch1.js", report["detail"])

    def test_json_and_exit_status_reflect_failed_check(self):
        checks = [check_env.result("ffmpeg", False, "not installed", "Install FFmpeg.")]
        output = io.StringIO()
        with patch.object(check_env, "collect_checks", return_value=checks), contextlib.redirect_stdout(output):
            status = check_env.main(["--json", "--browser", "chrome"])
        self.assertEqual(status, 1)
        self.assertEqual(json.loads(output.getvalue()), {"ok": False, "browser": "chrome", "checks": checks})

    def test_url_encoded_script_names_are_resolved_like_the_server(self):
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            (project / "film.js").write_text("// film", encoding="utf-8")
            (project / "chapter one.js").write_text("// chapter", encoding="utf-8")
            html = '<script src="/engine%2Fvk.js"></script><script src="chapter%20one.js?v=1#ignored"></script>'
            (project / "index.html").write_text(html, encoding="utf-8")
            self.assertTrue(check_env.project_check(project)["ok"])

    def test_outside_symlinks_and_traversal_are_reported_as_unresolved(self):
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory) / "project"
            project.mkdir()
            (project / "film.js").write_text("// film", encoding="utf-8")
            outside = Path(directory) / "outside.js"
            outside.write_text("// outside", encoding="utf-8")
            (project / "linked.js").symlink_to(outside)
            paths = ["linked.js", "../outside.js", "%2e%2e/outside.js", "/engine/%2e%2e/README.md", "%00", "%5coutside.js"]
            for path in paths:
                with self.subTest(path=path):
                    (project / "index.html").write_text(f'<script src="{path}"></script>', encoding="utf-8")
                    report = check_env.project_check(project)
                    self.assertFalse(report["ok"])
                    self.assertIn(path, report["detail"])


if __name__ == "__main__":
    unittest.main()
