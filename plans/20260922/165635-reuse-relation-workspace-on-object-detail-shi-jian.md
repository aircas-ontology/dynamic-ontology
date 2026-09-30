# 对象详情关系 Tab 复用空间关系模块

## 需求理解

对象详情关系 Tab 直接复用 SpaceRelationWorkspace；spaceId 支持 params 与 query；对象上下文默认按当前对象做源筛选。

## 修改范围

- `workspaceRoutes.ts`
- `resolveRelationSpaceId.ts`（新建）
- `useSpaceRelationWorkspace.ts`
- `SpaceRelationWorkspace.vue`
- 相关测试

## 核心实现方式

1. 路由组件改为 SpaceRelationWorkspace。
2. spaceId = params.spaceId || query.spaceId。
3. 存在 objectId 时加载后默认 applyRelationFilter。

## 新增依赖及必要性

无。

## 验证方式

- 相关路由/关系测试、format:check
