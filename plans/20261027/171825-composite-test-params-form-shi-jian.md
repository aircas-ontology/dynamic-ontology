# 编排测试参数按开始节点限定

## 需求理解

函数编排弹框右侧「测试参数」当前为自由 JSON textarea。改为与开始节点 `outputParameters` 结构一致：固定参数名与类型，用户只输入各参数值；无开始节点或无入参时给出空态提示。

## 修改范围

- 编排弹框 UI 与测试请求组装
- 画布暴露开始节点入参读取
- 测试入参行同步工具与断言

不改测试接口契约；不改结束节点；不新增依赖。

## 新增、修改和删除文件

**修改**

- `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeWorkflowDialog.vue`
- `src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts`
- `tests/function-operator-workspace.test.mjs`

**新增**

- `src/views/FunctionOperatorPanel/utils/compositeWorkflowTestParams.ts`
- 相关测试断言（workspace 或独立测试文件）

## 核心实现方式

1. 复用 `FunctionOperatorScriptTestParamTree` 与 `mapOntologyFunctionTest`（`writeOntologyFunctionScriptTestParamValue`、`buildOntologyFunctionScriptTestRequest`）。
2. `syncCompositeWorkflowTestInputRows(prev, startParams)`：按 name/type 建行，同名保留 `paramValue`。
3. 在弹框打开初始化后、开始节点确认写回后、侧栏添加/拖入开始节点后、删除选中后、以及 `runTest` 前同步。
4. 空态文案：`请先在开始节点配置入参`。
5. 参数值以字符串提交；类型仅展示。

## 新增依赖

无。

## 验证方式

- 相关测试、`format:check`、`type-check`、`build:verify`
