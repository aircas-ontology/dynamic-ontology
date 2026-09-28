# 关系分类树点击关系即编辑

## 需求理解

本体空间关系模块与对象详情关系模块共用同一套关系分类树。点击树中某个关系叶子时，直接打开与右侧表格「编辑」相同的关系编辑弹窗并回显该关系。点击分类节点仍只筛选列表。

## 修改范围

仅改关系分类树点击分流与工作台编排；不改接口、类型定义、弹窗表单本身。对象详情关系 Tab 已复用空间关系工作台，一处改动同时覆盖两处页面。工作区中概念构建画布与属性树既有修改不纳入本次范围。

## 新增、修改和删除文件

- 修改 `src/views/OntologySpaceManagementDetail/relationComponents/RelationCategoryPanel.vue`
- 修改 `src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue`
- 修改 `tests/ontology-space-relation.test.mjs`
- 新增本 Plan 文件

## 核心实现方式

1. 关系叶子节点保留原始关系 id。点击叶子 emit `edit-relation`；点击分类仍 emit `select-node`。
2. 工作台监听 `@edit-relation`，按 id 从关系列表取出该项并调用已有 `openRelationEdit`。
3. 不额外筛选分类，不改分类按钮与关系表编辑按钮。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先补测试断言，确认失败后再实现。
- 运行关系相关测试、`npm test`、`npm run test:coverage`。
- 对改动文件执行 `npm run format:check -- <文件列表>`。
- 执行 `npm run type-check`、`npm run build:verify`。
