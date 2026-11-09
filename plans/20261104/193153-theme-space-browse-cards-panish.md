# Plan：主题管理去顶部并改为图二卡片

## 需求理解

- 去掉欢迎区与顶部统计卡。
- 卡片仅展示对象/关系/行为/实体与「浏览 / 导出 / 应用展示」。
- 浏览跳转实体浏览；导出复用原能力；应用展示暂未接入提示。
- 实体数量接口无字段，Mock 提供。

## 修改范围

- `ThemeSpaceManagement/index.vue`
- `OntologySpaceMetrics` / `OntologySpaceListItem` / `mapOntologySpaceList`
- `space.get.json` Mock
- 相关测试

## 核心实现

1. 移除 WelcomePanel/StatCard/概览请求；工具栏旁保留「新建主题」。
2. 卡片与表格操作改为三按钮；浏览 → `EntityBrowsingObject`。
3. metrics.entity 由 Mock `entityCount` 映射。

## 新增依赖

- 无。

## 验证

- 主题/列表映射相关测试 + format:check。
