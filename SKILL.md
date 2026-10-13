---
name: concept-reel
description: 使用 Canvas、Playwright 和 FFmpeg 制作或修改无旁白的横屏字幕知识短片，支持 15 种动态设计风格、内容驱动分镜、确定性动画、预览与音效合成。适用于把概念或机制做成可理解的动画；有人声口播、实拍和生成模型视频不属于这套引擎的工作流。
---

# Concept Reel · 概念短片

让画面解释一句话：观众能认出主体，看见变化，理解因果。交付可运行工程、分镜与事实出处，以及请求范围内的预览或成片。

本 skill 目录含共享引擎；工程可以建在用户项目内。命令中的 `engine/`、`scripts/` 相对于本 skill 目录，调用时使用实际路径。当前固定画幅为 1920×1080 横屏；默认 30fps，新建工程可设置帧率。

## 按任务阅读

- 创作或调整镜头：先读 [制作规范](docs/production-guide.md)，再读 [视觉解释方法](references/visualization.md)。
- 写 `film.js` 或调用工具：读 [引擎 API](references/engine.md)。
- 选择或拓展风格：读 [15 种风格与选型](references/styles.md)，用 `--list-styles` / `--describe-style ID` 查询配方；旧 B/C 外观见 [兼容外观](references/worlds.md)。已有风格优先遵循用户要求。
- 调整文案：读 [脚本](references/script.md)。
- 长片、章节、累计曲线与事件：读 [长片经验](references/craft.md)。
- 构图或转场问题：读 [布局](references/layout.md) 与 [视觉语法](references/visual-grammar.md)。
- 需要 brief：读 [提示词示例](references/prompts.md)；复盘示例读 [分析方法](references/analysis.md)。

## 创作原则

- 先决定观众要明白什么，再选择主体与动作。几何图形可用于图表和抽象量；描述真实物体时应有可辨认的形态。
- 字幕中的变化要在屏上发生。数字来自计算，示意、适用条件与不确定事实标清楚；重要事实记录可核查来源。
- 一次只安排一个主要视觉焦点。字幕可稳定，标题、关键词和标签随主体与留白布局。
- 字体、色彩含义和运动手感统一；镜头重心、景别与信息密度按内容选择。风格预设是起点，可调整色板与动作、组合一个主风格和一个辅助风格。
- 字幕完全显现后再计算阅读停留；看图和推理需要额外时间。结论先停住，再离场。
- 动画由 `t` 决定。随机数使用固定种子，不以实时钟、计时器或跨帧累计状态决定画面。
- 原示例用于学习实现方式；新片应围绕自己的主题、文案与分镜制作。来源与材料边界见 [NOTICE](NOTICE.md)。

## 工作流程

**确定交付范围。** 识别题目、已有文案、现有坏镜头、长度、风格、配乐与是否需要完整导出。能从上下文推断的选择直接推进；只澄清影响结果的缺失要求。用户已授权完整制作时，继续完成，不反复要求阶段批准。

**整理事实与分镜。** 写一句话核心问题和事实表（事实、来源、适用条件、把握程度）。按镜头记录时间、叙事任务、主体与重心、文案与阅读顺序、动作、完整阅读停留和声音。先解决无法画清的句子，再排时间。保留已有文案的原意；需修改的事实或结构说明原因。

**把风格落实到画法。** 无明确风格时，根据主体、空间关系、信息密度、运动语气和实现成本考虑 2–3 个方向，再选定适合内容的方案。分镜记录选型理由、可辨认特征与实现边界。用风格画廊探索动作，自己的片子仍按事实与分镜创作。3D、玻璃与液态预设是 Canvas 适配，复杂真实渲染需另外实现；综艺花字仍为横屏。

**先验证关键镜头。** 检查环境，创建工程，再实现最难或最能代表风格的一段。骨架没有成片画面，需要填写 `SUBS` 和场景函数。已有分镜会保留，已有源码默认不会覆盖。

```bash
python scripts/check_env.py
python scripts/new_film.py --list-styles
python scripts/new_film.py --describe-style isometric
python scripts/new_film.py <工程目录> --style isometric --title "片名" --duration 60 --fps 30
python engine/render.py <工程目录> --serve
python engine/render.py <工程目录> --stills 2.5 8 15
python engine/render.py <工程目录> --motion 8 10 12
```

环境缺依赖时按 README 安装；字体缺失运行 `python engine/get_fonts.py`。默认使用 bundled Chromium，用户需要本机 Chrome 时传 `--browser chrome`。

`--style ID` 与 `--world B/C` 互斥；不指定时保留默认 C。新风格工程内嵌可调整的 `STYLE` 配方，使用共享 `VStyles`；`motion.fps` 指风格动作的建议采样频率，实际输出帧率由 `--fps` 决定。骨架不会自动生成主题内容。

**检查后扩展。** 查看真实截图，判断主体是否认得出、动作是否承担解释、文字是否可读；在目标观看尺寸检查遮挡。调整发现的问题并复查相关时刻，再扩展全片。一个场景一个函数，字幕在 draw 的最外层绘制。复杂章节可分文件，在 `index.html` 中声明。

```bash
python engine/render.py <工程目录> --sheet 16
python engine/render.py <工程目录> --det
python engine/render.py <工程目录> --clip 0 5 preview
```

`--sheet` 单值表示取帧数量，多值表示指定时刻。`--det` 失败需检查 Canvas 状态、随机种子与跨帧缓存；不得把失败称为通过。

**按授权范围导出与配声。** 请求成片时执行全片渲染、事件导出和音频合成；只需源码/预览时可在相应结果完成后交付。

```bash
python engine/render.py <工程目录> --jobs 4
python engine/render.py <工程目录> --events
python engine/audio.py <工程目录>
# 有可使用的外部配乐
python engine/audio.py <工程目录> --bgm music.mp3 --bgm-db -8
```

`fr.sfx` 事件名为 tick、soft、chord、bloom（兼容 flash）、rise、thud、tock、stamp、shimmer、hush。无外部配乐也可合成底音与事件音；具体结果如实说明。`--wav-only` 只输出合成音轨，不叠加外部 BGM。

**验收交付。** 连续观看已导出的片段/全片，并抽查入场、稳定阅读、关键动作和转场中点。确认事实与分镜相符、音画同步、数字一致、字体无缺字。修复已发现的问题，复查受影响镜头。交付源码路径、预览或 `renders/final.mp4`，简述验证结果和实际限制；未完整观看的部分要明确说明。

## 工程与产物

`index.html` 引用 `/engine/` 共享资源和本地 `film.js`；`storyboard.md` 保存分镜和事实。`review/` 放关键帧，`audio/` 放事件和合成音轨，`renders/` 放片段与成片。生成物默认不提交，保留可再渲染的源码。
