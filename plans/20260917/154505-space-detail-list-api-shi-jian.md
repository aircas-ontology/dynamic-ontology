# Plan：详情页按列表接口定位空间（去掉旧 mock 查找）

确认范围（用户 2026-09-17「确认」）。

## 需求理解

详情页不再用 `ontologySpaceListMock` 按 id 查找；改为调用已有列表接口并按路由 `spaceId` 匹配。无独立详情接口。

## 修改范围

- 移动 `mapOntologySpaceList.ts` → `src/utils/mapOntologySpaceList.ts`
- 更新列表页 import
- 重写 `useSpaceWorkspace.ts`：异步拉列表 → 映射 → `findSpaceById`；失败 `error`；无 id/未命中 `empty`；防过期响应
- 保留 `spaceLookup.ts`
- 更新相关测试断言

## 新增依赖

无。

## 验证方式

TDD + `npm test`（相关）/ `type-check` / `build:verify` / 任务文件 format。
