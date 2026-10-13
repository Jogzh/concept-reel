"""Audio input, actual WAV generation, and FFmpeg invocation regressions."""
import contextlib
import copy
import io
import json
from pathlib import Path
import re
import tempfile
import unittest
from unittest import mock
import wave

import numpy as np

from engine import audio


class AudioTests(unittest.TestCase):
    def spec(self):
        return {"end": .1, "events": [[.01, "tick", {}]], "meta": {"drone": 0}}

    def test_invalid_specs_fail_before_synthesis(self):
        invalid = [None, [], {}, {"end": 1, "events": None}]
        for end in (0, -1, float("nan"), float("inf"), True, "1"):
            invalid.append(dict(self.spec(), end=end))
        for event in ([.01, "typo", {}], [.01, "tick"], [-1, "tick", {}],
                      [2, "tick", {}], [.01, "tick", None], [.01, "rise", {"dur": 0}],
                      [.01, "hush", {"dur": float("nan")}], [.01, "hush", {"dur": -1}],
                      [.01, "rise", {"dur": float("inf")}], [.01, "hush", {"dur": True}],
                      [.01, "tick", {"gain": float("nan")}], [.01, "tick", {"pitch": True}]):
            invalid.append(dict(self.spec(), events=[event]))
        for meta in ([], {"root": "C"}, {"drone": -1}, {"drone": 2},
                     {"noise": [[0, .1, 1.1]]}, {"noise": [[0, .1]]},
                     {"silence": [[.1, 0]]}, {"silence": [[-.1, .1]]}):
            invalid.append(dict(self.spec(), meta=meta))
        for spec in invalid:
            with self.subTest(spec=spec), mock.patch.object(audio, "reverb") as reverb:
                with self.assertRaises(ValueError):
                    audio.synth(spec)
                reverb.assert_not_called()

    def test_unknown_event_is_an_actionable_error(self):
        with self.assertRaisesRegex(ValueError, "未知音效.*typo.*可用音效"):
            audio.validate_spec(dict(self.spec(), events=[[0, "typo", {}]]))

    def test_legacy_flash_matches_bloom_with_global_root(self):
        bloom = {"end": .1, "events": [[0, "bloom", {"root": 2}]], "meta": {"root": -5}}
        flash = copy.deepcopy(bloom)
        flash["events"][0][1] = "flash"
        self.assertTrue(np.array_equal(audio.synth(bloom, bgm=True), audio.synth(flash, bgm=True)))

    def test_synthesis_is_deterministic_and_finite(self):
        first = audio.synth(self.spec())
        second = audio.synth(self.spec())
        self.assertTrue(np.array_equal(first, second))
        self.assertTrue(np.isfinite(first).all())
        self.assertEqual(first.shape[1], 2)
        self.assertGreater(np.abs(first).max(), 0)

    def test_hush_mutes_then_recovers_after_the_pause(self):
        spec = {"end": 2, "events": [[.2, "hush", {"dur": .5}]]}
        sound = audio.synth(spec)
        quiet = sound[int(.4 * audio.SR):int(.6 * audio.SR)]
        resumed = sound[int(1.2 * audio.SR):int(1.4 * audio.SR)]
        self.assertEqual(np.abs(quiet).max(), 0)
        self.assertGreater(np.abs(resumed).max(), 0)

    def test_legacy_and_new_bgm_gain_arguments(self):
        legacy = audio.parse_args(["project", "--bgm", "song.mp3", "-8"])
        modern = audio.parse_args(["project", "--bgm", "song.mp3", "--bgm-db", "-8"])
        self.assertEqual(legacy.bgm_path, modern.bgm_path)
        self.assertEqual(legacy.bgm_db, modern.bgm_db)
        self.assertEqual(audio.parse_args(["project", "--bgm", "song.mp3"]).bgm_db, -8)

    def test_invalid_cli_gain_is_rejected(self):
        for flags in (["--bgm-db", "-8"], ["--bgm", "song.mp3", "oops"],
                      ["--bgm", "song.mp3", "-8", "--bgm-db", "-7"],
                      ["--bgm", "song.mp3", "--bgm-db", "nan"], ["--bgm"]):
            with self.subTest(flags=flags), contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as result:
                    audio.parse_args(["project", *flags])
                self.assertEqual(result.exception.code, 2)

    def test_short_film_bgm_fades_stay_within_duration(self):
        for end in (.1, .8, 1.5, 30):
            with self.subTest(end=end):
                command = audio.build_mux_command("raw.mp4", "score.wav", "final.mp4", end, "song.mp3")
                fc = command[command.index("-filter_complex") + 1]
                match = re.search(r"afade=t=out:st=([^:]+):d=([^\[]+)", fc)
                start, duration = map(float, match.groups())
                self.assertGreaterEqual(start, 0)
                self.assertGreater(duration, 0)
                self.assertAlmostEqual(start + duration, end)

    def test_wav_only_produces_real_audio_without_ffmpeg_or_video(self):
        with tempfile.TemporaryDirectory() as tmp:
            project = Path(tmp)
            (project / "audio").mkdir()
            (project / "audio/events.json").write_text(json.dumps(self.spec()), encoding="utf-8")
            with mock.patch.object(audio.shutil, "which", side_effect=AssertionError("ffmpeg queried")), \
                    mock.patch.object(audio.subprocess, "run", side_effect=AssertionError("ffmpeg invoked")), \
                    contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(audio.main([str(project), "--wav-only"]), 0)
            with wave.open(str(project / "audio/score.wav"), "rb") as wav:
                self.assertEqual(wav.getnchannels(), 2)
                self.assertEqual(wav.getsampwidth(), 2)
                self.assertEqual(wav.getframerate(), audio.SR)
                self.assertGreater(wav.getnframes(), 0)
            self.assertFalse((project / "renders").exists())

    def test_missing_video_fails_before_writing_score(self):
        with tempfile.TemporaryDirectory() as tmp:
            project = Path(tmp)
            (project / "audio").mkdir()
            (project / "audio/events.json").write_text(json.dumps(self.spec()), encoding="utf-8")
            error = io.StringIO()
            with contextlib.redirect_stderr(error):
                self.assertEqual(audio.main([str(project)]), 1)
            self.assertIn("--wav-only", error.getvalue())
            self.assertFalse((project / "audio/score.wav").exists())

    def test_missing_events_reports_export_step(self):
        with tempfile.TemporaryDirectory() as tmp:
            error = io.StringIO()
            with contextlib.redirect_stderr(error):
                self.assertEqual(audio.main([tmp, "--wav-only"]), 1)
            self.assertIn("--events", error.getvalue())
            self.assertNotIn("Traceback", error.getvalue())


if __name__ == "__main__":
    unittest.main()
