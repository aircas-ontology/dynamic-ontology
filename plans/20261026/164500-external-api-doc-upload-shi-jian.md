# 外部 API 上传文档回填入出参

## 需求理解

外部 API 表单增加与容器共用的上传接口文档 + 自动探查；用户单选一条已发现接口后回填入出参表，回填后仍可手动编辑。

## 修改范围

- 新增映射工具与单测
- FunctionOperatorFormDialog.vue：上传+探查+单选回填
- function-operator-workspace.test.mjs 等断言

## 核心实现方式

upload_doc → probe_interfaces → 单选接口 → 映射覆盖入出参；方法同步；不臆造 URL。

## 新增依赖

无

## 验证方式

相关测试、format:check、type-check、build:verify
