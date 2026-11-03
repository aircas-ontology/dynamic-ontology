# 对象继承层级树

## 需求理解

对象工作区左侧支持在“概念层级树”和“继承层级树”之间切换。继承层级树以当前空间为根节点，空间下挂载本空间对象，对象下递归挂载其继承对象。

## 修改范围

- 保留对象父级唯一标识，供继承关系构建使用。
- 为左侧树增加展示模式切换、继承树构建、搜索和对象定位能力。
- 概念树的分类管理操作仅在概念树模式可用。

## 文件变更

- 修改 `src/types/pages/ontologySpaceManagementDetailType.ts`。
- 修改 `src/views/ObjectWorkspacePanel/utils/mapOntologyCategoryTree.ts`。
- 修改 `src/views/ObjectWorkspacePanel/components/ConceptHierarchyTree.vue`。
- 修改 `src/views/ObjectWorkspacePanel/index.vue`。

## 核心实现方式

在 `OntologyObjectItem` 中增加 `parentUniqueIdentifier`，由分类树接口对象元信息映射。树组件接收对象列表和空间名称，通过父对象唯一标识构建继承树；缺失父对象、循环关系和重复关系回退到空间根节点，避免渲染失败。两种树共用搜索和对象选择事件。

## 新增依赖

无。

## 验证方式

- `npm run check:types-conventions`
- `npm run format:check --` 仅检查本次修改文件
- `npm run type-check`
- `npm run build:verify`
- `git diff --check`
