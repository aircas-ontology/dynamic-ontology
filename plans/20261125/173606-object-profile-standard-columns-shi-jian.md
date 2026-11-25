# 属性表恢复标准列与三块统计

## 需求理解

对象画像属性表改回原先标准应用列与三块统计徽章；属性基础信息仍来自分类树接口，标准字段无数据时展示空占位。

## 修改范围

- `src/views/EntityBrowsingObjectProfile/components/ObjectProfileStandardUsage.vue`
- `tests/entity-browsing-object-profile-entity-list.test.mjs`

## 新增、修改和删除文件

- 修改：上述组件与测试
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 恢复徽章：属性总数、标准引用数（0）、标准符合度（—）。
2. 表格列：属性名称、数据类型、属性描述、是否引用标准、标准名称、标准符合度。
3. 标准侧字段空占位，不回退 Mock。

## 新增依赖及必要性

无。

## 验证方式

- 相关 `npm test`
- `format:check`
- `type-check` / `build:verify`
