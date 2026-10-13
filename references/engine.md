# 引擎与命令

Concept Reel 在一张 1920×1080 Canvas 上绘制画面，用 `seek(t)` 指定时间。每一帧应由时间、固定数据和模型参数确定，以支持静帧、片段和并行渲染。

实现继承并改进自 [vibe-know--skill](https://github.com/zhaosenlin12-creator/vibe-know--skill)，来源与许可见 [NOTICE.md](../NOTICE.md)。JavaScript 的 `VK`、`VKit` 名称为兼容已有工程保留。

```text
engine/
  vk.js        时间、Frame、背景、辉光、颗粒与seek
  vk-kit.js    字幕、片名、章节标记、仪表和小道具
  index.html   共享页面模板
  render.py    预览、截图、视频编码、事件表与确定性检查
  audio.py     事件声音合成、配乐与音画合成
  get_fonts.py 字体与OFL许可证下载、校验
  fonts/       开源字体与许可证
scripts/
  new_film.py  创建工程与分镜模板
  check_env.py 环境和资源诊断
```

工程至少包含 `index.html` 和 `film.js`。内置预览服务器将共享资源挂在 `/engine/`，不要复制整套字体到每个工程，也不要直接用 `file://` 打开模板。

## 安装与诊断

需要 Python 3.10+、FFmpeg/ffprobe 和 `requirements.txt` 中的依赖。默认浏览器是 Playwright 自带 Chromium；安装后使用 `python -m playwright install chromium` 下载。需要本机 Google Chrome 时，渲染和环境检查都支持 `--browser chrome`。

```bash
python engine/get_fonts.py
python engine/get_fonts.py --check
python engine/get_fonts.py --check --json
python scripts/check_env.py
python scripts/check_env.py --json --browser chrome
python scripts/check_env.py --project projects/my_film
```

字体下载只补缺失或无效文件，校验临时文件后原子替换。`--check` 不下载、不创建目录，缺失或无效时返回 1。环境检查不会自动安装，失败项包含修复提示。

## 工程与渲染命令

以下路径和时间是调用示例，时间需落在工程时长内。单次渲染只能选择一个模式。

```bash
python scripts/new_film.py projects/my_film --world C --title '排队' --duration 40 --fps 30
python engine/render.py projects/my_film --serve
python engine/render.py projects/my_film --serve --port 0
python engine/render.py projects/my_film --stills 2.5 8.5 21
python engine/render.py projects/my_film --sheet 16
python engine/render.py projects/my_film --sheet 3.5 9 21.5
python engine/render.py projects/my_film --motion 8.2 10.6 12
python engine/render.py projects/my_film --clip 0 3 head
python engine/render.py projects/my_film --det
python engine/render.py projects/my_film
python engine/render.py projects/my_film --jobs 4
python engine/render.py projects/my_film --events
python engine/audio.py projects/my_film
python engine/audio.py projects/my_film --wav-only
python engine/audio.py projects/my_film --bgm music.mp3 --bgm-db -8
```

`new_film.py` 支持 B 寓言与 C 夜曲，默认 C、30秒、30fps，创建 `index.html`、`film.js` 和 `storyboard.md`。默认拒绝覆盖已有代码；`--force` 可以重建代码骨架，仍保留已有分镜。

预览默认监听 `127.0.0.1:8765`，`--port 0` 选择空闲端口。URL 加 `?play` 实时播放，加 `?t=12.5` 查看固定时间。修改后刷新。`--browser` 控制截图和导出使用的浏览器；预览页面由自己打开的浏览器显示。

| 模式 | 输出与行为 |
|---|---|
| `--stills TIME...` | `review/s_0002.50.png` 等关键帧 |
| `--sheet [COUNT]` | 全片均匀取帧，默认16张，生成 `review/sheet.jpg` |
| `--sheet TIME TIME...` | 两个或更多时间按指定时刻拼图 |
| `--motion START END [COUNT]` | 取区间内的均匀帧，默认12张 |
| `--clip START END [NAME]` | `renders/NAME.mp4`，默认 `_clip` |
| 无模式 | 全片无声视频 `renders/raw.mp4` |
| `--jobs N` | 仅用于全片，分段编码后拼接；成功后清理临时段 |
| `--events` | `audio/events.json` |
| `--det` | 同页12个固定种子时刻乱序重复截图；不一致返回非零 |

音频命令读取事件表，生成 `audio/score.wav`；默认与 `renders/raw.mp4` 合成 `renders/final.mp4`。`--wav-only` 只生成声音。BGM 需要自行提供可使用的素材。

渲染速度受机器、浏览器和画面复杂度影响。先检查拼图和关键片段，再决定并行度与完整导出。

## 最小 film.js

```js
(function () {
  'use strict';
  const K = VKit;
  const SUBS = [{ a: .5, b: 3.5, zh: '队列里还剩{两个任务}。' }];
  VK.film({
    dur: 4, fps: 30, theme: 'night', meta: { title: '排队' },
    draw(fr, t) {
      fr.look.bgo = { stars: .4 };
      fr.rect(650, 350, 220, 180, { fill: '#304459' });
      fr.rect(1050, 350, 220, 180, { fill: '#304459' });
      fr.text('任务 1', 760, 440, { font: 'sans', size: 48 });
      fr.text('任务 2', 1160, 440, { font: 'sans', size: 48 });
      K.subs(fr, t, SUBS, 'night');
    },
  });
})();
```

引擎先加载声明的字体、成功绘制首帧，再设置 `window.READY = true`。加载或首帧失败时设置 `window.READY_ERROR`，渲染器会报告错误。`END`、`FPS`、`META` 和 `events()` 提供时长、帧率、元数据与声音事件。

示例 [fold_C](../examples/fold_C/film.js)、[pigeon_B](../examples/pigeon_B/film.js) 和 [kit_gallery](../examples/kit_gallery/film.js) 均继承自上游项目，可以学习空间推进、计时和组件调用。示例目录还保留其他上游知识主题工程，列表见 [examples/README.md](../examples/README.md)。

## 时间与确定性

| 接口 | 用途 |
|---|---|
| `seg(t,a,b)` | 将时间映射到0…1并夹住两端 |
| `ss(t,a,b)` | `seg` 经平滑后的值，超过b后保持1 |
| `fade(t,a,b,fin=.5,fout=.5)` | 出现、停留、消失的包络 |
| `lerp(a,b,k)`、`clamp(x,a=0,b=1)`、`smooth(x)` | 插值、限制和平滑 |
| `E.lin/in2/out2/in3/out3/io3/out5/outExpo/outBack` | 缓动函数 |
| `K.track([[time,value],...],t)` | 关键帧间平滑插值 |
| `K.dips(t,points,half=.55)` | 指定时间附近降低亮度 |
| `VK.scene(fr,t,a,b,fn,fin,fout)` | 时间窗内调用 `fn(本地时间,包络)` |

随机数据使用 `rng(seed)` 或 `hash(n)`。不要依赖 `Math.random()`、当前日期和上一帧累积。模拟可预先计算成表，或者直接从时间和粒子编号求位置。

引擎每帧重置内容层、输出层和复用临时层的 Canvas 状态。自定义模型、数组和全局变量仍需要自行保证确定性。`--det` 的实际范围见 [layout.md](layout.md)。

## Frame：fr

`fr.t` 是当前秒数，`fr.frame` 是帧号，`fr.x` 是原生 2D context。

| 接口 | 用途 |
|---|---|
| `fr.g({a,at:[x,y],rot,s,add,blur,clip:[x,y,w,h]},fn)` | 一组变换与透明度；调用结束恢复context |
| `fr.layer({a,s,at,rot,cx,cy,blur,add},fn)` | 在临时层绘制后整体合成 |
| `fr.glow(x,y,r,color,a)` | 柔光 |
| `fr.spark(x,y,r,color,a)` | 光点 |
| `fr.comet(x,y,len,r,color,a,ang=0)` | 彗尾光点 |
| `fr.line(x1,y1,x2,y2,o)`、`fr.poly(points,o)` | 线与折线，`o.k`控制折线显示比例 |
| `fr.along(points,k)` | 返回折线上的位置与切向 |
| `fr.path(svgPath,o)` | SVG路径字符串 |
| `fr.circle/ellipse/arc`、`fr.rect` | 基本形状，`rect`的`o.r`为圆角 |
| `fr.grad(x0,y0,x1,y1,stops)`、`fr.rgrad(cx,cy,r0,r1,stops)` | 渐变，用作`fill` |

常用绘图选项包括 `color`、`fill`、`w`、`a`、`glow`、`dash`、`add` 和 `cap`。

文字使用 `fr.text(str,x,y,o)`，返回宽度。`o` 包含 `font`、`size`、`color`、`a`、`track`、`align`（c/l/r）、`base`、`glow`、`shadow`、`blur` 和 `grad`。`fr.measure()`量整行，`fr.layout()`给出逐字位置，`fr.chars()`允许逐字覆盖透明度、颜色、位移等选项。

| 字体键 | 字体 |
|---|---|
| `serifh/serif/serifm/serifr/serifl/serifx` | Noto Serif SC，900/700/500/400/300/200 |
| `sansh/sans/sansm/sansr` | Noto Sans SC，900/700/500/400 |
| `latin/latinl/latinm/latini/latinim` | Cormorant Garamond |
| `lora/lorar` | Lora斜体/常规 |
| `mono` | JetBrains Mono |
| `type` | Courier Prime |

字距和最长句宽需要实际测量，不能只按字符数决定。

## 背景与合成

每帧开始设置默认 `fr.look`，`draw` 可以修改它：

| 属性 | 含义 |
|---|---|
| `bg` | night、flat或保留的gilt |
| `bgo` | night：core/stars/tint；flat：color；gilt：warm/pool/floor/horizon/dust |
| `bloom` | 默认night 1、flat .12、gilt .34 |
| `grain` | 胶片颗粒，默认.05 |
| `under(ctx,t)` | 底之上、内容之下，不参加内容层辉光 |
| `post(ctx,t)` | 内容合成后的全幅效果 |

辉光将内容层缩小、模糊后以加法合成。大面积实心形状可以降低 `bloom`，或画入 `under`，避免过曝。`gilt` 与年份栏保留为兼容组件，新工程生成器只提供 B/C 两套外观。

## VKit组件

| 接口 | 用途 |
|---|---|
| `K.subs(fr,t,list,style)` | style为flat/night/gilt；字幕项含a/b/zh，可含en/big/tone |
| `K.chapterMark(fr,t,list,end)` | 章节项含t/no/zh/en |
| `K.gauge(fr,x,y,o)` | value/max/redFrom/label/zone/caption组成仪表 |
| `K.hudYear(fr,t,list,end)` | 年份、地点与可选来源信息 |
| `K.titleGilt(fr,lt,o)`、`K.titleNight(fr,lt,o)` | 金字卡与点阵片名 |
| `K.dustText(fr,str,cx,cy,o,k,t)` | 点阵文字 |
| `K.flash/ripple/noiseOverlay` | 闪光、扩散环和噪点 |
| `K.sepia(fr,k)` | 作用在已画内容上的泛黄效果，之后再画不需泛黄的字幕 |
| `K.die/dieFace/numberLine/bellPts` | 骰子、骰面、数轴、曲线点列 |
| `K.PAL`、`K.SUB` | 默认色板和字幕参数 |

字幕中的 `{词}` 使用金色，`{!词}` 使用红色。例如 `zh: '处理速度{低于}到达速度。'`。颜色语义由本片分镜确定。位置、尺寸和停留应按内容调整。

## 声音事件

`fr.sfx(秒数,名字,参数)` 在导出时收集，同一时刻与名字去重。事件要在全片时间范围内，时间与参数必须是有限数值。

可用事件：`tick`、`soft`、`chord`、`bloom`、`rise`、`thud`、`tock`、`stamp`、`shimmer`、`hush`，以及兼容别名 `flash`。`pitch`、`root`、`dur`和`gain`按音效适用；`hush`用于让合成声音在指定区间静下来。

`gain` 是事件的线性增益，不是BGM的dB值。`--bgm-db` 控制配乐音量。字幕动作与声音都应由同一时间表安排；错误事件名会明确报错。

## 实现中常见的问题

- 字幕、标注和主体重叠：检查最长句与最大尺寸的实际静帧。
- 暂时对象没有离场：用`fade`管理生命周期；需要保留的累积对象用`ss`。
- 半透明形状重复叠加：用`fr.layer`把整体先画完再淡入。
- 粒子过多拖慢渲染：预计算路径，减少逐粒子模糊和阴影。
- 章节挪动不同步：集中管理时间常量，让字幕、动作与音效引用同一时刻。
- 长片难以维护：按章节拆文件，在`film.js`前加载，使用明确命名的`window.CH`函数。

镜头组织与阅读检查见 [visualization.md](visualization.md) 和 [layout.md](layout.md)。
