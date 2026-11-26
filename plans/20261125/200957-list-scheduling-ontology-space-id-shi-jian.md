# 调度列表参数同步为 ontologySpaceId

## 需求理解

`docs/20261111/listSchedulingApi.md` 新增可选查询参数 `ontologySpaceId`（按行为所属空间过滤）。当前代码在 `listBehaviorSchedulingType.ts` 使用 `spaceId`，请求会把错误字段名传给后端。需改为契约字段名；调度页在已有空间上下文中继续传入当前空间 id。

## 修改范围

- 类型：`ListBehaviorSchedulingParams.spaceId` → `ontologySpaceId?: number`
- 调用：调度工作台列表请求与 `fetchBehaviorSchedules` 默认参数
- 测试：断言请求参数字段名的用例
- 文档：去掉「接口不提供空间筛选」过时说明（与参数表冲突）

## 新增 / 修改 / 删除文件

| 动作 | 文件                                                                       |
| ---- | -------------------------------------------------------------------------- |
| 修改 | `src/types/apis/listBehaviorSchedulingType.ts`                             |
| 修改 | `src/views/SpaceBehaviorScheduleWorkspace/index.vue`                       |
| 修改 | `src/views/SpaceBehaviorScheduleWorkspace/utils/fetchBehaviorSchedules.ts` |
| 修改 | `tests/schedule-save-api.test.mjs`                                         |
| 修改 | `docs/20261111/listSchedulingApi.md`（页面映射过时句）                     |
| 新增 | `plans/20261125/200957-list-scheduling-ontology-space-id-shi-jian.md`      |

不改创建/更新调度体里的 `spaceId`（那是另一套契约字段）。

## 核心实现方式

1. `ListBehaviorSchedulingParams`：`spaceId: number` 改为 `ontologySpaceId?: number`，注释改为「空间 id，按行为所属空间过滤」。
2. `index.vue` 组装列表参数时改为 `ontologySpaceId: Number(scheduleSpaceId.value)`。
3. `fetchBehaviorSchedules` 默认参数改为 `{ pageNum: 1, pageSize: 10 }`（不默认传 `0`，与可选契约及现有 `schedule-list` 默认断言一致）。
4. 更新 `schedule-save-api.test.mjs` 中列表请求断言：`spaceId` → `ontologySpaceId`；去掉重复 `spaceId` 键写法。
5. 文档「页面映射与限制」中删除「接口不提供空间筛选…」一句，改为说明可传 `ontologySpaceId` 按空间过滤。

## 新增依赖

无。

## 验证方式

- `node --test tests/schedule-list.test.mjs tests/schedule-save-api.test.mjs`
- `npm run format:check -- <改动文件>`
- `npm run type-check` / `npm run build:verify`（关注本次改动文件）
