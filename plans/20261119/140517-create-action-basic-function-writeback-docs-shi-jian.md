# Plan: 更新基础函数创建接口文档（writeBack）

## 需求理解

在 `docs/20261103/createActionApi.md` §3.4 补充 `basicFunction.writeBack` 契约，并加入聚合回写主表、查询回写子表示例。本轮只改文档。

## 修改范围

- 修改：`docs/20261103/createActionApi.md`
- 不改前端实现与类型；`editActionApi.md` 已声明 body 与创建一致，不另改。

## 新增、修改和删除文件

- 修改上述文档；新增本 Plan

## 核心实现方式

1. `basicFunction` 表增加 `writeBack`。
2. 增加 `writeBack` / `bindings[]` 字段说明。
3. 新增两份回写示例；保留原无回写示例。

## 新增依赖及必要性

无

## 验证方式

文档核对；`npm run format:check --` 该 md。
