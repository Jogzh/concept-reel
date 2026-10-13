# Concept Reel 开发约定

创作或调整视频前读取 `docs/production-guide.md`；修改 skill 工作流时保持 `SKILL.md` 与真实工具参数一致。用户明确的本次要求优先。

- 保留 `LICENSE` 和 `NOTICE.md` 中的来源与材料边界。不要重新引入上游排除许可的复刻工程。
- 引擎与工程分离：工程引用 `/engine/`，不复制字体或引擎代码。现有 `VK`/`VKit` API 需要兼容已有示例。
- 每帧只依赖时间与固定输入，新增效果必须支持乱序 seek。运行 `--det` 并检查真实关键帧。
- 修改 Python 工具运行 `python -m unittest discover -s tests -v`；修改 JavaScript 运行 `node --check` 并按需进行浏览器验证。低影响的纯文档修改检查链接与命令即可。
- 新工程默认不覆盖已有源码；生成物和依赖环境不提交。不要把字体下载失败、浏览器异常或 FFmpeg 失败报告成成功。
- 提交前确认范围，必要时更新 README 和工具 `--help`。完整视频导出按用户要求执行。
