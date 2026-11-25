# 任务历史事件回放（已确认）

- 需求：按时间播放 Mock 历史事件，提供播放暂停、时间拖动、倍速和结束；卡片锚定目标坐标，目标扩散圆突出显示。
- 修改范围：任务展示页及其 TaskDisplayMap 私有组件；新增页面私有回放时间工具、行为测试及本方案。
- 技术：直接用现有 mars3d-cesium 包创建 Cesium Viewer，取消本页 Mars3D Map/GraphicLayer/DivGraphic；保留其他地图。Clock/TimeIntervalCollection 管理事件可见时段，Billboard 展示 Canvas 卡片，CallbackProperty 控制扩散圆。已有菜单通过 Cesium 投影绑定 HTML。
- 资源：沿用 domainConfig 瓦片地址，保留原生 Cesium 署名；不修改 public，不新增依赖。
- 验证：回放排序、无效时间、边界与多目标测试；项目测试、覆盖率、类型检查、临时构建、格式和 diff 检查。浏览器验证限本页回放、2D/3D、重复进入及销毁。
