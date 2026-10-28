# Plan：明确 useSpaceManagement 方法命名

确认范围（用户 2026-09-17「确认」）。

## 需求理解

`load` / `save` / `remove` 改为完整「动作 + 对象」名称。

## 修改范围

- `useSpaceManagement.ts`：`fetchOntologySpaces`、`loadOntologySpaces`、`saveOntologySpace`、`removeOntologySpace`
- `useSpaceManagementActions.ts`、`index.vue` 同步调用

## 新增依赖

无。

## 验证方式

`npm run type-check`
