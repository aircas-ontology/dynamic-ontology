# Plan：创建主题增加「选择行为」步骤

## 需求理解

在创建主题向导「选择函数」之后增加第 6 步「选择行为」：按 `docs/20261123/actionSlectApi.md` 调用 `GET /ontology/action/selectable` 拉取已发布行为，多选可跳过；创建时写入 `selectedActionIds`。

过滤规则（已确认）：

- 有选对象时传 `ontologyIdentifiers`
- 有选函数时传 `functionApis`
- 行为步骤放在函数之后

## 修改范围

- 契约：selectable 类型、API、导出
- 页面：第 6 步面板、步骤条、创建映射、onboarding
- 测试：TDD 覆盖步骤、映射、API 路径与引导锚点

## 新增、修改和删除文件

### 新增

- `src/types/apis/getOntologyActionSelectableType.ts`
- `src/views/OntologySubspaceCreate/components/SubspaceCreateActionPanel.vue`

### 修改

- `src/apis/ontologyActionApi.ts`、`src/apis/index.ts`
- `src/types/index.ts`
- `src/views/OntologySubspaceCreate/utils/mapSubspaceCreateRequest.ts`
- `src/views/OntologySubspaceCreate/index.vue`
- `src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue`
- `src/views/onboardingGuideSteps.ts`
- `tests/ontology-subspace-create.test.mjs`
- `tests/onboarding-guide.test.mjs`

### 删除

- 无

### 不修改

- `html/`、`public/`
- `createOntologySubspaceType.ts`（已有 `selectedActionIds`）

## 核心实现方式

1. 步骤：`选择对象 → 选择实例 → 配置属性 → 配置关系 → 选择函数 → 选择行为`；末步显示「创建」。
2. 入参：`ontologySpaceId`；已选对象 id → `ontologyIdentifiers`；已选函数 api → `functionApis`（有值才传）；数组以逗号拼接 query。
3. 列表无分页；列：行为名称、API、类别、函数 API、说明；勾选同步 `selectedActionIds: number[]`。
4. 异步：loading / success / empty / error + 重试；防过期响应。
5. `mapSubspaceCreateRequest` 在有选中时附带去重后的 `selectedActionIds`。

## 新增依赖及必要性

无。

## 验证方式

- `npm test`
- `npm run test:coverage`
- `npm run type-check`
- `npm run build:verify`
- `npm run format:check -- <任务文件列表>`
