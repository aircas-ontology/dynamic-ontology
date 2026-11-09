# Plan：实体统计信息 Tab（舰船统计）

## 需求理解
在「实体统计信息」Tab 按图实现「舰船统计」2列×3行共6张 ECharts 图；其余 Tab 不动。

## 修改范围
- EntityBrowsingObjectProfile 页面与 Mock / 类型

## 新增 / 修改 / 删除文件
- 新增 components/ObjectProfileEntityStats.vue
- 新增 mocks/.../entityBrowsingObjectProfileStatsMock.ts
- 修改 entityBrowsingObjectProfileType.ts、types/index.ts、index.vue
- 无新增依赖

## 核心实现方式
- Grid 六图：构型饼、服役柱、母港柱、状态饼、厂商柱、下水柱
- Mock 近似贴图；shallowRef + dispose + ResizeObserver

## 新增依赖及必要性
无（复用 echarts）

## 验证方式
npm run type-check；npm run build；人工点开 Tab
