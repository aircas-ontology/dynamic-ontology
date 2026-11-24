# Plan：脚本函数测试弹窗禁止点遮罩关闭

## 需求理解

点击弹窗外区域时不关闭「脚本函数测试」弹窗。

## 修改范围

`FunctionOperatorScriptTestDialog.vue` 增加 `:close-on-click-modal="false"`；同步测试断言。

## 新增、修改和删除文件

- 修改：`src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestDialog.vue`
- 修改：`tests/test-ontology-function-api.test.mjs`

## 核心实现方式

`el-dialog` 设置 `:close-on-click-modal="false"`。

## 新增依赖及必要性

无。

## 验证方式

相关单测 + `format:check`
