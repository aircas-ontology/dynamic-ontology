# Plan: 更新基础函数测试接口文档（writeBackEntityPrimaryKey）

## 需求理解

在 `docs/20261105/testActionApi.md` 对齐基础函数新测试参数：补充 `writeBackEntityPrimaryKey` 说明与示例。本轮只改文档。

## 修改范围

- 修改：`docs/20261105/testActionApi.md`

## 新增、修改和删除文件

- 修改上述文档；新增本 Plan

## 核心实现方式

1. §5.3.3 补充回写传参说明与单对象/多对象回写示例。
2. §5.1 `ActionTestParam` 表增加 `writeBackEntityPrimaryKey`。

## 新增依赖及必要性

无

## 验证方式

文档核对；`format:check`。
