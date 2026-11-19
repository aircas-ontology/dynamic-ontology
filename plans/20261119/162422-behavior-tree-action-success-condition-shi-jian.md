# 行为树 ACTION：执行成功条件移植

## 需求理解

将 `behavior-tree-editor/index.html` 中 ACTION 节点「执行成功条件」移植到系统行为树编排：可选配置 `config.successCondition`（`outputKey`/`op`/`value`），保存进 `treeDefinition`。

## 修改范围

类型、默认配置、换绑清空、序列化/回显、校验、NodeInspector UI、Dialog patch、readme、测试。不改 HTML 原型；无新依赖。

## 新增、修改和删除文件

- 修改：`src/types/pages/behaviorTreeOrchestrationType.ts`、`src/types/index.ts`（若需导出）
- 修改：`behaviorTreeModel.ts`、`behaviorTreeDefinition.ts`、`behaviorTreeValidate.ts`、`behaviorTreeActionBindings.ts`（辅助读写）
- 修改：`BehaviorTreeNodeInspector.vue`、`BehaviorTreeOrchestrationDialog.vue`、`readme.md`
- 修改：`tests/behavior-tree-orchestration.test.mjs`
- 无删除

## 核心实现方式

对齐 HTML：无 `outputKey` 不写字段；有则 `{ outputKey, op, value? }`；校验出参/算子/类型；UI 在出参回传之后；换 `actionApi` 清空条件。

## 新增依赖及必要性

无。

## 验证方式

TDD 补测试后实现；`npm test`（behavior-tree）、`test:coverage`、`type-check`、`build:verify`、`format:check`、`check:types-conventions`。
