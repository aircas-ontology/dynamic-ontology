# 行为详情对象标识改为创建时间

## 需求理解

详情摘要「对象标识」改为展示「创建时间」（`createTime`）。

## 修改范围

- 类型增加 `createTime`
- viewState 映射 `createTime`
- 详情抽屉展示创建时间
- 相关测试与类型规范校验

## 新增、修改和删除文件

- 修改：类型、映射工具、详情抽屉、测试
- 无新增/删除

## 核心实现方式

接口字段透传至 viewState，替换原对象标识行。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测、`check:types-conventions`、`type-check`、`build:verify`、format:check
