# 新增行为接口（1.createOntologyActionApi.md）对接条件评估

- 时间：2026-10-19 18:00（Asia/Shanghai）
- 作者：guoshengnan
- 性质：只读评估结论（未实施），供后续对接任务参考
- 评估对象：`docs/20261019/1.createOntologyActionApi.md`（POST `/ontology/action` 新增行为）
- 用户指令：检查接口文档说明和行为新建页面状态，是否具备对接条件

## 一、结论

接口文档已具备落地条件；行为新建页面目前不具备直接对接条件，存在前置工程与字段缺口。

## 二、编译位置现状（文档要求 vs 实际）

| 文档要求                                                           | 现状       |
| ------------------------------------------------------------------ | ---------- |
| `src/apis/ontologyActionApi.ts`（`createOntologyActionInterface`） | 不存在     |
| `src/types/apis/createOntologyActionType.ts`                       | 不存在     |
| `src/mocks/createOntologyActionMock/createOntologyActionMock.ts`   | 不存在     |
| barrel 导出（`src/apis/index.ts`、`src/types/index.ts`）           | 无对应导出 |

文档本身完整自洽（含 types/apis/mocks 示例代码、字段说明、响应契约），照文档创建即可。

## 三、行为新建页面现状

- 空间行为：`src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts` 的 `createBehavior(draft)` 同步调用 `createSpaceBehaviorMock(spaceId, draft)`（前端本地构造数据后刷新列表），无真实接口调用。
- 对象行为：`src/views/ObjectBehaviorWorkspace/composables/useObjectBehaviorWorkspace.ts` 的 `createObjectBehavior(draft)` 同样调用 `createSpaceBehaviorMock`。
- 提交数据结构 `SpaceBehaviorDraft`（`src/types/pages/ontologySpaceBehaviorType.ts`）：仅含 `displayName / functionOperatorId / functionOperatorName / description / categoryId / status / basicAction / changeNote / version`，不含输入参数、图标、行为 API 名称。

## 四、请求体与表单字段对照

| 接口字段                              | 页面现状                                                                                                                                         | 评估                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `ontologyIdentifier`（必填，对象 id） | 空间行为工作区无对象上下文                                                                                                                       | 语义不匹配：接口为“在指定对象下新增行为”，语义上对应对象行为工作区 |
| `icon`（必填，图片 URL）              | 表单无图标字段                                                                                                                                   | 缺口                                                               |
| `actionApi`（必填，行为 API 名）      | 表单无 API 名称输入（列表项有 `behaviorApiName` 但非表单收集）                                                                                   | 缺口                                                               |
| `functionApi`（非必填）               | `draft.functionOperatorId` 即函数 API                                                                                                            | 可映射                                                             |
| `displayName` / `description`         | 已有                                                                                                                                             | 可映射                                                             |
| `linkMapping`（关系映射）             | 表单无关系映射收集                                                                                                                               | 缺口                                                               |
| `mappingIns`（参数映射）              | 输入参数仅作展示，结构为 `SpaceBehaviorParameter`，与 `ActionParamMappingCreateParam`（`functionParamId`/`propertyUniqueIdentifier` 等）完全不同 | 缺口，需新增绑定转换                                               |
| `categoryId` / `status` / 输出参数    | 表单有，接口不接收                                                                                                                               | 需确认丢弃或另行处理                                               |

## 五、对接前需完成的工作

1. 按文档新增 apis / types / mocks 三个文件及 barrel 导出（纯新增，与页面改造解耦）。
2. 确认目标页面：接口语义是对象行为（`ontologyIdentifier` 为对象 id），应对接 `ObjectBehaviorWorkspace`；若要给空间行为工作区使用，需后端确认空间维度创建接口或该参数传法。
3. 表单补齐 `icon`、`actionApi` 收集，新增 `linkMapping`、`mappingIns` 映射逻辑。
4. `createBehavior` 由同步 Mock 调用改为异步接口调用，按 AGENTS.md 第 6 节补齐 idle/submitting/success/error 状态与防重复提交。

## 六、验证方式（后续实施时）

- TDD：先新增/更新 `tests/*.test.mjs` 源码断言与行为测试并确认失败，再实施。
- `npm test`、`npm run type-check`、`npm run build:verify`、`npm run format:check -- <改动文件>`。
- 浏览器冒烟：创建行为弹窗真实提交，检查请求 `/ontology/action` 与 Console 无错误。
