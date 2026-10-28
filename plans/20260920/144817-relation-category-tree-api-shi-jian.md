# Plan：对接查询空间关系分类树

确认范围（用户 2026-09-20）：URI `/ontology/category/link_category/tree`；Mock message `SUCCESS`；links 有映射问题本轮不映射。

## links 映射问题（本轮不映射）

接口 `links` 字段无法无损映射到页面 `OntologyRelationClass`：

- `type: "COMPOSITION"` 无法对应 `cardinality`（一对一/一对多/多对一/多对多）
- 缺少 `apiName`、`categoryName`、`description`
- `name` 与 `displayName` 语义是否等同未约定

因此本轮仅映射分类树节点；`relations` / `objectOptions` 置空，右侧关系图/列表暂无数据。本地 mock CRUD 仍保留，供有树后的前端演示。

## 需求理解

- 查询关系分类树并展示在 `RelationCategoryPanel`
- 响应无 `data` 时展示【添加关系分类】按钮（对齐对象侧空态）

## 修改范围

- types / mocks / apis + barrel
- mapper `mapOntologyRelationCategoryTree`
- `useSpaceRelationWorkspace` 异步拉树
- `RelationCategoryPanel` 空态按钮
- 根节点 id 改为接口 `categoryId`；编辑/删除/过滤按树根 id 判断，不再写死 `relation-all`（mock 种子可继续用旧 id）
- 空树创建：本地 `addRelationCategory` 支持无父时创建根节点
- 相关测试

## 核心实现

- GET `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/category/link_category/tree"`，params `spaceId: string`，timeout `requestTimeoutMs`
- data 单根：`categoryId`、`name`、`links?`、`children?`
- 映射：`id=String(categoryId)`，`label=name??""`，无 color
- 无 data → `categoryTree: []`，面板显示添加按钮

## 新增依赖

无

## 验证方式

TDD + 相关测试 + type-check + 任务文件 format
