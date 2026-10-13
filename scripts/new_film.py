# -*- coding: utf-8 -*-
"""新建 Concept Reel 工程，不复制渲染引擎。

  python scripts/new_film.py <工程目录> --world C --title "片名" --duration 30

B 寓言（心理和行为机制）· C 夜曲（抽象概念、看不见的机制）。
生成 index.html、film.js 和内容驱动的 storyboard.md；已有分镜始终保留。
film.js 只提供可运行的骨架，每一镜应根据分镜现写。
"""

import argparse
import html
import json
import math
import re
import shlex
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORLD = {
    "B": ("B 寓言", "flat", "flat", "flat", "仪表 K.gauge、片名卡 K.titleGilt；场景自己画进 fr.look.under"),
    "C": ("C 夜曲", "night", "night", "night", "章节标 K.chapterMark、片名卡 K.titleNight；字幕带一行英文（en）"),
}
SKELETON = """/* Concept Reel · {name}
 * 这是骨架，尚未绘制画面。每一镜照 storyboard.md 现写。
 * 每个场景先回答：这是什么 / 它在干什么 / 观众明白了什么。
 * 事实、出处与示意范围写在 storyboard.md 中。
 * 常驻元素：{standing}。规格见 references/worlds.md。 */
(function () {{
'use strict';
const {{ W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rng, rgba, mix }} = VK;
const K = VKit, P = K.PAL.{pal};

const T = {{ end: {duration} }};                 // 时间轴集中维护，单位为秒
const SUBS = [                                 // 一句字幕一行；{{词}} 金色，{{!词}} 红色
  // {{ a: 0.8, b: 4.2, zh: '……'{en} }},
];

// 先实现最难解释的一镜，再扩展全片。
function scene1(fr, t) {{
}}

VK.film({{
  dur: T.end, fps: {fps}, theme: '{theme}', meta: {{ title: {title} }},
  draw(fr, t) {{
    scene1(fr, t);
    K.subs(fr, t, SUBS, '{subs}');                // 字幕最后画，保持清晰
  }},
}});
}})();
"""

STORYBOARD = """# {title} · 分镜与事实表

目标：{duration} 秒，{fps} fps，1920 × 1080，{world}，无旁白。
这是制作计划，镜头时长和构图由内容决定；请在编码前填写并核实。

## 核心问题与观看收获

- 一句话问题：待填写。
- 观众看完能解释的机制：待填写。
- 观众认得的主体或日常例子：待填写。
- 适用条件与示意边界：待填写。

## 事实与出处

| 事实 / 数字 | 来源与链接 | 核验结果 / 适用条件 | 哪一镜使用 |
| --- | --- | --- | --- |
| 待填写 | 待填写 | 待核实 | 待填写 |

## 分镜

每一镜只承担一个清楚的叙事任务。先安排主体、视线和留白，再放文字。
不要把下表的示例行当作固定镜头模板；可增加、删除或合并镜头。

| 镜头 / 时间 | 叙事任务 | 主体与视觉重心 | 文案及阅读顺序 | 图文关系与关键动作 | 完整阅读停留 | 声音 |
| --- | --- | --- | --- | --- | --- | --- |
| 开场 / 待定 | 提出一个具体问题 | 待填写 | 待填写 | 主体先提供观察线索 | 完整显现后计时 | 待填写 |
| 解释 / 待定 | 展示条件与变化原因 | 待填写 | 待填写 | 标注靠近对象，动作解释关系 | 同时看图读字要额外留时间 | 待填写 |
| 结尾 / 待定 | 收束理解 | 待填写 | 待填写 | 减少元素，运动逐渐停下 | 结论读完后再淡出 | 待填写 |

## 视觉约定与时间轴

- 字体角色、颜色含义、空间关系与运动速度：待填写。
- 每个关键动作的起点、过程、落点：待填写。
- 字幕稳定可读；标题、关键词、标签的位置由当前镜头决定。
- 中文可先按每秒 5–7 个字估算，术语与推理适当放慢。
- 使用绝对视频时间与固定随机种子；跳帧和重复截图应得到一致结果。
- 在 film.js 的 T 中维护关键时刻，把转场和阅读停留计入 {duration} 秒。

## 验收记录

- [ ] 每镜回答：这是什么、它在干什么、观众明白了什么。
- [ ] 画面承载信息，主体与文字没有遮挡或争夺焦点。
- [ ] 文字完整显现后能稳定读完，结论获得停顿。
- [ ] 检查入场、完整阅读、关键动作、离场与转场中点。
- [ ] 在目标观看尺寸检查长句、标点、数字和字幕安全区。
- [ ] 核实事实边界、字形、时间轴与音画同步。
- [ ] 记录技术检查与视觉检查的实际结果。

检查结果与待改时间点：待填写。
"""


def positive_duration(value):
    try:
        duration = float(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("时长必须是秒数") from exc
    if not math.isfinite(duration) or duration <= 0:
        raise argparse.ArgumentTypeError("时长必须是大于 0 的有限秒数")
    return duration


def positive_fps(value):
    try:
        fps = int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("fps 必须是正整数") from exc
    if fps <= 0:
        raise argparse.ArgumentTypeError("fps 必须是正整数")
    return fps


def markdown_title(value):
    # Keep user text in one heading and avoid accidental Markdown formatting.
    value = " ".join(value.splitlines())
    return re.sub(r"([\\`*_{}\[\]<>#|])", r"\\\1", value)


def create_project(project, *, world="C", title=None, duration=30, fps=30, force=False):
    """Create only project files; refuse partial or unsafe overwrites."""
    world = world.upper()
    if world not in WORLD:
        raise ValueError("--world 只能是 C 或 B")
    duration = positive_duration(str(duration))
    fps = positive_fps(str(fps))
    project = Path(project).expanduser().resolve()
    title = title if title is not None else project.name
    if not isinstance(title, str) or not title.strip():
        raise ValueError("片名不能为空")
    if project.exists() and not project.is_dir():
        raise ValueError(f"工程路径不是目录：{project}")
    generated = [project / name for name in ("index.html", "film.js", "storyboard.md")]
    for path in generated:
        if path.is_symlink():
            raise ValueError(f"不能写入符号链接：{path}")
        if path.exists() and not path.is_file():
            raise ValueError(f"工程文件路径被目录占用：{path}")
    existing = [path for path in generated[:2] if path.exists()]
    if existing and not force:
        names = ", ".join(path.name for path in existing)
        raise ValueError(f"{names} 已存在；如需重建骨架请加 --force（已有 storyboard.md 始终保留）")
    name, theme, subs, pal, standing = WORLD[world]
    index = (ROOT / "engine/index.html").read_text(encoding="utf-8")
    index, title_count = re.subn(r"<title>.*?</title>", lambda _: f"<title>{html.escape(title)}</title>", index, count=1, flags=re.DOTALL)
    if title_count != 1:
        raise ValueError("引擎 index.html 缺少 title 标签")
    film = SKELETON.format(name=name, theme=theme, subs=subs, pal=pal, standing=standing,
                           duration=repr(duration), fps=fps, title=json.dumps(title, ensure_ascii=True),
                           en=", en: '……'" if world == "C" else "")
    storyboard = STORYBOARD.format(title=markdown_title(title), duration=f"{duration:g}", fps=fps, world=name)
    project.mkdir(parents=True, exist_ok=True)
    generated[0].write_text(index, encoding="utf-8", newline="\n")
    generated[1].write_text(film, encoding="utf-8", newline="\n")
    if not generated[2].exists():
        generated[2].write_text(storyboard, encoding="utf-8", newline="\n")
    return project


def main(argv=None):
    parser = argparse.ArgumentParser(description="新建内容驱动的 Concept Reel 工程；已有分镜始终保留。")
    parser.add_argument("project", type=Path, help="工程目录")
    parser.add_argument("--world", type=str.upper, choices=sorted(WORLD), default="C", help="B 寓言 / C 夜曲，默认 C")
    parser.add_argument("--title", help="片名，默认使用工程目录名")
    parser.add_argument("--duration", type=positive_duration, default=30.0, metavar="SECONDS", help="时长（秒），默认 30")
    parser.add_argument("--fps", type=positive_fps, default=30, help="帧率（正整数），默认 30")
    parser.add_argument("--force", action="store_true", help="覆盖 index.html 和 film.js；保留已有 storyboard.md")
    args = parser.parse_args(argv)
    try:
        project = create_project(args.project, world=args.world, title=args.title, duration=args.duration, fps=args.fps, force=args.force)
    except (OSError, ValueError) as exc:
        print(f"错误：{exc}", file=sys.stderr)
        return 1
    render_command = shlex.join([sys.executable, str(ROOT / "engine/render.py"), str(project)])
    print(f"建好了：{project}（{WORLD[args.world][0]}）\n"
          f"  预览  {render_command} --serve\n"
          f"  拼图  {render_command} --sheet 16\n"
          f"  渲染  {render_command}\n"
          "下一步：填写 storyboard.md，再从最难解释的一镜开始写 film.js。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
