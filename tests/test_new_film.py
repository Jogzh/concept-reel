"""Scaffolding must protect user planning and safely embed arbitrary titles."""
import contextlib
import html.parser
import io
import json
from pathlib import Path
import re
import tempfile
import unittest
from unittest import mock

from scripts import new_film, styles


class TitleParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.title = ""
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        self.in_title = tag == "title"
        if tag == "script":
            self.scripts.append(dict(attrs).get("src"))

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


class NewFilmTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.project = Path(self.tmp.name) / "my film"

    def style_from_film(self, film):
        marker = re.search(r"\bconst\s+STYLE\s*=\s*", film)
        self.assertIsNotNone(marker, "Style profile must be embedded as JSON in the film")
        return json.JSONDecoder().raw_decode(film[marker.end():])[0]

    def test_title_cannot_inject_html_or_javascript(self):
        title = '片名 "引号"\\路径\n</title><script>alert(1)</script> */\u2028'
        new_film.create_project(self.project, title=title, duration=12.5, fps=24)
        parser = TitleParser()
        parser.feed((self.project / "index.html").read_text(encoding="utf-8"))
        self.assertEqual(parser.title, title)
        self.assertEqual([src.lstrip("/") for src in parser.scripts],
                         ["engine/vk.js", "engine/vk-kit.js", "engine/vk-styles.js", "film.js"])
        film = (self.project / "film.js").read_text(encoding="utf-8")
        title_marker = re.search(r"meta:\s*\{\s*title:\s*", film)
        self.assertIsNotNone(title_marker)
        self.assertEqual(json.JSONDecoder().raw_decode(film[title_marker.end():])[0], title)
        self.assertIn("end: 12.5", film)
        self.assertIn("fps: 24", film)
        self.assertFalse((self.project / "engine").exists())
        story = (self.project / "storyboard.md").read_text(encoding="utf-8")
        self.assertIn("完整阅读停留", story)
        self.assertIn("事实与出处", story)
        self.assertIn("12.5 秒，24 fps", story)

    def test_default_creation_and_case_insensitive_cli_world(self):
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(new_film.main([str(self.project), "--world", "b"]), 0)
        film = (self.project / "film.js").read_text(encoding="utf-8")
        self.assertIn("theme: 'flat'", film)
        self.assertIn("end: 30.0", film)
        self.assertIn('title: "my film"', film)
        self.assertEqual({p.name for p in self.project.iterdir()}, {"film.js", "index.html", "storyboard.md"})

    def test_default_and_explicit_c_preserve_legacy_night_world(self):
        for index, world in enumerate((None, "C", "c")):
            with self.subTest(world=world):
                project = Path(self.tmp.name) / f"world-{index}"
                new_film.create_project(project, world=world)
                film = (project / "film.js").read_text(encoding="utf-8")
                self.assertIn("theme: 'night'", film)
                self.assertIn("K.PAL.night", film)
                self.assertRegex(film, r"K\.subs\([^;]+['\"]night['\"]")

    def test_all_styles_are_embedded_and_use_shared_style_runtime(self):
        for profile in styles.load_styles():
            with self.subTest(style=profile["id"]):
                project = Path(self.tmp.name) / profile["id"]
                new_film.create_project(project, style=profile["id"], title="风格检验", duration=12.5, fps=24)
                self.assertEqual({path.name for path in project.iterdir()},
                                 {"film.js", "index.html", "storyboard.md"})
                film = (project / "film.js").read_text(encoding="utf-8")
                self.assertEqual(self.style_from_film(film), profile)
                self.assertIn("S.apply(", film)
                self.assertIn("S.caption(", film)
                self.assertRegex(film, r"meta:\s*\{[^}]*\bstyle:")
                self.assertIn("end: 12.5", film)
                self.assertIn("fps: 24", film)
                parser = TitleParser()
                parser.feed((project / "index.html").read_text(encoding="utf-8"))
                self.assertEqual([src.lstrip("/") for src in parser.scripts],
                                 ["engine/vk.js", "engine/vk-kit.js", "engine/vk-styles.js", "film.js"])
                story = (project / "storyboard.md").read_text(encoding="utf-8")
                self.assertIn(profile["name"], story)
                self.assertIn(profile["id"], story)
                self.assertIn(profile["palette"]["bg"], story)
                self.assertFalse((project / "engine").exists())

    def test_style_title_is_safely_embedded(self):
        title = '风格 "标题"\\路径\n</title><script>alert(1)</script> */\u2028'
        new_film.create_project(self.project, style="sticker", title=title)
        parser = TitleParser()
        parser.feed((self.project / "index.html").read_text(encoding="utf-8"))
        self.assertEqual(parser.title, title)
        film = (self.project / "film.js").read_text(encoding="utf-8")
        marker = re.search(r"meta:\s*\{\s*title:\s*", film)
        self.assertIsNotNone(marker)
        self.assertEqual(json.JSONDecoder().raw_decode(film[marker.end():])[0], title)

    def test_case_insensitive_cli_style(self):
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(new_film.main([str(self.project), "--style", "HUD"]), 0)
        film = (self.project / "film.js").read_text(encoding="utf-8")
        self.assertEqual(self.style_from_film(film)["id"], "hud")

    def test_api_rejects_unknown_style_and_explicit_world_style_conflict_without_writing(self):
        invalid = ({"style": "not-a-style"}, {"style": "../hud"},
                   {"world": "B", "style": "hud"}, {"world": "C", "style": "hud"})
        for arguments in invalid:
            with self.subTest(arguments=arguments), self.assertRaises(ValueError):
                new_film.create_project(self.project, **arguments)
            self.assertFalse(self.project.exists())

    def test_cli_rejects_world_style_conflict_without_writing(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as error:
            new_film.main([str(self.project), "--world", "B", "--style", "hud"])
        self.assertEqual(error.exception.code, 2)
        self.assertFalse(self.project.exists())

    def test_style_queries_emit_json_without_a_project_or_file_creation(self):
        queries = ((["--list-styles", "--json"], styles.load_styles()),
                   (["--describe-style", "HUD", "--json"], styles.get_style("hud")))
        for arguments, expected in queries:
            with self.subTest(arguments=arguments):
                output = io.StringIO()
                with mock.patch.object(new_film, "create_project") as create, contextlib.redirect_stdout(output):
                    self.assertEqual(new_film.main(arguments), 0)
                self.assertEqual(json.loads(output.getvalue()), expected)
                create.assert_not_called()
                self.assertFalse(self.project.exists())

    def test_unknown_style_query_is_an_argument_error(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as error:
            new_film.main(["--describe-style", "not-a-style", "--json"])
        self.assertEqual(error.exception.code, 2)
        self.assertFalse(self.project.exists())

    def test_queries_reject_creation_options_without_writing(self):
        for flags in ([str(self.project)], ["--style", "hud"], ["--world", "C"],
                      ["--title", "test"], ["--duration", "5"], ["--fps", "24"], ["--force"]):
            with self.subTest(flags=flags), contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as error:
                    new_film.main(["--list-styles", *flags])
                self.assertEqual(error.exception.code, 2)
                self.assertFalse(self.project.exists())

    def test_overwrite_refusal_does_not_modify_any_file(self):
        self.project.mkdir()
        (self.project / "film.js").write_text("user film", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "--force"):
            new_film.create_project(self.project)
        self.assertEqual((self.project / "film.js").read_text(), "user film")
        self.assertFalse((self.project / "index.html").exists())
        self.assertFalse((self.project / "storyboard.md").exists())

    def test_existing_storyboard_is_preserved_including_force(self):
        self.project.mkdir()
        story = self.project / "storyboard.md"
        story.write_text("already researched facts", encoding="utf-8")
        new_film.create_project(self.project)
        new_film.create_project(self.project, world="B", force=True)
        self.assertEqual(story.read_text(), "already researched facts")
        self.assertIn("theme: 'flat'", (self.project / "film.js").read_text())
        new_film.create_project(self.project, style="pixel", force=True)
        self.assertEqual(story.read_text(), "already researched facts")
        self.assertEqual(self.style_from_film((self.project / "film.js").read_text())["id"], "pixel")

    def test_force_refuses_symlinks_without_touching_target(self):
        self.project.mkdir()
        outside = Path(self.tmp.name) / "outside.js"
        outside.write_text("keep", encoding="utf-8")
        (self.project / "film.js").symlink_to(outside)
        with self.assertRaisesRegex(ValueError, "符号链接"):
            new_film.create_project(self.project, force=True)
        self.assertEqual(outside.read_text(), "keep")
        self.assertFalse((self.project / "index.html").exists())

    def test_directory_collision_does_not_partially_create_project(self):
        self.project.mkdir()
        (self.project / "storyboard.md").mkdir()
        with self.assertRaisesRegex(ValueError, "目录占用"):
            new_film.create_project(self.project, force=True)
        self.assertFalse((self.project / "film.js").exists())

    def test_invalid_cli_values_do_not_create_directory(self):
        for flags in (["--duration", "0"], ["--duration", "nan"], ["--duration", "inf"],
                      ["--duration", "-1"], ["--fps", "0"], ["--fps", "24.5"], ["--world", "A"],
                      ["--style", "not-a-style"], ["--style", "../hud"], ["--style", ""]):
            with self.subTest(flags=flags), contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as result:
                    new_film.main([str(self.project), *flags])
                self.assertEqual(result.exception.code, 2)
                self.assertFalse(self.project.exists())

    def test_blank_title_returns_clean_error(self):
        output = io.StringIO()
        with contextlib.redirect_stderr(output):
            self.assertEqual(new_film.main([str(self.project), "--title", "  "]), 1)
        self.assertIn("片名不能为空", output.getvalue())
        self.assertNotIn("Traceback", output.getvalue())
        self.assertFalse(self.project.exists())


if __name__ == "__main__":
    unittest.main()
