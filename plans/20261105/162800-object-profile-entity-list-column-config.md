# Plan：实体列表「配置」+ 内网字段映射修复

## 需求理解

- 对象画像「实体列表」右侧「配置」当前是占位（配置功能待接入）。
- 内网导入后表格只见 ontologyName / primaryKey / displayName，字段过少。
- OpenAPI EntityInfoVO 中主属性在 properties: EntityPropertyVO[]；现有映射只认对象，数组被跳过。
- 目标：修映射让主属性列出来；「配置」可勾选显示列（按 objectId 本地记忆）。

## 修改范围

- src/views/EntityBrowsingObjectProfile/utils/mapObjectProfileEntityRows.ts
- src/views/EntityBrowsingObjectProfile/composables/useObjectProfileEntityList.ts
- src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityList.vue
- src/types/apis/getOntologyEntitiesType.ts
- tests/entity-browsing-object-profile-entity-list.test.mjs
- 新增 ObjectProfileEntityListConfigDialog.vue
- Plan 落盘：plans/20261105/

## 新增 / 修改 / 删除文件

- 新增 ObjectProfileEntityListConfigDialog.vue
- 修改上述 utils / composable / list 页面 / 类型 / 测试
- 无删除；无新 npm 依赖

## 核心实现方式

1. 映射兼容：properties 为数组时按 propertyName/propertyApiName 展平；对象 Record 保持 Mock 行为。
2. 配置弹窗勾选 allColumns；visibleColumns 驱动表格与筛选；localStorage 按 objectId 记忆；至少一列。
3. 去掉「配置功能待接入」占位。

## 新增依赖及必要性

无。

## 验证方式

- 单测数组/对象形态；type-check；build
