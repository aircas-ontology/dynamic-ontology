# 回填后清除名称校验提示

## 需求理解

源版本回填 name/functionApi 后清除这两项残留的「请输入」校验提示。

## 修改范围

FunctionOperatorFormDialog.vue 与契约测试。

## 新增、修改和删除文件

- 修改：FunctionOperatorFormDialog.vue、tests/function-operator-workspace.test.mjs

## 核心实现方式

applySourceTemplateDraft 赋值后 nextTick 调用 formRef.clearValidate(['name','functionApi'])。

## 新增依赖及必要性

无。

## 验证方式

TDD；node --test tests/function-operator-workspace.test.mjs；format:check。
