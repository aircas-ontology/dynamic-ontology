# 实体浏览关系/行为只读对齐原型

## 需求理解

实体浏览「关系」「行为」复用空间管理同源工作区原型；浏览态只读，与「对象」Tab 一致。

## 修改范围

- `SpaceRelationWorkspace/index.vue`
- `SpaceBehaviorWorkspace/index.vue`
- `SpaceBehaviorWorkspace/components/BehaviorCategoryPanel.vue`
- `SpaceBehaviorWorkspace/components/BehaviorListPanel.vue`

## 核心实现

1. 读取 `route.meta.browseOnly`
2. 浏览态隐藏分类增删改、添加/新建、编辑/删除/测试/状态管理
3. 浏览态保留查看、筛选、图/表切换、分页；关系图传 `readonly`
4. 空间管理详情不受影响

## 新增依赖

无

## 验证方式

`npm run build`
