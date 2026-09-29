# 对象详情行为页复用空间行为工作区

## 需求理解

对象详情「行为」不再用空占位页，改为与空间内行为页同一套工作区：分类树、列表、查看/编辑/新建、更多（状态管理、删除）。本轮仍走本地 Mock，不接后端，不改行为调度。

对象页没有 `params.spaceId`，空间 id 来自现有 `query.spaceId`（对象 Tab 切换已带上）。行为数据按空间维度展示，不做对象级过滤。

## 修改范围

复用已有 `SpaceBehaviorWorkspace`，只改路由解析空间 id。不复制一套对象页组件。

## 新增、修改和删除文件

- 修改 `src/router/modules/workspaceRoutes.ts`：`OntologyObjectDetailBehavior` 指向 `SpaceBehaviorWorkspace.vue`
- 修改 `useSpaceBehaviorWorkspace.ts`：空间 id 优先 `params.spaceId`，否则 `query.spaceId`（对齐关系页）
- 修改 `tests/ontology-space-behavior.test.mjs`：断言对象行为路由挂载同一工作区，且不再用 `emptyWorkspacePanel`

## 核心实现方式

与对象关系路由同一模式。工作区、弹窗、Mock 全部复用；同一 `spaceId` 下对象页与空间页看到同一份本地数据。

## 新增依赖及必要性

无。

## 验证方式

先补失败测试，再改路由和 spaceId 解析；跑行为页测试和 `format:check`。

## 执行状态

已确认保存，本轮不实施。
