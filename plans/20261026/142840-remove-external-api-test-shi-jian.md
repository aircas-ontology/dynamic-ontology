# 去除外部 API 表单内配置测试

## 需求理解

从外部 API 新建/编辑表单中删除「配置测试」整块 UI；列表侧外部 API 测试弹框保留。

## 修改范围

- FunctionOperatorFormDialog.vue：删模板、状态、函数、样式
- function-operator-workspace.test.mjs：断言改为 doesNotMatch

## 核心实现方式

整块删除配置测试相关代码。

## 新增依赖

无

## 验证方式

相关测试、format:check、type-check、build:verify
