# 编辑脚本保存后保持弹框打开

## 需求理解

编辑脚本函数保存成功后保持 IDE/表单打开，与创建脚本后继续留在会话中的逻辑一致；去掉仅创建后才保持打开的 keepScriptFormOpenAfterSave 分支。

## 修改范围

- 修改：src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts
- 修改：tests/update-ontology-function-api.test.mjs
- 按需同步 tests/function-operator-workspace.test.mjs

## 核心实现方式

saveScriptOperator 创建/编辑成功后统一刷新 editingOperator/formDraft，不关闭 formVisible；删除 keepScriptFormOpenAfterSave。

## 新增依赖

无

## 验证方式

相关测试、format:check、type-check、build:verify；既有失败单独记录。
