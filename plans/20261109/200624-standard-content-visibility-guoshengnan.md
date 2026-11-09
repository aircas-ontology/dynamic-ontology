# 标准内容展示开关

## 需求理解

用运行时配置 `DOMAIN_CONFIG.SHOW_STANDARD_CONTENT` 控制是否展示标准相关内容：空间浏览顶部「韧性标准应用数」「属性填充率」，以及对象画像「标准应用情况」。对象数量、关系数量、实体数量和实体列表始终保留。资产标准构建不在范围内。

`public/configs/domainConfig.js` 已由开发人员写入该字段，本次不修改 `public/`。

## 修改范围

- `DomainConfig` 增加可选字段
- 读取函数：未配置或 `true` 时展示，仅显式 `false` 时隐藏
- 概览质量卡片与标准应用页签按该值渲染
- 对应单测

## 新增、修改和删除文件

新增 `src/utils/isStandardContentVisible.ts`、`tests/standard-content-visibility.test.mjs`、本 Plan。

修改 `src/types/global/runtimeConfigType.ts`、`src/views/EntityBrowsing/components/EntityBrowseOverview.vue`、`src/views/EntityBrowsingObjectProfile/index.vue`、`tests/entity-browsing-statistics.test.mjs`、`tests/entity-browsing-object-profile-entity-list.test.mjs`。

无删除。

## 核心实现方式

页面读取 `isStandardContentVisible()`。关闭时不渲染质量卡片组，统计区改为单列；画像页只保留实体列表。

## 新增依赖及必要性

无。

## 验证方式

相关单测、任务文件 `format:check`、`check:types-conventions`。`type-check` 若仍有既有错误则单独记录。
