# 本体对象属性接口文档

## 需求理解

根据在线接口文档生成本体对象属性新增、删除、修改、按本体查询和按分类查询五份 Markdown 说明；所有接口 URI 按要求增加 `/ontology` 前缀。

## 修改范围

仅新增 `docs/20260920/` 下五份接口说明，不修改运行时代码、接口实现或受保护目录。

## 文件

- `createOntologyPropertyApi-guoshengnan.md`
- `deleteOntologyPropertyApi-guoshengnan.md`
- `updateOntologyPropertyApi-guoshengnan.md`
- `getOntologyPropertyByOntologyIdApi-guoshengnan.md`
- `getOntologyPropertyByCategoryIdApi-guoshengnan.md`

## 契约映射

- 新增：POST `/ontology/property`，JSON 请求体。
- 删除：DELETE `/ontology/property/{propertyUniqueIdentifier}`，路径参数。
- 修改：PUT `/ontology/property`，JSON 请求体。
- 全部查询：GET `/ontology/property/info`，必填 `ontologyUniqueIdentifier` 查询参数。
- 分类查询：GET `/ontology/property/by_category`，可选 `categoryId` 查询参数，不传时查询全部属性。

## 验证

对五份 Markdown 执行仓库 Prettier 格式化、格式检查和 `git diff --check`。
