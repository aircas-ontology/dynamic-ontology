# 画像关系二维图样式

## 需求理解

将对象画像中的关系图调整为对象关系二维视图的视觉风格，适配画像内的小尺寸区域。

## 修改范围

- 修改 `src/views/EntityBrowsingObjectProfile/components/ObjectProfileRelationGraph.vue`。
- 新增页面私有图形配置工具及 `tests/*.test.mjs` 行为测试。
- 新增本计划，不删除文件，不修改其他业务接口或数据。

## 实现方式

使用当前 ECharts 实例呈现对象关系二维图的中心高亮节点、外围描边节点、虚线连线与下方文字；保留拖拽、平移和缩放，依据已有主题令牌更新颜色。数据只有节点名称，不编造关系名称或方向。处理数据变化、空状态、尺寸变化及组件销毁。

## 依赖

不新增依赖。

## 验证

先编写并运行图形配置行为测试确认失败，再实现并运行测试。执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`、任务文件格式检查和 `git diff --check`。尝试受影响页面浏览器冒烟，记录已有失败和无法执行的检查。
