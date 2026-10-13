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

## 字体与依赖

字体下载源：[google/fonts](https://github.com/google/fonts/tree/main/ofl)，Noto Serif SC、Noto Sans SC、Cormorant Garamond、Lora、JetBrains Mono、Courier Prime。字体属于其各自作者，使用 SIL Open Font License 1.1，授权文本位于 `engine/fonts/OFL-*.txt`。下载脚本会同时检查字体和对应许可。字体不适用本项目的 MIT 许可。

运行依赖为 Playwright、NumPy、SciPy、Pillow 和系统 FFmpeg，各自遵循上游许可；依赖安装与 FFmpeg 二进制不会作为本项目源码分发。
