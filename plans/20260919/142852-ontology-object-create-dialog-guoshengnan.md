# 本体对象创建弹框与入口接入

## 需求理解

参考原型 `OntologyCreateDialog.vue`，为当前本体对象工作区补充“新建本体”弹框，并接入对象列表工具栏按钮。当前项目没有本体对象创建接口契约，因此本次实现页面交互和当前工作区内存数据更新，不新增未经契约确认的后端接口。

## 修改范围

- 新增本体对象创建弹框，支持手动创建、导入创建和大模型构建入口。
- 接入对象工作区“新建本体”按钮，提供表单校验、提交中状态、错误反馈和本地列表更新。
- 将分类树节点中的既有本体元信息映射为对象工作区列表，支持分类与继承本体选项。
- 新增当前功能的契约测试，保持公共主题变量和页面私有样式边界。

## 文件变更

- 新增 `src/views/OntologySpaceManagementDetail/components/OntologyObjectCreateDialog.vue`。
- 修改 `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`。
- 修改 `src/views/OntologySpaceManagementDetail/utils/mapOntologyCategoryTree.ts`。
- 修改 `src/types/pages/ontologySpaceManagementDetailType.ts`。
- 新增 `tests/ontology-object-create-dialog.test.mjs`。

## 核心实现方式

- 使用页面私有 `el-dialog`，复用项目主题变量、Aircas 按钮类和 Element Plus 表单控件。
- 手动创建生成符合当前 `OntologyObjectItem` 的内存对象；导入模式解析 JSON 数组并批量加入当前分类；大模型模式保留原型入口提示。
- 使用当前分类树作为分类选择源，使用已映射对象作为继承本体选择源。
- 通过父组件回调更新工作区对象分区和分类树计数，避免引入新的全局状态或后端接口。

## 依赖

无新增依赖。

## 验证方式

- 对本次 Vue、TypeScript、测试文件执行 Prettier 检查。
- 执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`。
- 执行 `git diff --check`、任务范围 diff 和工作区状态检查。
