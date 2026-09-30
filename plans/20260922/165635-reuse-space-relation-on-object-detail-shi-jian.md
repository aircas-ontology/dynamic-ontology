# 对象详情关系 Tab 复用空间关系模块

## 需求理解

对象详情「关系」Tab 直接复用 `SpaceRelationWorkspace`；spaceId 支持 params 与 query；进入对象页时默认按当前对象做源筛选。

## 修改范围

- `workspaceRoutes.ts`
- `resolveRelationRouteContext.ts`（新建）
- `useSpaceRelationWorkspace.ts`
- `SpaceRelationWorkspace.vue`
- 相关测试

## 核心实现方式

1. 对象关系路由组件改为 `SpaceRelationWorkspace.vue`。
2. `spaceId = params.spaceId || query.spaceId`。
3. 存在 `params.objectId` 时，加载成功后按 objectId/objectName 默认源筛选。

## 新增依赖及必要性

无。

## 验证方式

- 相关路由/关系测试、`format:check`
