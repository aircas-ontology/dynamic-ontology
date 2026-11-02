# 编辑脚本 IDE 打开时展示详情参数

## 需求理解

编辑脚本函数进入 Web-IDE 时，左侧输入/输出直接展示详情接口已返回的参数树，不必先点解析。有参数时视为已解析，可直接保存。代码或语言相对该快照变化后清空并要求重新解析。

## 修改范围

- 详情转草稿时写入 params（含 fields）。
- 表单持有脚本参数树草稿并传给 IDE。
- IDE 打开时套用该草稿并锁定解析状态；解析成功或清空时回写草稿。
- 不新增依赖。

## 新增、修改和删除文件

- 修改：`src/utils/mapOntologyFunctionDetail.ts`
- 修改：`src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改：`src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue`
- 修改：`tests/get-ontology-function-detail-api.test.mjs`
- 修改：`tests/function-operator-workspace.test.mjs`

## 核心实现方式

- `mapOntologyFunctionDetailToDraft` 调用已有按类别映射。
- 表单用 `mapOperatorParametersToScriptParamTree` 生成 IDE 草稿。
- IDE 在 `modelValue` 变为 true 时套用草稿；关闭时不丢父级草稿。

## 新增依赖及必要性

无。

## 验证方式

相关测试、format:check、build:verify。
