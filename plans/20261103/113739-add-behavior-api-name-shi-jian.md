# Add 行为api名称 to create-behavior form

## 需求理解

在空间行为创建/编辑弹框基本信息中增加必填「行为api名称」，对应契约 `actionApi`，页面字段使用 `behaviorApiName`。

## 修改范围

- `src/types/pages/ontologySpaceBehaviorType.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `src/mocks/ontologySpaceBehaviorMock/ontologySpaceBehaviorMock.ts`
- `src/views/ObjectBehaviorWorkspace/components/ObjectBehaviorFormDialog.vue`（仅 draft 默认）
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改上述文件；无新增依赖或删除文件

## 核心实现方式

Draft 增加 `behaviorApiName`；表单 2×2 布局；编辑态禁用；Mock 优先用草稿值。

## 新增依赖及必要性

无。

## 验证方式

`ontology-space-behavior` 测试、`format:check`、`type-check`、`build:verify`。
