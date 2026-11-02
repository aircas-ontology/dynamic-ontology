# 详情与编排抽屉参数树展示对齐 IDE

## 需求理解

函数详情抽屉、编排函数节点右侧抽屉的输入/输出展示，与脚本 IDE 解析后左侧参数树一致：参数名 + 类型，有 `fields` 时缩进嵌套。详情接口 params 支持多级 fields。

## 修改范围

- 详情参数类型增加递归 `fields`。
- 详情映射递归保留嵌套，并保存接口原始 `paramType` 供树展示。
- 详情抽屉与编排函数节点抽屉改用 `FunctionOperatorScriptParamTree`。
- 编排入参绑定仍只针对顶层 INPUT。
- 无新增依赖；不改 `public/`、`html/`。

## 新增、修改和删除文件

- 修改：`src/types/apis/getOntologyFunctionDetailType.ts`
- 修改：`src/types/pages/ontologyFunctionOperatorType.ts`
- 修改：`src/types/pages/ontologyCompositeWorkflowType.ts`
- 修改：`src/utils/mapOntologyFunctionDetail.ts`
- 修改：`src/views/FunctionOperatorPanel/utils/mapOperatorParametersToScriptParamTree.ts`（新增适配）
- 修改：`src/views/FunctionOperatorPanel/components/FunctionOperatorDetailDrawer.vue`
- 修改：`src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeFunctionNodeDialog.vue`
- 修改：`src/mocks/getOntologyFunctionDetailMock/getOntologyFunctionDetailMock.ts`
- 修改：相关测试

## 核心实现方式

- `GetOntologyFunctionDetailParamItem.fields?` 递归。
- `FunctionOperatorParameter` / `FunctionOperatorParameterField` 增加 `apiParamType`，`itemFields` 递归填充。
- `CompositeWorkflowParamBrief.fields?` 可选嵌套。
- 抽屉用适配函数转为树节点后复用 `FunctionOperatorScriptParamTree`。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先改测试确认失败，再实现通过。
- 相关测试、`format:check`、`check:types-conventions`、`type-check`、`build:verify`。
