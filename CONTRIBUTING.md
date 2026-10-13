# 贡献

先按 README 安装依赖，使用 `python scripts/check_env.py` 确认环境。新功能或修复应附上可复现的行为和必要验证；保留原有 film.js API 兼容性。

```bash
python -m unittest discover -s tests -v
python scripts/smoke_test.py
```

集成检查会在临时目录创建短片，验证截图、乱序 seek、单路/并行渲染、事件和音频合成；需要完整浏览器、字体与 FFmpeg 环境。命令及测试失败应返回非零。

改动画时同时查看关键帧与连续片段。类型或语法检查不能替代视觉验收。制作方法见 `docs/production-guide.md`。

贡献范围保持具体，说明修改原因、实际行为、验证结果与未验证部分。提交可运行源码和必要预览，不提交虚拟环境、下载的中文字体、配乐、音视频产物、凭据或个人本地绝对路径。

继承代码和材料遵守 LICENSE 与 NOTICE；新增素材记录来源和许可，不引入授权不明确的参考视频复刻材料。
