# Plan：实体列表「详情」写死跳转外链

## 需求理解

- 点击实体列表「详情」时，打开固定地址：
  http://192.168.53.102:10606/#/layout/entity/ship/f7c3879a-6c62-40e0-8fa0-e9bb856eff61?embed=1
- 不按行动态拼 entityId / ship；所有行同一目标。
- 去掉当前行内属性详情弹窗。

## 修改范围

- src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityList.vue
- src/utils/entityBrowseConstants.ts
- Plan 落盘：plans/20261105/

## 新增 / 修改 / 删除文件

- 修改上述 2 个文件
- 无新增组件、无删除业务文件、无新依赖

## 核心实现方式

1. entityBrowseConstants.ts 增加 ENTITY_BROWSING_ENTITY_DETAIL_URL 常量。
2. 详情点击 window.open；打不开时 ElMessage.warning。
3. 删除详情弹窗及相关状态。

## 新增依赖及必要性

无。

## 验证方式

- npm run type-check、npm run build
- 人工：点详情新开上述地址
