# Plan：基础函数行为创建/测试 API 文档更新

## 需求理解

将「基础算子行为 / `BASIC_OPERATOR`」文档契约改为「基础函数行为 / `BASIC_FUNCTION`」，写入创建三类示例与测试三类示例。

## 修改范围

仅 docs，不改业务源码。

## 新增、修改和删除文件

- 修改：`docs/20261103/createActionApi.md`
- 修改：`docs/20261103/funlistApi.md`
- 修改：`docs/20261105/testActionApi.md`
- 新增依赖：无

## 核心实现方式

1. createActionApi §3.4 改为 `BASIC_FUNCTION` + `basicFunction` 字段与三例。
2. 通用字段与注意事项：基础函数用 `basicFunction.ontologyIdentifiers`，不要求顶层 `ontologyIdentifier`。
3. funlist 场景 B：基础函数创建不调用本接口。
4. testAction §5.3.3 改为 `BASIC_FUNCTION`，写入不传实例 / 单实例 / 多对象三例。

## 验证方式

- 通读交叉引用一致
- `npm run format:check --` 改动 md
