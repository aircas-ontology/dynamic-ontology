# Plan：标准应用情况 Tab

## 需求理解
图一左树右表框架 + 图二汇总徽章/表格/标准详情弹窗；内容按 GB/T 39316.5-2020 数据元字段结构造船语义 Mock。

## 修改范围
EntityBrowsingObjectProfile 页面、类型、Mock。

## 新增 / 修改 / 删除文件
- 新增 ObjectProfileStandardUsage.vue
- 新增 entityBrowsingObjectProfileStandardUsageMock.ts
- 修改 entityBrowsingObjectProfileType.ts、types/index.ts、index.vue
- 无新增依赖

## 核心实现
左树筛选；右上三徽章；右表六列；点标准名称弹窗展示数据元详情。

## 新增依赖
无

## 验证
type-check、build、人工点 Tab
