# Plan：单对象时聚合参数名/输入属性名单选

## 需求理解

单对象：聚合参数名与输入属性名改为属性单选（与展示字段同源）。多对象：保持自由输入。

## 修改范围

BasicFilterGroupEditor / FunctionOperatorBasicFilterBuilder / BehaviorFormDialog + 相关测试。

## 新增依赖

无

## 验证方式

相关单测 + format:check
