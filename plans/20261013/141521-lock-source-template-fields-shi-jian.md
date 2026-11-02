# 源版本锁定名称与 API 名称

## 需求理解

选择源版本后回填 functionApi，并锁定名称与 api 名称；清除源版本后解锁并置空这两项。

## 修改范围

FunctionOperatorFormDialog.vue 与 function-operator-workspace 契约测试。

## 新增、修改和删除文件

- 修改：FunctionOperatorFormDialog.vue、tests/function-operator-workspace.test.mjs

## 核心实现方式

isSourceTemplateLocked；applySourceTemplateDraft 写入 functionApi；清空源版本/切换源函数时置空 name 与 functionApi。

## 新增依赖及必要性

无。

## 验证方式

TDD；node --test tests/function-operator-workspace.test.mjs；format:check。
