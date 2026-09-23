# 第二步选择实例表格

## 需求理解

第一步勾选对象并点击下一步后，进入第二步选择实例：展示选中对象下的实例表格（实例名称、所属对象），默认全部勾选。步骤栏第一项完成、第二项进行中。未要求第三步界面。

## 修改范围

- 新增 `src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedInstance.ts`：按选中对象生成两条样例实例。
- 修改 `index.vue`：维护当前步骤、实例列表与默认全选；返回在第一步离开页面，其后回退一步。
- 修改 `SubspaceCreateWorkspacePanel.vue`：第二步渲染 `aircas-table` 选择表格。
- 更新 `tests/ontology-subspace-create.test.mjs`。

## 新增依赖

无。实例数据与现有分类树一样使用页面内样例，每个选中对象两条：`{对象名}实例1/2`。

## 验证

TDD 后跑子空间创建测试、任务文件 `format:check`、`type-check`、`build:verify`。
