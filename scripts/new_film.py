# -*- coding: utf-8 -*-
"""新建 Concept Reel 工程，不复制渲染引擎。

  python scripts/new_film.py <工程目录> --world C --title "片名" --duration 30

--style 提供 15 种可调整的动态设计起点；--list-styles / --describe-style 查询配方。
B 寓言与 C 夜曲保留兼容。
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

if __package__:
    from .styles import get_style, load_styles
else:
    from styles import get_style, load_styles

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

STYLE_SKELETON = """/* Concept Reel · {name}
 * 这是骨架，尚未绘制主体。根据 storyboard.md 写自己的场景。
 * 风格配方见 references/styles.md；STYLE 可按内容调整。
 * VStyles.demo 仅用于风格实验，不能替代本片分镜。 */
(function () {{
'use strict';
const {{ W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rng, rgba, mix }} = VK;
const K = VKit, S = VStyles;
const STYLE = {profile};
const P = STYLE.palette;

const T = {{ end: {duration} }};
const SUBS = [
  // {{ a: 0.8, b: 4.2, zh: '解释一句{{关键词}}。' }},
];

function scene1(fr, t) {{
  // 主体、动作与构图由本片内容决定。不要在 draw 中累计模拟状态。
}}

VK.film({{
  dur: T.end, fps: {fps}, theme: 'flat', meta: {{ title: {title}, style: {style_id} }},
  draw(fr, t) {{
    S.apply(fr, STYLE, t);
    scene1(fr, t);
    S.caption(fr, t, SUBS, STYLE);
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


def create_project(project, *, world=None, style=None, title=None, duration=30, fps=30, force=False):
    """Create only project files; refuse partial or unsafe overwrites."""
    if world is not None and style is not None:
        raise ValueError("--style 与 --world 不能同时指定")
    profile = get_style(style) if style is not None else None
    world = (world or "C").upper()
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
    if profile is None:
        film = SKELETON.format(name=name, theme=theme, subs=subs, pal=pal, standing=standing,
                              duration=repr(duration), fps=fps, title=json.dumps(title, ensure_ascii=True),
                              en=", en: '……'" if world == "C" else "")
    else:
        name = f'{profile["name"]}（{profile["id"]}）'
        film = STYLE_SKELETON.format(name=name, profile=json.dumps(profile, ensure_ascii=False, indent=2),
                                    duration=repr(duration), fps=fps, title=json.dumps(title, ensure_ascii=True),
                                    style_id=json.dumps(profile["id"]))
    storyboard = STORYBOARD.format(title=markdown_title(title), duration=f"{duration:g}", fps=fps, world=name)
    if profile is not None:
        p = profile["palette"]
        visual = (f'- 主风格：{name}；选型理由与适用镜头：待填写。\n'
                  f'- 保留特征：{"；".join(profile["signature"])}。\n'
                  f'- 配色起点：背景 {p["bg"]}，主体 {p["ink"]}，强调 {p["accent"]}，辅助 {p["secondary"]}。\n'
                  f'- 字体键：{profile["font"]}；动作参考：{profile["motion"]["duration"]} 秒 / {profile["motion"]["easing"]}。\n'
                  f'- 实现范围：{profile["implementation"]}\n'
                  '- 辅风格、变化策略与颜色含义：待填写。')
        storyboard = storyboard.replace('- 字体角色、颜色含义、空间关系与运动速度：待填写。', visual)
    project.mkdir(parents=True, exist_ok=True)
    generated[0].write_text(index, encoding="utf-8", newline="\n")
    generated[1].write_text(film, encoding="utf-8", newline="\n")
    if not generated[2].exists():
        generated[2].write_text(storyboard, encoding="utf-8", newline="\n")
    return project


def main(argv=None):
    parser = argparse.ArgumentParser(description="新建内容驱动的 Concept Reel 工程；已有分镜始终保留。")
    profiles = load_styles()
    ids = [item["id"] for item in profiles]
    parser.add_argument("project", type=Path, nargs="?", help="工程目录；查询风格时不需要")
    selection = parser.add_mutually_exclusive_group()
    selection.add_argument("--world", type=str.upper, choices=sorted(WORLD), help="兼容 B 寓言 / C 夜曲；未选择风格时默认 C")
    selection.add_argument("--style", type=str.lower, choices=ids, metavar="ID", help="15 种风格之一，用 --list-styles 查看 ID")
    query = parser.add_mutually_exclusive_group()
    query.add_argument("--list-styles", action="store_true", help="列出 15 种风格与适用内容，不创建工程")
    query.add_argument("--describe-style", type=str.lower, choices=ids, metavar="ID", help="显示风格的特征、配方与实现范围")
    parser.add_argument("--json", action="store_true", help="风格查询以 JSON 输出（只用于 --list-styles / --describe-style）")
    parser.add_argument("--title", help="片名，默认使用工程目录名")
    parser.add_argument("--duration", type=positive_duration, metavar="SECONDS", help="时长（秒），默认 30")
    parser.add_argument("--fps", type=positive_fps, help="帧率（正整数），默认 30")
    parser.add_argument("--force", action="store_true", help="覆盖 index.html 和 film.js；保留已有 storyboard.md")
    args = parser.parse_args(argv)
    if args.list_styles or args.describe_style:
        if any(value is not None for value in (args.project, args.style, args.world, args.title, args.duration, args.fps)) or args.force:
            parser.error("风格查询不能与工程路径或创建选项混用")
        data = get_style(args.describe_style) if args.describe_style else profiles
        if args.json:
            print(json.dumps(data, ensure_ascii=False, indent=2))
        elif args.describe_style:
            print(f'{data["id"]} · {data["name"]} / {data["en_name"]}')
            for label, key in (("特征", "signature"), ("适合", "use_cases"), ("配方", "recipe"), ("避免", "avoid")):
                print(f'{label}：' + '；'.join(data[key]))
            print('实现：' + data["implementation"])
        else:
            for item in data:
                print(f'{item["id"]:16} {item["name"]} · {" / ".join(item["use_cases"])}')
        return 0
    if args.project is None:
        parser.error("创建工程需要 project；查询风格请用 --list-styles 或 --describe-style")
    if args.json:
        parser.error("--json 只用于风格查询")
    try:
        project = create_project(args.project, world=args.world, style=args.style, title=args.title,
                                 duration=args.duration if args.duration is not None else 30.0,
                                 fps=args.fps if args.fps is not None else 30, force=args.force)
    except (OSError, ValueError) as exc:
        print(f"错误：{exc}", file=sys.stderr)
        return 1
    render_command = shlex.join([sys.executable, str(ROOT / "engine/render.py"), str(project)])
    selected_name = get_style(args.style)["name"] if args.style else WORLD[args.world or "C"][0]
    print(f"建好了：{project}（{selected_name}）\n"
          f"  预览  {render_command} --serve\n"
          f"  拼图  {render_command} --sheet 16\n"
          f"  渲染  {render_command}\n"
          "下一步：填写 storyboard.md，再从最难解释的一镜开始写 film.js。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
