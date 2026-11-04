# 空间关系模块增加 2D 展示

## 需求理解

空间内关系模块当前仅支持 3D 关系图与列表切换。需增加 2D 力导向图展示，视觉与交互参考原型项目实体动态关系分析中的 D3 2D 实现，数据与编辑能力对齐当前空间关系工作台。

## 修改范围

- `src/views/SpaceRelationWorkspace/`
- `src/types/pages/ontologySpaceRelationType.ts`
- `tests/` 相关行为测试

不修改 `public/`、`html/`，不新增 npm 依赖。

## 新增、修改和删除文件

- 修改：`src/types/pages/ontologySpaceRelationType.ts` — `RelationViewMode` 扩展为 `"graph" | "graph2d" | "list"`
- 修改：`src/views/SpaceRelationWorkspace/index.vue` — 三态切换与条件渲染
- 修改：`src/views/SpaceRelationWorkspace/composables/useSpaceRelationWorkspace.ts` — 模式校验透传（如需）
- 新增：`src/views/SpaceRelationWorkspace/utils/buildRelationGraph2dData.ts` — 关系列表转 2D 节点边
- 新增：`src/views/SpaceRelationWorkspace/composables/useRelationGraph2d.ts` — D3 力导向渲染与生命周期
- 新增：`src/views/SpaceRelationWorkspace/components/RelationGraph2dView.vue` — 2D 视图容器与右键菜单
- 新增/修改：`tests/ontology-space-relation.test.mjs` 或独立 `tests/relation-graph-2d.test.mjs`

## 核心实现方式

1. 参考原型 `useD3DynamicRelationGraph` 的 SVG 力导向、平移缩放、虚线边、中心高亮、悬停提示。
2. 输入与 3D 一致：`visibleSpaceRelations`、`graphSeedNames`、`maxHop`。
3. 非只读时右键连线触发编辑/删除，与现有 3D 对齐。
4. 不做时间轴、域统计、center/domain/family 多层模型、布局调参面板。
5. D3 实例非响应式持有，卸载时停止 simulation、移除监听与 DOM。

## 新增依赖及必要性

无。复用项目已有 `d3`。

## 验证方式

- TDD：先失败测试，再实现通过
- `npm test`、`npm run test:coverage`
- `npm run type-check`、`npm run build:verify`
- task-scoped `npm run format:check -- <文件列表>`
- 浏览器冒烟：`http://localhost:36000` 下 3D / 2D / 列表切换
