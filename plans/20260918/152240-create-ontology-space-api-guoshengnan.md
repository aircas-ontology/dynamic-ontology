# 对接本体空间创建接口 Plan

## 1. 需求理解

- 依据 `docs/20260918/createOntologySpaceApi-guoshengnan.md` 对接本体空间手动创建接口。
- 触发路径：本体空间管理页面 → 「新建本体空间」→ 选「手动创建」→ 填表 → 点「确定」。
- 接口失败：直接提示失败信息，不关闭弹窗。
- 接口成功：关闭弹窗、提示「创建成功」、刷新本体空间列表。
- 编辑路径不在本次范围（doc 仅覆盖创建）。

## 2. 修改范围

| 类别 | 文件 | 变更 |
| --- | --- | --- |
| 新增 | `src/types/apis/createOntologySpaceType.ts` | `CreateOntologySpaceParams`、`CreateOntologySpaceData` |
| 修改 | `src/types/index.ts` | 按字典序转导出两个新类型 |
| 修改 | `src/apis/ontologyManageApi.ts` | 新增 `createOntologySpaceInterface`，复用 10s 超时常量模式 |
| 修改 | `src/apis/index.ts` | 按字典序新增导入与导出 |
| 新增 | `src/mocks/createOntologySpaceMock/createOntologySpaceMock.ts` | 静态成功响应，含 `success: true` |
| 修改 | `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts` | `submitOntologySpaceForm` 改异步；新建路径走 API；编辑路径保留本地 `saveOntologySpace`；options 新增 `loadOntologySpaces` 回调 |
| 修改 | `src/views/OntologySpaceManagement/index.vue` | 将 `loadOntologySpaces` 注入 `useSpaceManagementActions` |

## 3. 关键技术决策

### 3.1 类型命名与契约

- doc 示例使用小驼峰类型名（`createOntologySpaceParams`），违反 `src/types/readme.md` 第 45 行「类型名称使用 PascalCase」硬规则。
- 采用 PascalCase：`CreateOntologySpaceParams`、`CreateOntologySpaceData`。
- 字段与 doc 一致：`displayName`、`apiName`、`icon`、`description` 均为 `string`；响应 `data: number`。

### 3.2 API 函数定义

- 函数名：`createOntologySpaceInterface`（post 前缀 + 业务名 + Interface，符合 `src/apis/readme.md` 第 4 节）。
- URL：`DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space"`（与同文件 `getOntologySpaceListInterface` 一致；doc 示例裸 `/ontology/space` 缺少域名拼接，按项目既有模式修正）。
- method：`"post"`。
- 提交字段：`data: params`（`src/apis/readme.md` 第 57 行明确 POST/PUT 用 `data`；doc 示例 `params` 与项目规范冲突，按规范修正）。
- 超时：复用 `ONTOLOGY_SPACE_LIST_TIMEOUT = 10000` 模式，新增 `CREATE_ONTOLOGY_SPACE_TIMEOUT` 常量，避免依赖全局 10 分钟超时。
- 异常处理：API 层不静默吞异常（`src/apis/readme.md` 第 71 行）；失败由调用方处理。

### 3.3 Mock 路径与字段

- 路径：`src/mocks/createOntologySpaceMock/createOntologySpaceMock.ts`。
  - doc 顶部编译位置说明为 `src/mocks/createOntologySpaceMock/`，第 130 行示例注释为 `src/mocks/ontologyManageMock/...`，二者冲突。
  - 既有 mocks 模式按业务功能拆分目录（`ontologySpaceListMock/`、`ontologyCategoryTreeMock/`），与 doc 顶部一致，按此处理。
- 字段：`code: 200`、`message: "SUCCESS"`、`success: true`、`data: 8`（与既有 mock 一致补 `success`）。

### 3.4 Composable 行为分支

- `submitOntologySpaceForm` 改为 `async`。
- 当 `activeSpace.value == null`（新建）：构造 `CreateOntologySpaceParams`（`icon` 取 `draft.iconUrl`，可能为 base64 data URL 或空字符串，由后端处理），调用 `createOntologySpaceInterface`。
  - `response.code === 200`：关闭 `formVisible`、清空 `actionError`、`actionStatus` 设 `success`、`ElMessage.success("创建成功")`、调用 `options.loadOntologySpaces()` 刷新列表、清空 `options.keyword.value`。
  - `response.code !== 200`：`actionStatus` 设 `error`、`actionError` 设 `response.message`，弹窗保留。
  - 网络异常（catch）：`actionStatus` 设 `error`、`actionError` 设「创建失败，请重试。」，弹窗保留。
- 当 `activeSpace.value != null`（编辑）：保留原 `options.saveOntologySpace(draft, id)` 本地行为，避免破坏既有编辑功能。
- 重复提交控制：保留 `actionBusy.value` 守卫。
- 表单 busy 状态由 `actionBusy` 计算属性驱动，`SpaceFormDialog` 已通过 `:external-error="actionError"` 显示错误。

### 3.5 loadOntologySpaces 注入

- `SpaceManagementActionOptions` 新增 `loadOntologySpaces: () => Promise<void> | void`。
- `index.vue` 在 `useSpaceManagement()` 解构 `loadOntologySpaces` 后传入 `useSpaceManagementActions`。

## 4. 新增依赖

无。复用 `@/utils/request`、`@/types`、`element-plus`、`vue` 现有能力。

## 5. 受保护目录

- 不修改 `public/`、`html/`、`public/configs/domainConfig.js`。
- 仅编辑本任务明确涉及的文件，不顺带格式化或重构无关内容。

## 6. 验证方式

```bash
npm run check:types-conventions   # types 目录变更
npm run type-check
npm run build:verify
npm run format -- src/types/apis/createOntologySpaceType.ts src/types/index.ts src/apis/ontologyManageApi.ts src/apis/index.ts src/mocks/createOntologySpaceMock/createOntologySpaceMock.ts "src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts" src/views/OntologySpaceManagement/index.vue
```

浏览器手测（`http://localhost:5173`）：

1. 进入本体空间管理页。
2. 点「新建本体空间」→ 选「手动创建」→ 填 apiName、displayName、description、icon → 点「确定」。
3. 成功路径：弹窗关闭、`ElMessage` 提示「创建成功」、列表自动刷新。
4. 失败路径：构造后端返回非 200 或关闭后端服务，弹窗保留并展示失败信息。

## 7. 测试策略

- types/apis/mocks 为静态声明与薄包装，无需单元测试。
- composable 改造涉及真实网络请求与 Element Plus 弹窗状态，无法合理自动化测试，按 `AGENTS.md` 第 7 节请求免除单元测试和覆盖率，通过类型检查、build:verify 与浏览器手测验证。

## 8. 风险与影响

- 表单 `draft.iconUrl` 是 base64 data URL；后端若只接受 URL，icon 字段会失败。doc 未规定，先按原样传递，由后端决定是否支持 base64。
- 编辑路径未对接 API，保留本地行为；如后续需要编辑接口，需另立 Plan。
- API 函数 `url` 与 `data` 字段与 doc 示例不同（按项目规范修正），如与后端实际契约冲突需重新确认。
