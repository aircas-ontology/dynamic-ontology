# Plan：实体浏览概览字号放大

## 需求理解
实体浏览页顶部统计/质量卡片与下方类型 Tab 字号偏小，仅放大字号与必要高度。

## 修改范围
- src/views/EntityBrowsing/components/EntityBrowseOverview.vue
- src/views/EntityBrowsing/components/WorkspaceTypeTabs.vue

## 核心实现方式
h2 14->16；标签 13->14；数值 22->28；min-height 56->64；Tab 14->16；角标 12->14。

## 新增依赖
无

## 验证方式
type-check、build；人工看字号
