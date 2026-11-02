# Rebuild create-behavior form by category

## 需求理解

重构空间行为 `BehaviorFormDialog` 基本信息：按类别（基础行为 / 应用行为 / 行为树）切换字段；移除输入/输出参数与变更信息；行为类型与构建行为树点击暂占位。

## 修改范围

- `src/types/pages/ontologySpaceBehaviorType.ts`、`src/types/index.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `src/mocks/ontologySpaceBehaviorMock/ontologySpaceBehaviorMock.ts`
- `src/views/ObjectBehaviorWorkspace/components/ObjectBehaviorFormDialog.vue`（仅补 draft 字段以通过类型）
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改上述文件；无新增依赖或删除文件

## 核心实现方式

新增 `SpaceBehaviorKind` / `SpaceBehaviorValueType` 与选项常量；表单按 `kind` 条件渲染；Mock 默认 `kind: "basic"`、`valueType: "attributeValue"`。

## 新增依赖及必要性

无。

## 验证方式

更新测试后 `npm test`（ontology-space-behavior）、`type-check`、`build:verify`、任务文件 `format:check`。
