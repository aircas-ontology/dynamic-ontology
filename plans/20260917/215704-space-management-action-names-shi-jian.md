# Plan：空间管理操作函数语义化命名与 JSDoc

确认范围（用户 2026-09-17「确认」）。

## 需求理解

`useSpaceManagementActions` 中模糊函数名改为「动作 + 对象」，并补充简短 JSDoc；同步 `index.vue`。

## 修改范围

- `useSpaceManagementActions.ts`
- `index.vue`

## 新增依赖

无。

## 验证方式

`npm run type-check`
