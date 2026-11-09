# 浏览对象详情统一进实体列表 / 标准应用

## 需求理解

空间浏览对象详情不再使用「基本信息」完整画像，也不再按固定 objectId 区分精简/完整；任意对象统一进入「实体列表」与「标准应用情况」。

## 修改范围

- `src/views/EntityBrowsingObjectProfile/index.vue`
- `src/utils/entityBrowseConstants.ts`（删除 `isEntityBrowsingLiteProfileObjectId`）
- `tests/entity-browsing-object-profile-entity-list.test.mjs`

不删除基本信息相关组件文件；本页不再挂载。

## 新增、修改和删除文件

- 修改上述文件
- 新增本 Plan
- 无删除页面组件；无新依赖

## 核心实现方式

1. 画像页固定 Tabs：实体列表、标准应用情况；默认 `entity-list`。
2. 移除 lite/full 分支、`ObjectProfileOverview` 挂载及卡片跳转嵌入详情逻辑。
3. 删除 `isEntityBrowsingLiteProfileObjectId`；Mock 用的 FULL/LITE 常量若仍被引用则保留。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/entity-browsing-object-profile-entity-list.test.mjs`
- `npm run format:check -- <本次文件>`
- `npm run type-check`、`npm run build:verify`
