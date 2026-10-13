"""Style profiles must be usable by the shared engine and safe to reuse."""
import math
import unittest

from scripts import styles


STYLE_IDS = {
    "cel-boil", "isometric", "flat-vector", "line-art", "3d-render",
    "morph", "sticker", "hud", "collage", "aurora-glass", "bauhaus",
    "synthwave", "pixel", "liquid", "variety",
}
FONT_KEYS = {
    "serif", "serifm", "serifr", "serifl", "serifx", "serifh",
    "sans", "sansm", "sansr", "sansh", "latin", "latinl", "latinm",
    "latini", "latinim", "lora", "lorar", "mono", "type",
}
EASING_KEYS = {"lin", "in2", "out2", "in3", "out3", "io3", "out5", "outExpo", "outBack"}


class StyleCatalogTests(unittest.TestCase):
    def test_catalog_contains_all_fifteen_distinct_styles(self):
        catalog = styles.load_styles()
        self.assertIsInstance(catalog, list)
        self.assertEqual(len(catalog), 15)
        identifiers = [profile["id"] for profile in catalog]
        self.assertEqual(set(identifiers), STYLE_IDS)
        self.assertEqual(len(identifiers), len(set(identifiers)))

    def test_profiles_have_engine_compatible_settings_and_creation_guidance(self):
        for profile in styles.load_styles():
            with self.subTest(style=profile["id"]):
                self.assertRegex(profile["id"], r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
                for field in ("name", "en_name"):
                    self.assertIsInstance(profile[field], str)
                    self.assertTrue(profile[field].strip(), field)
                self.assertIn(profile["font"], FONT_KEYS)
                palette = profile["palette"]
                for role in ("bg", "ink", "accent", "secondary", "muted"):
                    self.assertRegex(palette[role], r"^#[0-9a-fA-F]{6}$", role)
                self.assertNotEqual(palette["bg"].lower(), palette["ink"].lower())
                for field in ("bloom", "grain"):
                    value = profile["look"][field]
                    self.assertIsInstance(value, (int, float))
                    self.assertNotIsInstance(value, bool)
                    self.assertTrue(math.isfinite(value), field)
                    self.assertGreaterEqual(value, 0, field)
                motion = profile["motion"]
                self.assertIsInstance(motion["duration"], (int, float))
                self.assertNotIsInstance(motion["duration"], bool)
                self.assertTrue(math.isfinite(motion["duration"]))
                self.assertGreater(motion["duration"], 0)
                self.assertIsInstance(motion["fps"], int)
                self.assertNotIsInstance(motion["fps"], bool)
                self.assertGreater(motion["fps"], 0)
                self.assertIn(motion["easing"], EASING_KEYS)
                for field in ("signature", "use_cases", "recipe", "avoid"):
                    self.assertIsInstance(profile[field], list, field)
                    self.assertTrue(profile[field], field)
                    self.assertTrue(all(isinstance(item, str) and item.strip()
                                        for item in profile[field]), field)
                self.assertIsInstance(profile["implementation"], str)
                self.assertTrue(profile["implementation"].strip())

    def test_lookup_is_case_insensitive_and_unknown_style_is_rejected(self):
        for identifier in STYLE_IDS:
            with self.subTest(style=identifier):
                self.assertEqual(styles.get_style(identifier.upper()), styles.get_style(identifier))
        for identifier in ("", "not-a-style", "../hud", None, 123):
            with self.subTest(style=identifier), self.assertRaises(ValueError):
                styles.get_style(identifier)

    def test_lookup_returns_independent_nested_data(self):
        expected = styles.get_style("hud")
        changed = styles.get_style("HUD")
        changed["palette"]["bg"] = "#123456"
        changed["motion"]["fps"] = 1
        changed["look"]["grain"] = 0.9
        changed["signature"].append("mutated locally")
        changed["recipe"][0] = "mutated locally"
        self.assertEqual(styles.get_style("hud"), expected)

    def test_catalog_returns_independent_nested_data(self):
        expected = styles.load_styles()
        changed = styles.load_styles()
        changed[0]["palette"]["bg"] = "#123456"
        changed[0]["signature"].clear()
        changed.pop()
        self.assertEqual(styles.load_styles(), expected)


if __name__ == "__main__":
    unittest.main()
