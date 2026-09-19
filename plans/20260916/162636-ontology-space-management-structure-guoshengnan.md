# 本体空间管理页面结构整理（已确认）

## 需求理解

依据项目 Skills、根规则和 `src/views/readme.md`，整理本体空间管理页面代码结构，使入口只负责页面组合与生命周期，页面私有逻辑、弹窗和多种列表视图按职责拆分，同时保持现有功能、样式、路由与 Mock 数据不变。

## 修改范围

- 精简 `src/views/OntologySpaceManagement/index.vue`。
- 拆分空间集合、表格视图、卡片视图和命令弹窗组件。
- 新增页面私有操作 composable。
- 收紧空间操作和加载状态类型。
- 删除职责不准确的 `SpaceTable.vue`。
- 增加页面结构约束测试。

## 核心实现

- `index.vue` 仅组合页面区块、绑定状态并触发首次加载。
- `useSpaceManagement.ts` 负责查询和派生状态；`useSpaceManagementActions.ts` 负责进入、编辑、保存、删除和导出命令。
- `SpaceCollection.vue` 组合 `SpaceTableView.vue`、`SpaceCardGrid.vue` 和分页。
- `SpaceCommandDialogs.vue` 承载删除和导出弹窗。
- 所有页面私有样式继续就近维护，不修改公共样式。
- 使用 `OntologySpaceAction` 和 `OntologySpaceLoadStatus` 替代任意字符串及内联状态联合。

## 文件变化

- 新增页面私有组件、composable 和结构测试。
- 修改入口、现有查询 composable、操作组件及页面类型。
- 删除 `components/SpaceTable.vue`。
- 不修改路由、Mock、依赖、公共组件和公共样式。

## 依赖

不新增依赖。

## 验证

- 先运行新增结构测试确认失败，再完成实现并确认通过。
- 页面业务测试与结构测试。
- `npm test`、`npm run test:coverage`。
- `npm run check:types-conventions`、`npm run check:project-conventions`。
- `npm run type-check`、`npm run build:verify`。
- `git diff --check` 和浏览器视觉检查。
