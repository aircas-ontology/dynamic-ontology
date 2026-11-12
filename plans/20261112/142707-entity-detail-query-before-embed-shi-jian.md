# Plan：先查详情 URL，有地址再进入嵌入页

## 需求理解

点击「详情」先请求实例 URL；仅当返回非空 url 后进入嵌入页；否则留在列表并提示。

## 修改范围

- `src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityList.vue`
- `tests/entity-browsing-object-profile-entity-list.test.mjs`

## 新增、修改和删除文件

- 修改上述文件。

## 核心实现方式

1. `openEntityDetail` 异步先查 URL，成功才设 `detailEmbedded`。
2. 失败 `ElMessage.error`，不跳转。
3. `detailOpening` 防重复；`autoOpenDetail` 同逻辑。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测、format:check
