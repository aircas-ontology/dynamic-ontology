# 查看实例数据改用 page 已有数据

## 需求理解

点击「查看实例数据」展示当前实体在 `row_detail/page` 已拉取的数据；停止调用 `/ontology/entity/row_detail`。

## 修改范围

- `BehaviorTestDialog.vue`、`BehaviorEntityRowDetailDialog.vue`
- `mapOntologyEntityRowDetailToDataRows.ts`（新增 page → VO 适配）
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

仅修改上述文件；无新依赖、无删除。

## 核心实现方式

1. 缓存 `groupRowPageData`；适配为详情 VO。
2. 详情弹框用 `externalDetail`，不再请求 `row_detail`。
3. 重载由父组件重拉 page；新增场景选实体或打开时补拉 page。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- format / type-check / build:verify
