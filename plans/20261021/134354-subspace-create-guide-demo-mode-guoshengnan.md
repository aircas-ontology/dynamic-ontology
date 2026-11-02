# 创建主题页引导演示模式（全链路 Mock、不真实创建、关闭即退回）

## 1. 需求理解

新手引导链 1「新建主题」会引导用户从主题管理页进入创建主题页，依次完成「选择对象 → 选择实例 → 配置属性 → 配置关系 → 创建」。当前该页全部走真实接口，真实数据不完整导致后续步骤因约束（如对象属性为空、关系端点不在已选对象内）无法顺利通过。

本次目标：

1. **创建主题页一律使用演示模式**：分类体系树、对象实例、对象属性、关系列表四类数据全部来自本地演示样例，彼此 ID 成套关联，保证四步可连贯走通。
2. **不真实创建主题**：点击「创建」不调用 `POST /ontology/space/subspace`，不产生任何服务端副作用。
3. **关闭引导直接退回主题管理页**：退出、跳过、完成三种关闭方式统一 `router.replace` 到 `ThemeSpaceManagement`，不留历史回退。

范围边界：演示模式仅作用于「主题创建」入口（`route.query.from === "theme-space-management"`，即引导所在页面）。对象空间管理页进入的「创建子空间」入口（`from` 缺省）保持真实接口与真实创建，行为不变。

## 2. 方案选择

| 方案 | 做法 | 结论 |
| --- | --- | --- |
| A. 打开全局 `USE_MOCK` | `public/configs/domainConfig.js` 置 true | 不采用：全站生效（登录及其他页面一并走 mock），且该文件是受保护目录，不由大模型修改 |
| B. 请求层 per-request mock | 扩展 `src/utils/request.ts` 增加 `useMock` 开关 | 不采用：改动全站公共请求层，影响面大，且依赖本地 mock server 启动 |
| **C. 页面级演示模式** | 仅在创建主题页替换四类数据源，提交处短路，返回改 `replace` | **采用**：改动集中、零真实副作用、不依赖 mock server |

## 3. 修改范围

### 3.1 新增文件

| 文件 | 说明 |
| --- | --- |
| `src/mocks/ontologySubspaceCreateGuideMock/ontologySubspaceCreateGuideMock.ts` | 创建主题演示样例数据：分类体系树、对象实例、对象属性、关系分类树；并提供四个纯查询函数，返回 `ApiResponse<T>` |
| `src/views/OntologySubspaceCreate/utils/loadGuideObjectWorkspace.ts` | 用演示分类树数据经 `mapOntologyCategoryTree` / `mapOntologyCategorySections` 组装 `OntologyObjectWorkspace`，供树面板 loader 注入 |
| `tests/ontology-subspace-create-guide-demo.test.mjs` | 演示模式行为测试（数据成套性、查询函数、提交短路与退回依赖的判定逻辑） |

### 3.2 修改文件

| 文件 | 改动 |
| --- | --- |
| `src/views/OntologySubspaceCreate/index.vue` | ① 新增 `isGuideDemoMode`（`query.from === "theme-space-management"`）；② `queryObjectInstances` / `queryObjectProperties` / `loadParentSpaceRelations` 在演示模式下改用演示查询函数，状态语义（loading/success/empty/error）不变；③ `createSubspace()` 演示模式跳过真实提交，仅提示并关闭引导；④ 新增 `watch(guideVisible)`，演示模式下引导关闭即 `router.replace({ name: "ThemeSpaceManagement" })`；⑤ 向树面板传入 `guide-mode` |
| `src/views/OntologySubspaceCreate/components/SubspaceCreateTreePanel.vue` | 新增 `guideMode` prop；演示模式下 `useOntologyObjectWorkspace(spaceId, loadGuideObjectWorkspace)`（composable 已支持 loader 注入，无需修改） |

### 3.3 不修改

`src/utils/request.ts`、`public/configs/domainConfig.js`、`src/mockData/**`、`src/composables/shared/useOnboardingGuide.ts`、`OnboardingGuideOverlay.vue` 及其他页面。

## 4. 核心实现方式

### 4.1 演示数据成套设计

以截图中的海军领域对象为蓝本，定义 4 个演示对象（ID 稳定、可重复）：

- `ontology-platform` 平台
- `ontology-carrier` 航空母舰
- `ontology-destroyer` 驱逐舰
- `ontology-frigate` 护卫舰

分类树：根分类「全部」→「舰船」→「水面舰艇」，对象挂在水面舰艇分类下（`categoryId` 自成一体系）。实例按对象各 12 条（支持分页 `pageNum`/`pageSize` 切片）；属性按对象 4 条且包含 `isPrimaryKey: true` 的主键属性；关系分类树中每条 link 的 `ontologyUniqueIdentifierFrom` / `To` 均落在上述 4 个对象内，确保 `mapSubspaceCreateRelationsFromTree` 能筛选出关系行。

类型全部复用 `@/types`：`OntologyCategoryTreeData`、`GetOntologyEntitiesData`、`GetOntologyPropertyByOntologyIdData`、`OntologyRelationCategoryTreeData`、`ApiResponse<T>`，不使用 `any` 或类型断言。

### 4.2 数据源替换点

- 分类树：`SubspaceCreateTreePanel.vue` 通过 `useOntologyObjectWorkspace(spaceId, loader)` 的第二个参数注入 `loadGuideObjectWorkspace`，组件其余逻辑不变。
- 实例：`index.vue` 的 `queryObjectInstances()` 在演示模式返回演示分页数据（仍经 `mapSubspaceCreateSelectedInstances` 映射）。
- 属性：`queryObjectProperties()` 在演示模式返回演示属性数组（仍经 `mapSubspaceCreateObjectPropertyGroup` 映射）。
- 关系：`loadParentSpaceRelations()` 在演示模式按每个已选对象返回演示关系树（仍经 `mapSubspaceCreateRelationsFromTree` 筛选）。

映射链路与真实数据完全一致，仅数据来源不同，因此页面交互与校验逻辑无需改动。

### 4.3 不真实创建与退回

- `createSubspace()`：演示模式下先做与现有一致的名称校验，随后不调用 `createOntologySubspaceInterface`，改为 `ElMessage.success("引导演示已完成，未真实创建主题")` 并把 `guideVisible.value = false`。
- 退回统一由 `watch(guideVisible, (value, previous) => { if (previous && !value && isGuideDemoMode.value) router.replace({ name: "ThemeSpaceManagement" }); })` 完成，覆盖浮层的退出按钮、跳过、最后一步完成三条路径，且 `replace` 不留历史回退。
- 非演示模式（子空间创建）保持 `router.back()` 与真实提交不变。

## 5. 新增依赖

无。全部复用现有依赖与类型。

## 6. 验证方式

1. **TDD**：先编写 `tests/ontology-subspace-create-guide-demo.test.mjs`，确认因功能未实现而失败，再完成实现并验证通过。
   - 分类树演示数据映射后包含 4 个可勾选对象；
   - 实例查询按 `pageNum` / `pageSize` 正确分页，`total` 与总数一致；
   - 属性查询每个对象均返回非空且含主键属性，`listSubspaceCreateObjectsMissingProperties` 可在勾选后返回空；
   - 关系查询的每条关系两端点均在演示对象集合内，`mapSubspaceCreateRelationsFromTree` 能筛出关系行；
   - 源码级检查：`createSubspace()` 在演示模式分支中不包含 `createOntologySubspaceInterface` 调用；退回使用 `router.replace` 且目标为 `ThemeSpaceManagement`。
2. `npm run type-check`：类型检查通过，无 `any` 与断言逃逸。
3. `npm run test`：全量测试通过。
4. `npm run check:project-conventions`、`npm run check:types-conventions`：约定检查通过。
5. **手动冒烟**（`USE_MOCK=false`、真实后端）：
   - 主题管理页 → 新建主题 → 创建主题页：四步数据均来自演示数据，「创建」后后端无新增主题；
   - 引导中途点退出/跳过 → 直接回到主题管理页，浏览器后退不会回到创建页；
   - 对象空间管理页 → 创建子空间：仍走真实接口与真实创建，行为不变。
