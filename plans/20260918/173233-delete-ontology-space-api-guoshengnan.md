# 对接本体空间删除接口 Plan

## 1. 需求理解

- 依据 `docs/20260918/deleteOntologySpaceApi-guoshengnan.md` 对接本体空间删除接口。
- 触发路径：本体空间管理页面 → 卡片/表格行「更多」→「删除」→ 弹出确认删除提示窗 → 点「删除」确认。
- 接口成功：关闭弹窗、提示「删除成功」、刷新本体空间列表。
- 接口失败：保留弹窗并展示失败信息。
- 删除按钮→弹窗→`confirmDeleteOntologySpace` 的 UI 流程已全部接通，核心改动仅在 API 契约层 + `confirmDeleteOntologySpace` 函数体 + 弹窗文案。

## 2. 修改范围

| 类别 | 文件 | 变更 |
| --- | --- | --- |
| 新增 | `src/types/apis/deleteOntologySpaceType.ts` | `DeleteOntologySpaceParams { spaceId: number }`、`DeleteOntologySpaceData = Record<string, unknown>` |
| 修改 | `src/types/index.ts` | 按字典序在 `createOntologySpaceType` 与 `ontologyManageType` 之间导出两个新类型 |
| 修改 | `src/apis/ontologyManageApi.ts` | import 补入 `DeleteOntologySpaceData, DeleteOntologySpaceParams`；新增 `DELETE_ONTOLOGY_SPACE_TIMEOUT = 10000`；新增 `deleteOntologySpaceInterface` — DELETE `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space/" + params.spaceId`，timeout 10s |
| 修改 | `src/apis/index.ts` | 按字典序新增 `deleteOntologySpaceInterface` 导入与导出（位于 `createOntologySpaceInterface` 与 `getExampleInterface`/`getOntologyCategoryTreeInterface` 之间） |
| 新增 | `src/mocks/deleteOntologySpaceMock/deleteOntologySpaceMock.ts` | 静态成功响应 `code: 200, message: "SUCCESS", success: true, data: {}` |
| 修改 | `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts` | import 补入 `deleteOntologySpaceInterface`；`confirmDeleteOntologySpace` 改为 `async`，用 `deleteOntologySpaceInterface({ spaceId: Number(activeSpace.value.id) })` 替换 `options.removeOntologySpace(...)`；code 200 → 关弹窗 + `ElMessage.success("删除成功")` + `await options.loadOntologySpaces()`；失败 → 展示 `response.message`；catch → 展示异常信息 |
| 修改 | `src/views/OntologySpaceManagement/components/SpaceCommandDialogs.vue` | 删除弹窗文案改为 `确认删除「{{ space?.displayName }}」本体空间数据？`，移除「本次演示中的更改将在刷新后重置」本地演示说明 |
| 新增 | `tests/delete-ontology-space-api.test.mjs` | 4 个契约测试：types 字段/类型、API DELETE 方法和路径参数 URL、barrel 导出字典序、mock 响应样例 |
| 修改 | `tests/create-ontology-space-api.test.mjs` | barrel 断言补入 `deleteOntologySpaceInterface` |
| 修改 | `tests/update-ontology-space-api.test.mjs` | 同上 |
| 修改 | `tests/ontology-space-list-api.test.mjs` | 同上 |
| 修改 | `tests/ontology-category-tree-api.test.mjs` | 同上 |

## 3. 关键技术决策

### 3.1 类型命名与契约

- doc 示例使用小驼峰类型名（`deleteOntologySpaceParams`），违反 `src/types/readme.md` PascalCase 硬规则。采用 PascalCase：`DeleteOntologySpaceParams`、`DeleteOntologySpaceData`。
- doc types 示例多出 `icon: string` 字段，但正文输入参数仅列 `spaceId`（number，必填，路径参数）。`icon` 不在正文契约中，不纳入类型。
- 响应 `data: object`（空对象），采用 `Record<string, unknown>`，与 update 接口一致。

### 3.2 路径参数

- URI 为 `/ontology/space/{spaceId}`，spaceId 为**路径参数**（非 query/body）。
- URL 构造：`DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space/" + params.spaceId`。
- doc apis 示例 `url: "/ontology/space/`${params}`"` 有误，正文为准。
- DELETE 无 `data`/`params` 字段（apis readme：GET 用 params，POST/PUT 用 data；路径参数直接拼入 URL）。

### 3.3 `confirmDeleteOntologySpace` 改造

- 当前为同步函数，调用本地 `options.removeOntologySpace(activeSpace.value.id)`。
- 改为 `async`，镜像 `submitOntologySpaceForm` 的成功/失败处理模式：
  - `response.code === 200` → `deleteVisible.value = false` + `ElMessage.success("删除成功")` + `await options.loadOntologySpaces()`
  - 非 200 → `actionStatus = "error"` + `actionError = response.message`（弹窗保留，展示错误）
  - catch → `actionError = cause.message || "删除失败，请重试。"`

### 3.4 保留 `removeOntologySpace` / `removeSpace`

- `ontology-space-management.test.mjs` 将 `removeSpace` 作为测试数据工厂使用（与编辑任务的 `saveSpace` 情况一致）。
- `removeOntologySpace` 保留在 `SpaceManagementActionOptions` 接口与 `useSpaceManagement` 返回中，不再被 `confirmDeleteOntologySpace` 调用。

### 3.5 弹窗文案

- 当前：`确定删除「{{ space?.displayName }}」？本次演示中的更改将在刷新后重置。`
- 改为：`确认删除「{{ space?.displayName }}」本体空间数据？`
- 移除本地演示说明，因为删除现在走真实接口。

## 4. 验证

```bash
npm run type-check
npm run check:types-conventions
npx prettier --check <changed files>
node --test --experimental-strip-types tests/delete-ontology-space-api.test.mjs tests/create-ontology-space-api.test.mjs tests/update-ontology-space-api.test.mjs tests/ontology-space-list-api.test.mjs tests/ontology-category-tree-api.test.mjs tests/ontology-space-management.test.mjs
npm run build:verify
```

预期全部通过。测试套件中 6 个预存失败（FullTextSearch/authToken/request/layout）与本次无关。
