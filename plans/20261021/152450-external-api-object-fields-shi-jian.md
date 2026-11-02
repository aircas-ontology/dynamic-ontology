# 外部函数 object 参数嵌套 fields

## 需求理解

新建/编辑外部函数时，输入、输出参数若 `type === "object"`，可为其添加下级属性；属性本身也可再为 object 并继续嵌套。保存结构对齐示例：`name` / `type` / `description` / `fields[]`。

约定（示例未写死处）：

- 类型枚举沿用现有 `string | number | boolean | array | object`（示例中的 `integer` 按 `number` 处理，不新增类型）
- 仅顶层 input 保留 `location`、`required`；嵌套 `fields` 项不含这两项
- 将 type 从 object 改为其他类型时清空该行 `fields`
- 输入、输出两侧行为一致

## 修改范围

| 区域    | 路径                                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 类型    | `src/types/apis/createOntologyFunctionType.ts`、`src/types/index.ts`                                                                               |
| 组装    | `src/views/FunctionOperatorPanel/utils/buildCreateOntologyExternalFunctionParams.ts`                                                               |
| 回填    | `src/utils/mapOntologyFunctionDetail.ts`                                                                                                           |
| 表单 UI | `FunctionOperatorFormDialog.vue` + 新增 `FunctionOperatorExternalApiParamFieldsEditor.vue`                                                         |
| 测试    | `tests/build-create-ontology-external-function-params.test.mjs`、`tests/get-ontology-function-detail-api.test.mjs`、必要时 workspace/form 契约断言 |

不改：后端契约文档、脚本函数参数树、编排画布。无新依赖。

## 新增、修改和删除文件

- 修改：`createOntologyFunctionType.ts`、`types/index.ts`、`buildCreateOntologyExternalFunctionParams.ts`、`mapOntologyFunctionDetail.ts`、`FunctionOperatorFormDialog.vue`
- 新增：`FunctionOperatorExternalApiParamFieldsEditor.vue`
- 修改测试：上述两个测试文件及 `function-operator-workspace.test.mjs`（表单契约）

## 核心实现方式

1. **类型**：抽出可复用的 `CreateOntologyFunctionApiField`，Input/Output 继承并增加可选 `fields`。
2. **组装**：`mapExternalApiInputs` / `mapExternalApiOutputs` 递归映射 `fields`；名称为空跳过；非 object 不提交 `fields`。
3. **回填**：`mapExternalApiConfigInputs/Outputs` 与详情 params 兜底映射递归还原 `fields`（`integer`→`number`）。
4. **UI**：object 类型展示「添加属性」及缩进子行；顶层保留 location/required；type 变更清理子 fields；保存前递归校验同级 name 非空且不重复。

## 新增依赖及必要性

无。

## 验证方式

- `buildCreateOntologyExternalFunctionParams` 多级 `fields` 组装与非 object 不带 fields
- `mapOntologyExternalApiConfigToForm` 嵌套回填
- 表单源码契约：object 可添加属性、递归编辑组件引用
- `npm test`（相关）、`format:check`、`type-check`、`build:verify`
