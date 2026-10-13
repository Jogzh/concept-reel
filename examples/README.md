# 示例工程

以下除 `smoke` 外均为已有的学习示例，用于研究 Canvas 实现与分镜关系。仓库包含源码与部分预览，完整视频需要本地渲染；来源与许可说明见 [NOTICE.md](../NOTICE.md)。

| 工程 | 外观与时长 | 可以学习的实现 |
| --- | --- | --- |
| `fold_C` | 夜曲，33 秒开头 | 血管、细胞、珠串的尺度切换；形态变化；`layout.js` 几何数据 |
| `pigeon_B` | 寓言，33 秒开头 | 鸟的可辨认姿态；生活场景与仪表 |
| `learn_addiction` | 夜曲，101 秒 | 手机裁切滚动；累积曲线；多巴胺峰位变化；盲盒翻面 |
| `helpless` | 寓言，100 秒 | 参数驱动的角色动作；事件计数；对照与归因滑块 |
| `entropy` | 寓言，100 秒 | 物品逐个变化；牌阵；指标在结尾保留含义 |
| `bystander` | 寓言，100 秒 | 传说与研究证据的区分；人数与责任指标 |
| `kit_gallery` | 引擎组件展示 | 字幕、片名卡、年份栏、仪表和图形组件 |
| `smoke` | 本版本新增，2 秒 | 无科学断言的最小 Canvas/事件工程，用于测试管线 |

`learn_addiction` 在上游注明参考抖音【Ember余烬】同主题视频；其他样例的事实与主题来源保留在各自 `storyboard.md`/源码中。发布新作品前应核查论文、数字和适用条件，题材或文案改编的使用权需要单独判断。

上游明确排除许可的 `stim_B`、`info_C` 两个参考视频复刻工程及其预览已移除，详见 `../NOTICE.md`。当前方法文档不再收录它们的逐句字幕和画面对照。

```bash
python engine/render.py examples/fold_C --serve
python engine/render.py examples/fold_C --sheet 16
python engine/render.py examples/kit_gallery --det
```

运行示例前下载字体。工程中的 HTML 通过 render.py 的本地服务器访问 `/engine/`，不直接双击运行。学习色彩、几何、裁切与时间函数，新主题围绕自己的分镜设计画面。
