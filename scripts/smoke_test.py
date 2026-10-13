#!/usr/bin/env python3
"""Run the real browser → video → events → audio pipeline on a tiny film."""
import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def run(*args, capture=False):
    result = subprocess.run([str(arg) for arg in args], check=True, text=True,
                            capture_output=capture, timeout=240)
    return result.stdout if capture else None


def probe(path):
    return json.loads(run('ffprobe', '-v', 'error', '-count_frames',
                          '-show_streams', '-show_format', '-of', 'json', path, capture=True))


def check_video(path, with_audio=False):
    info = probe(path)
    video = next(s for s in info['streams'] if s['codec_type'] == 'video')
    if (video['width'], video['height'], int(video['nb_read_frames'])) != (1920, 1080, 24):
        raise RuntimeError(f'Unexpected video dimensions/frame count: {video}')
    if abs(float(video['duration']) - 2) > .1:
        raise RuntimeError(f'Unexpected duration: {video["duration"]}')
    if with_audio and not any(s['codec_type'] == 'audio' for s in info['streams']):
        raise RuntimeError('Final MP4 has no audio stream')


def check_pipeline(project, browser):
    project.mkdir(parents=True, exist_ok=True)
    names = ('index.html', 'film.js', 'storyboard.md')
    for name in names:
        if (project / name).exists():
            raise ValueError(f'Refusing to replace existing smoke artifact: {project / name}')
    for name in names:
        shutil.copyfile(ROOT / 'examples/smoke' / name, project / name)
    render = [sys.executable, ROOT / 'engine/render.py', project, '--browser', browser]
    run(*render, '--stills', '.8')
    run(*render, '--det')
    run(*render)
    check_video(project / 'renders/raw.mp4')
    shutil.copyfile(project / 'renders/raw.mp4', project / 'renders/serial.mp4')
    run(*render, '--jobs', '3')
    check_video(project / 'renders/raw.mp4')
    run(*render, '--events')
    spec = json.loads((project / 'audio/events.json').read_text(encoding='utf-8'))
    if [(e[0], e[1]) for e in spec['events']] != [(.200123, 'tick'), (1.3, 'soft')]:
        raise RuntimeError(f'Unexpected event collection: {spec["events"]}')
    run(sys.executable, ROOT / 'engine/audio.py', project)
    check_video(project / 'renders/final.mp4', with_audio=True)
    print('Smoke passed: screenshot, deterministic seek, serial/parallel video, events, final audio.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', choices=('chromium', 'chrome'), default='chromium')
    parser.add_argument('--output', type=Path, help='Preserve artifacts in an empty directory')
    args = parser.parse_args()
    try:
        if args.output:
            check_pipeline(args.output.resolve(), args.browser)
        else:
            with tempfile.TemporaryDirectory(prefix='concept-reel-smoke-') as temporary:
                check_pipeline(Path(temporary), args.browser)
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as exc:
        print(f'Smoke failed: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
