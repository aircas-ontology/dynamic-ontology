# 子空间创建实例列表占满剩余高度

## 需求理解

创建子空间第二步「选择实例」中，对象分组列表下方出现大块空白，列表没有占满标题以下的剩余区域。根因是实例分组与底部「暂无对象实例」空状态同时渲染，空状态被设为 `flex: 1` 吃掉剩余高度；分组自身也未撑满剩余空间。

## 修改范围

只调整子空间创建页实例步骤的空状态条件和列表高度，不改接口、类型、选中逻辑和分页。

## 新增、修改和删除文件

- 修改 `src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue`
- 修改 `src/views/OntologySubspaceCreate/components/SubspaceCreateInstancePanel.vue`
- 修改 `tests/ontology-subspace-create.test.mjs`
- 不新增、不删除文件

## 核心实现方式

1. `el-empty` 仅在当前步骤确实没有可展示内容时显示。第二步已有 `instanceGroups` 时不再渲染「暂无对象实例」。
2. 实例面板继续占满剩余高度；有数据的对象分组使用 `flex: 1`，`el-table` 使用 `height="100%"`；空、加载、错误分组保持紧凑。多个有数据分组时平分剩余高度。

## 新增依赖及必要性

无。

## 验证方式

- 先更新测试并确认因目标行为未实现而失败，再完成实现并验证通过。
- `npm test -- tests/ontology-subspace-create.test.mjs`
- `npm run test:coverage`
- `npm run type-check`
- `npm run build:verify`
- `npm run format:check --` 上述任务文件
- 浏览器打开创建子空间第二步，确认列表占满、底部无空状态。
