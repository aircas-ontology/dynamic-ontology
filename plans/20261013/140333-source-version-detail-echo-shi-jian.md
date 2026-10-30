# 选择源版本后详情回显

## 需求理解

新建函数算子选定源函数与源版本后，调用 GET /ontology/function/detail 回填表单模板字段；不覆盖新建 functionApi、form.version、spaceId、id。

## 修改范围

FunctionOperatorFormDialog.vue 与 function-operator-workspace 契约测试；不改 API/types/workspace openEdit。

## 新增、修改和删除文件

- 修改：FunctionOperatorFormDialog.vue、tests/function-operator-workspace.test.mjs

## 核心实现方式

onSourceVersionChange 调用 getOntologyFunctionDetailInterface，经 mapOntologyFunctionDetailToDraft 后回填 name/description；基础函数另回填 definition。generation 防过期。

## 新增依赖及必要性

无。

## 验证方式

TDD；node --test tests/function-operator-workspace.test.mjs；format:check。
