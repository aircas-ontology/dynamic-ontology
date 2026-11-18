# 应用行为关联函数算子下拉展示描述与类型

## 需求理解

创建应用行为时，「关联函数算子」下拉除名称外，再展示 description 与 type（中文类型标签）。

## 修改范围

- `src/types/pages/ontologySpaceBehaviorType.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `src/mocks/ontologySpaceBehaviorMock/ontologySpaceBehaviorMock.ts`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan
- 无删除；无新增依赖

## 核心实现方式

扩展 `SpaceBehaviorOperatorOption` 增加 `description`、`type`；`mapFunctionOperator` 从列表记录写入；下拉 `el-option` 自定义展示名称·版本、描述、类型中文标签（`mapFunctionOperatorTypeFromApi` + `FUNCTION_OPERATOR_TYPE_LABELS`）；选中收起态仍用名称·版本。

## 新增依赖及必要性

无。

## 验证方式

- 更新并运行相关测试（TDD）
- `npm run format:check -- <任务文件>`
- `npm run type-check`、`npm run build:verify`
