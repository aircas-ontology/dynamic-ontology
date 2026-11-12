# 对象详情行为页复用空间行为工作区

## 需求理解

1. 删除原有 `ObjectBehaviorWorkspace` 页面及逻辑。
2. 对象详情「行为」Tab 挂载 `SpaceBehaviorWorkspace`，复用空间行为页面与逻辑。
3. 列表接口 `GET /ontology/action/list` 增加可选参数 `ontologyId`（路由 `params.objectId`）。
4. 对象详情下 `spaceId` 来自 `query.spaceId`，需与空间页 `params.spaceId` 一并解析。
5. 创建行为时锁定当前对象（对象选择器不可改，默认当前 `objectId`）。

## 修改范围

- 路由、列表类型与请求、`useSpaceBehaviorWorkspace` 路由解析与 `ontologyId` 传参。
- `BehaviorFormDialog`：对象详情创建时锁定对象选择（含主对象选择与应用行为属性来源对象选择默认/锁定）。
- 删除 `src/views/ObjectBehaviorWorkspace/**`。
- 更新相关单测。

不改分类树/发布等其它接口契约；不新增依赖；不触碰 `html/`、`public/`。

## 新增、修改和删除文件

| 操作 | 路径                                                                        |
| ---- | --------------------------------------------------------------------------- |
| 新增 | `src/views/SpaceBehaviorWorkspace/utils/resolveBehaviorRouteContext.ts`     |
| 修改 | `src/router/modules/workspaceRoutes.ts`                                     |
| 修改 | `src/types/apis/listOntologyActionType.ts`                                  |
| 修改 | `src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts` |
| 修改 | `src/views/SpaceBehaviorWorkspace/index.vue`                                |
| 修改 | `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`        |
| 修改 | `tests/ontology-space-behavior.test.mjs`                                    |
| 删除 | `src/views/ObjectBehaviorWorkspace/**`                                      |

## 核心实现方式

1. `OntologyObjectDetailBehavior` → `SpaceBehaviorWorkspace/index.vue`。
2. `ListOntologyActionParams.ontologyId?: string`；列表有 `ontologyId` 时附带查询。
3. `resolveBehaviorSpaceId` / `resolveBehaviorOntologyId` 对齐关系页解析；`watch(ontologyId)` 重载。
4. 向表单传入 `lockedOntologyId`；创建模式下禁用对象选择并预填；应用行为 PROPERTY 来源默认并锁定为该对象。

## 新增依赖及必要性

无。

## 验证方式

- 先改测试失败，再实现至通过（TDD）。
- `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`。
- 任务文件 `format:check` / 必要时 `format`。
- `git diff --check`、`git status --short`。
