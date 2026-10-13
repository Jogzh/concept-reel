# -*- coding: utf-8 -*-
"""按画面事件表合成配乐和音效，再和画面合成成片。
  python audio.py <工程目录>                       # 读 audio/events.json → audio/score.wav → renders/final.mp4
  python audio.py <工程目录> --bgm 曲子.mp3 --bgm-db -8
  python audio.py <工程目录> --bgm 曲子.mp3 -8     # 兼容旧写法
  python audio.py <工程目录> --wav-only            # 只出 wav，不合成

事件表由 render.py --events 导出：film.js 里每个 fr.sfx(时刻, 名字, 参数) 就是一条。
声音的写法学自参考片（C 家族）：
  低频长音垫底 · 每章开头一记带泛音的钟/垫和弦（约 8 秒衰减）· 屏幕上每打一个字一声"嗒" ·
  提问处一个上滑音 · 说到噪声就真的铺噪声 · 定理落地的那一下之后留 2–3 秒彻底静音（hush）。
事件名：tick / soft / chord / bloom / flash / rise / thud / tock / stamp / shimmer / hush（参数 dur，秒）
META（film.js 的 meta）：{ root: 半音偏移, noise: [[起,止,强度0..1],...], silence: [[起,止],...], drone: 0..1 }
"""
import argparse
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path
import numpy as np
from scipy.signal import fftconvolve, lfilter, butter

SR = 48000
D3 = 146.83
PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]           # 大调五声，嗒声从这里取音高
CHORD = [0, 7, 12, 14, 19, 24, 26]                   # 根音、五度、八度、九度…… 叠成"开阔"的和弦

def hz(semi, base=D3): return base * 2 ** (semi / 12)
def env_exp(n, tau, attack=0.004):
    t = np.arange(n) / SR
    return np.minimum(1, t / attack) * np.exp(-t / tau)
def lowpass(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), "low"); return lfilter(b, a, x, axis=0)
def highpass(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), "high"); return lfilter(b, a, x, axis=0)
def pan(x, p):                                        # p: -1 左 … 1 右
    l, r = np.cos((p + 1) * np.pi / 4), np.sin((p + 1) * np.pi / 4); return np.stack([x * l, x * r], 1)
def add(buf, x, t):
    i = int(t * SR)
    if i >= len(buf) or i < 0: return
    n = min(len(x), len(buf) - i); buf[i:i + n] += x[:n]

def tone(f, dur, tau, partials=((1, 1.0),), attack=0.004, vib=0.0):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for mult, amp in partials:
        ph = 2 * np.pi * f * mult * t + (vib * np.sin(2 * np.pi * 4.3 * t) if vib else 0)
        out += amp * np.sin(ph) * np.exp(-t / (tau / (1 + 0.35 * (mult - 1))))   # 高次泛音衰减更快
    return out * np.minimum(1, t / attack)

def ev_tick(rng, p):
    f = hz(PENTA[int(p.get("pitch", 0)) % len(PENTA)] + 24)
    x = tone(f, .5, .09, ((1, 1), (2.01, .28), (3.02, .1)), attack=.002)
    click = highpass(rng.standard_normal(int(.012 * SR)) * env_exp(int(.012 * SR), .003), 3000) * .25
    x[:len(click)] += click
    return pan(x * .16 * p.get("gain", 1), rng.uniform(-.35, .35))
def ev_soft(rng, p):
    return pan(tone(hz(12 + 7), 2.2, .7, ((1, 1), (2, .2)), attack=.03) * .12 * p.get("gain", 1), 0)
def ev_chord(rng, p):
    root = p.get("root", 0); n = int(9 * SR); out = np.zeros((n, 2))
    for k, semi in enumerate(CHORD):
        f = hz(root + semi); x = tone(f, 9, 2.6 - k * .12, ((1, 1), (2.003, .32), (3.01, .14), (4.02, .06)), attack=.012, vib=.6)
        out += pan(x * (.11 / (1 + k * .22)), (k % 3 - 1) * .5)
    sub = tone(hz(root - 12), 6, 2.2, ((1, 1),), attack=.02)
    out[:len(sub)] += pan(sub * .16, 0)
    return out * p.get("gain", 1)
def ev_bloom(rng, p):                                 # 闪白：和弦 + 一口气的噪声扫过
    out = ev_chord(rng, {"root": p.get("root", 0), "gain": 1.15 * p.get("gain", 1)})
    n = int(1.6 * SR); ns = rng.standard_normal((n, 2)) * env_exp(n, .35, .01)[:, None]
    out[:n] += lowpass(highpass(ns, 500), 7000) * .12
    return out
def ev_rise(rng, p):                                  # 上滑音：提问、蓄势
    dur = p.get("dur", 1.0); n = int(dur * SR); t = np.arange(n) / SR
    f = hz(7) * 2 ** (t / dur * 1.0); ph = 2 * np.pi * np.cumsum(f) / SR
    e = np.sin(np.pi * np.minimum(1, t / dur) ** 1.6) ** 1.2
    ns = lowpass(rng.standard_normal(n), 2500) * (t / dur) ** 2 * .22
    return pan((np.sin(ph) * .1 + ns * .1) * e * p.get("gain", 1), 0)
def ev_thud(rng, p):
    n = int(.6 * SR); t = np.arange(n) / SR; f = 95 * np.exp(-t * 9) + 48
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, .13, .002) + lowpass(rng.standard_normal(n), 600) * env_exp(n, .04) * .5
    return pan(x * .42 * p.get("gain", 1), 0)
def ev_tock(rng, p):
    f = 520 * 2 ** (int(p.get("pitch", 0)) * 2 / 12); n = int(.25 * SR)
    x = tone(f, .25, .04, ((1, 1), (2.7, .4), (5.1, .15)), attack=.001) + highpass(rng.standard_normal(n), 2500) * env_exp(n, .006) * .3
    return pan(x * .2 * p.get("gain", 1), rng.uniform(-.5, .5))
def ev_stamp(rng, p):
    n = int(.5 * SR); x = ev_thud(rng, {"gain": 1.1})[:n, 0] + highpass(rng.standard_normal(n), 1800) * env_exp(n, .02) * .35
    return pan(x * p.get("gain", 1), 0)
def ev_shimmer(rng, p):
    n = int(2.4 * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for k in range(7): out += np.sin(2 * np.pi * hz(24 + PENTA[k + 2]) * t + rng.uniform(0, 6)) * np.exp(-((t - .25 - k * .06) / .5) ** 2)
    return pan(out * .035 * p.get("gain", 1), 0)
EV = dict(tick=ev_tick, soft=ev_soft, chord=ev_chord, bloom=ev_bloom, rise=ev_rise, thud=ev_thud, tock=ev_tock, stamp=ev_stamp, shimmer=ev_shimmer)
# Existing example films use flash for the same impact as a white-screen bloom.
EV["flash"] = ev_bloom


def finite_number(value, label, *, minimum=None, maximum=None, positive=False):
    """Reject malformed JSON numbers before allocating samples or invoking DSP."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{label} 必须是有限数字")
    try:
        finite = math.isfinite(value)
    except OverflowError:
        finite = False
    if not finite:
        raise ValueError(f"{label} 必须是有限数字")
    if positive and value <= 0:
        raise ValueError(f"{label} 必须大于 0")
    if minimum is not None and value < minimum:
        raise ValueError(f"{label} 不能小于 {minimum}")
    if maximum is not None and value > maximum:
        raise ValueError(f"{label} 不能大于 {maximum}")
    return value


def validate_spec(spec):
    """Validate events.json without silently dropping unknown events."""
    if not isinstance(spec, dict):
        raise ValueError("事件表必须是 JSON 对象")
    end = finite_number(spec.get("end"), "end", positive=True)
    if "fps" in spec:
        finite_number(spec["fps"], "fps", positive=True)
    events = spec.get("events")
    if not isinstance(events, list):
        raise ValueError("events 必须是数组，每项为 [时刻, 事件名, 参数对象]")
    for i, event in enumerate(events):
        label = f"events[{i}]"
        if not isinstance(event, (list, tuple)) or len(event) != 3:
            raise ValueError(f"{label} 必须是 [时刻, 事件名, 参数对象]")
        when, name, params = event
        finite_number(when, f"{label} 的时刻", minimum=0, maximum=end)
        if not isinstance(name, str) or name not in set(EV) | {"hush"}:
            names = ", ".join(sorted(set(EV) | {"hush"}))
            raise ValueError(f"{label} 未知音效 {name!r}；可用音效：{names}")
        if not isinstance(params, dict):
            raise ValueError(f"{label} 的参数必须是对象")
        for key in ("gain", "root", "pitch"):
            if key in params:
                finite_number(params[key], f"{label}.{key}")
        if "dur" in params:
            finite_number(params["dur"], f"{label}.dur", positive=True)
    meta = spec.get("meta")
    if meta is None:
        meta = {}
    if not isinstance(meta, dict):
        raise ValueError("meta 必须是对象")
    if "root" in meta:
        finite_number(meta["root"], "meta.root")
    if "drone" in meta:
        finite_number(meta["drone"], "meta.drone", minimum=0, maximum=1)
    for key, size in (("noise", 3), ("silence", 2)):
        spans = meta.get(key, [])
        if not isinstance(spans, list):
            raise ValueError(f"meta.{key} 必须是数组")
        for i, span in enumerate(spans):
            label = f"meta.{key}[{i}]"
            if not isinstance(span, (list, tuple)) or len(span) != size:
                raise ValueError(f"{label} 必须包含 {size} 个数字")
            start = finite_number(span[0], f"{label} 起点", minimum=0, maximum=end)
            stop = finite_number(span[1], f"{label} 终点", minimum=0)
            if stop <= start:
                raise ValueError(f"{label} 的终点必须大于起点")
            if key == "noise":
                finite_number(span[2], f"{label} 强度", minimum=0, maximum=1)
    return spec

def reverb(x, rng, t60=3.6, wet=.42):
    n = int(t60 * SR); t = np.arange(n) / SR
    ir = lowpass(rng.standard_normal((n, 2)) * np.exp(-6.9 * t / t60)[:, None], 5200); ir[:int(.012 * SR)] *= np.linspace(0, 1, int(.012 * SR))[:, None]
    ir /= np.sqrt((ir ** 2).sum(0)).max()
    wetsig = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in (0, 1)], 1)
    return x + wetsig * wet

def synth(spec, bgm=False):
    validate_spec(spec)
    end = spec["end"]; meta = spec.get("meta") or {}; n = int((end + .05) * SR); rng = np.random.default_rng(20261006)
    dry = np.zeros((n, 2)); t = np.arange(n) / SR; root = meta.get("root", 0)
    hush = [(when, when + p.get("dur", 2.5)) for when, name, p in spec["events"] if name == "hush"]
    for when, name, p in spec["events"]:
        if name in EV: add(dry, EV[name](rng, dict(p, root=p.get("root", 0) + root) if name in ("chord", "bloom", "flash") else p), when)
    out = reverb(dry, rng)
    if not bgm:                                       # 低频长音垫底：两个略微失谐的正弦 + 很慢的呼吸
        lv = .05 * meta.get("drone", 1)
        d = (np.sin(2 * np.pi * hz(root - 24) * t) + .6 * np.sin(2 * np.pi * hz(root - 24 + .08) * 2 * t) + .25 * np.sin(2 * np.pi * hz(root - 12 + 7) * t)) * (.75 + .25 * np.sin(2 * np.pi * t / 11))
        air = lowpass(highpass(rng.standard_normal(n), 300), 1800) * .012 * (.6 + .4 * np.sin(2 * np.pi * t / 17))
        out += np.stack([d * lv + air, d * lv + np.roll(air, 4000)], 1)
    for a, b, k in meta.get("noise", []):             # 文案说到噪声，配乐里就真的有噪声
        g = np.clip((t - a) / max(.01, b - a), 0, 1) ** 1.5 * (t <= b) * k
        out += lowpass(highpass(rng.standard_normal((n, 2)), 200), 6000) * (g * .12)[:, None]
    g = np.ones(n)
    for a, b in list(meta.get("silence", [])) + hush:  # 彻底静音：0.15s 收掉，0.4s 回来
        g *= 1 - np.clip((t - a) / .15, 0, 1) * (1 - np.clip((t - b) / .4, 0, 1))
    g *= np.clip(t / .6, 0, 1) * np.clip((end - t) / 1.2, 0, 1)
    out *= g[:, None]
    return out

def write_wav(path, x):
    import wave
    x = np.clip(x, -1, 1); pcm = (x * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

def build_mux_command(raw, wav, out, end, bgm=None, bgm_db=-8, ffmpeg="ffmpeg"):
    """Keep fades inside even a sub-second film and pass paths as argv items."""
    cmd = [ffmpeg, "-v", "error", "-y", "-i", str(raw), "-i", str(wav)]
    if bgm:
        fade_out = min(1.5, end)
        fade_in = min(.4, end)
        fc = (f"[2:a]atrim=0:{end},volume={bgm_db}dB,"
              f"afade=t=in:d={fade_in},afade=t=out:st={max(0, end - fade_out)}:d={fade_out}[b];"
              "[1:a][b]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]")
        cmd += ["-stream_loop", "-1", "-i", str(bgm), "-filter_complex", fc]
    else:
        cmd += ["-filter_complex", "[1:a]loudnorm=I=-18:TP=-1.5:LRA=14[a]"]
    return cmd + ["-map", "0:v:0", "-map", "[a]", "-c:v", "copy", "-c:a", "aac",
                  "-b:a", "192k", "-ar", str(SR), "-shortest", str(out)]


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="从事件表合成声音，并与 renders/raw.mp4 合成成片。")
    parser.add_argument("project", type=Path, help="包含 audio/events.json 的工程目录")
    parser.add_argument("--bgm", nargs="+", metavar="FILE", help="配乐路径；兼容旧写法 --bgm FILE -8")
    parser.add_argument("--bgm-db", type=float, help="配乐音量（dB），默认 -8")
    parser.add_argument("--wav-only", action="store_true", help="仅生成 score.wav，无需视频或 ffmpeg；配乐在合成视频时加入")
    args = parser.parse_args(argv)
    args.bgm_path = None
    legacy_db = None
    if args.bgm:
        if len(args.bgm) > 2:
            parser.error("--bgm 仅接收配乐路径和可选的旧式 dB 参数")
        args.bgm_path = Path(args.bgm[0]).expanduser().resolve()
        if len(args.bgm) == 2:
            if args.bgm_db is not None:
                parser.error("旧式 dB 参数与 --bgm-db 请只使用一种")
            try:
                legacy_db = float(args.bgm[1])
            except ValueError:
                parser.error("--bgm 后的第二个参数必须是 dB 数值")
    elif args.bgm_db is not None:
        parser.error("--bgm-db 需要同时指定 --bgm FILE")
    args.bgm_db = args.bgm_db if args.bgm_db is not None else (legacy_db if legacy_db is not None else -8)
    if not math.isfinite(args.bgm_db):
        parser.error("配乐 dB 必须是有限数字")
    return args


def main(argv=None):
    args = parse_args(argv)
    proj = args.project.expanduser().resolve()
    try:
        events_path = proj / "audio/events.json"
        if not events_path.is_file():
            raise ValueError(f"未找到事件表 {events_path}；请先运行 render.py 工程目录 --events")
        with events_path.open(encoding="utf-8") as source:
            spec = validate_spec(json.load(source))
        raw, out = proj / "renders/raw.mp4", proj / "renders/final.mp4"
        if args.bgm_path and not args.bgm_path.is_file():
            raise ValueError(f"未找到配乐文件：{args.bgm_path}")
        ffmpeg = None
        if not args.wav_only:
            if not raw.is_file():
                raise ValueError(f"未找到视频 {raw}；请先渲染画面，或使用 --wav-only")
            ffmpeg = shutil.which("ffmpeg")
            if not ffmpeg:
                raise ValueError("未找到 ffmpeg；请安装并加入 PATH，或使用 --wav-only")
        x = synth(spec, bgm=bool(args.bgm_path))
        if not np.isfinite(x).all():
            raise ValueError("音频合成产生非有限数值，请检查音高和增益参数")
        pk = np.abs(x).max() or 1
        x = x / pk * 10 ** (-3 / 20)
        wav = proj / "audio/score.wav"
        write_wav(wav, x)
        print("score:", wav, f"{len(x) / SR:.1f}s", len(spec["events"]), "events")
        if not args.wav_only:
            cmd = build_mux_command(raw, wav, out, spec["end"], args.bgm_path, args.bgm_db, ffmpeg)
            subprocess.run(cmd, check=True)
            print("done", out)
        return 0
    except (OSError, ValueError) as exc:
        print(f"错误：{exc}", file=sys.stderr)
        return 1
    except subprocess.CalledProcessError as exc:
        print(f"错误：ffmpeg 合成失败（退出码 {exc.returncode}）", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
