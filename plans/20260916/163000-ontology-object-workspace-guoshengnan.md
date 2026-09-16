# 本体对象工作区实施方案（已确认）

## 需求理解

在 `/workspace/ontology-space-management/:spaceId/object` 新增本体对象页面。页面采用左右布局，左侧展示概念层级树，右侧按分类展示对象并支持卡片、列表切换；点击树节点后通过锚点定位右侧分类。

## 修改范围

- 新增对象工作区页面和左右两个页面私有组件。
- 新增页面私有 composable、数据映射与定位工具。
- 新增正式业务类型和按空间分类的确定性 Mock。
- 将对象子路由由空白占位组件切换到新页面。
- 新增数据、路由和定位行为测试。

## 核心实现

- 桌面端使用固定侧栏加自适应主区域，窄屏改为上下布局。
- 复用 Aircas 主题变量、按钮、输入框和表格样式；不足部分使用组件内 scoped SCSS。
- 保留原型的内容层级、色调、卡片与表格信息，遵循已确认的无渐变要求，使用纯色背景。
- 左侧搜索过滤树节点，选择分类生成递增 requestId；右侧监听请求，平滑滚动到对应分类并短暂高亮。
- 查询处理 loading、success、empty、error，阻止重复请求与过期响应覆盖。

## 文件变化

- 新增 `ObjectWorkspacePanel.vue`、`ConceptHierarchyTree.vue`、`OntologyObjectList.vue`。
- 新增 `useOntologyObjectWorkspace.ts` 和对象工作区工具。
- 新增 `ontologySpaceObjectMock/ontologySpaceObjectMock.ts`。
- 修改详情页类型出口与对象子路由。
- 新增相关测试。

## 依赖

不新增依赖。

## 验证

- 先运行新增测试确认失败，再完成实现并确认通过。
- `npm test`
- `npm run test:coverage`
- `npm run check:types-conventions`
- `npm run check:project-conventions`
- `npm run type-check`
- `npm run build:verify`
- `git diff --check`
