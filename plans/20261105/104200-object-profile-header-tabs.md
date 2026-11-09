# Plan：对象画像标题栏 Tab

## 需求理解
在 EntityBrowsingObjectProfile 标题栏右侧加入图一四个 Tab；本步只做切换壳，其它页内容下一步再填。

## 修改范围
- `src/views/EntityBrowsingObjectProfile/index.vue`
- `src/types/pages/entityBrowsingObjectProfileType.ts`

## 新增 / 修改 / 删除文件
- 修改上述 2 个文件
- 无新增组件、无删除业务文件

## 核心实现方式
- 标题左、Tab 右；复用此前 Tab 样式（高度 32、激活底边主色）
- Tab：`basic-info` 基本信息 / `entity-list` 实体列表 / `entity-stats` 实体统计信息 / `standard-usage` 标准应用情况
- 默认选中基本信息，显示现有 ObjectProfileOverview；其余简单空态「内容待配置」
- 切对象时重置回基本信息

## 新增依赖及必要性
无

## 验证方式
- `npm run type-check`
- `npm run build`
- 人工刷新查看 Tab 切换
