# 对象画像属性区改用空间管理同源只读展示

## 需求理解

`ObjectProfileStandardUsage` 当前用 Mock 展示标准符合度等列。改为与空间管理属性面板同一接口与展示字段；仅数据展示，无操作功能。

## 修改范围

- `src/views/EntityBrowsingObjectProfile/components/ObjectProfileStandardUsage.vue`
- `tests/entity-browsing-object-profile-entity-list.test.mjs`

## 新增、修改和删除文件

- 修改：上述组件与测试
- 新增：本 Plan
- 删除：无（Mock 文件保留，停止引用）

## 核心实现方式

1. 调用 `getOntologyObjectArrTypeTreeInterface`，用 `mapCategoryTreeNode` / `collectPropertyItemsFromTree` / `findCategory` 映射。
2. 左树只读搜索与选中；右表列与空间管理一致（无操作列）。
3. 处理 loading / error / empty。

## 新增依赖及必要性

无。

## 验证方式

- 相关 `npm test`
- `format:check`
- `type-check` / `build:verify`
