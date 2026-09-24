# Plan：详情抽屉对接 getFunInfo

确认范围（用户 2026-09-24「确认」）。

## 需求理解

点击卡片/表格行拉详情；输入参数用 params；基础函数不展示输出参数；无契约字段的元信息项不展示。

## 修改范围

- mapOntologyFunctionDetail：新增 mapOntologyFunctionDetailToOperator
- openDetail 异步拉详情 + detailLoading
- DetailDrawer 条件渲染与 loading
- 相关单测

## 新增依赖

无。

## 验证方式

相关单测 + format。
