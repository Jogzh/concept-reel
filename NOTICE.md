# 来源与第三方材料

Concept Reel 由 Jogzh 维护。新仓库使用独立的提交历史，保留上游代码来源和许可。

## 上游

- 原 skill 作者署名：[Dave-cc](https://github.com/Dave-cc)，名称为 `vibe-knowledge-film`。
- 本版本继承 Canvas API、组合件、Python 渲染/音频工具、部分方法文档及学习示例；修改代码、命名、使用说明、验证工具与制作约定。原有 API `VK`/`VKit` 保留以兼容示例。

原 MIT 许可与其附带材料排除声明保留在 [LICENSE](LICENSE)。新增修改的署名仅覆盖本版本的修改，不替代上游权利。

上游许可明确排除 `examples/stim_B`、`examples/info_C` 的第三方片名、字幕与画面设计，以及参考文档中逐句记录的第三方片段。本版本移除了这两个复刻工程和相应预览图，将 `references/analysis.md`、`references/prompts.md`、`references/visualization.md` 改写为通用方法和本仓库工程示例，避免将这些材料作为新项目自己的作品发布。LICENSE 内的旧路径用于保留原排除声明。

其他继承示例的主题和来源见 [examples/README.md](examples/README.md)。它们是上游工程，不是 Jogzh 的新原创视频；涉及第三方观点、论文、文本、题材改编和额外素材时，需要独立核查事实与适用权利。

## 项目内的工程参考

制作约定参考 Jogzh 的 `ai-video` 项目中的 `docs/video-style-guide.md`，环境诊断参考其 `scripts/check_env.sh` 的检查思路。只提取内容驱动构图、阅读停留、确定性动画、关键帧检查等通用工程方法，改写为自包含的 Canvas 工作流；没有复制私人素材，也不要求访问该本地项目。

## 动态风格参考

15 类风格名称与识别特征参考 [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)，参考版本 `49052d80bfaf9fa8412cc9710530e5e95a3b8d8c`。该仓库声明代码、提示词、文档与原创影片采用 MIT，第三方照片、字体、采样、纹理等各自保留许可。

本版本重新编写 `references/styles.md`、`engine/styles.json` 的内容用途与 Canvas 配方，自行实现 `engine/vk-styles.js` 和 `examples/style_gallery`。没有复制参考仓库的品牌、剧情、源码或素材，没有引入其字体、照片、音频、网格和视频。3D、玻璃、液态及综艺字幕按本项目实际 Canvas 与横屏能力适配，具体边界随配方记录。

## 字体与依赖

字体下载源：[google/fonts](https://github.com/google/fonts/tree/main/ofl)，Noto Serif SC、Noto Sans SC、Cormorant Garamond、Lora、JetBrains Mono、Courier Prime。字体属于其各自作者，使用 SIL Open Font License 1.1，授权文本位于 `engine/fonts/OFL-*.txt`。下载脚本会同时检查字体和对应许可。字体不适用本项目的 MIT 许可。

运行依赖为 Playwright、NumPy、SciPy、Pillow 和系统 FFmpeg，各自遵循上游许可；依赖安装与 FFmpeg 二进制不会作为本项目源码分发。
