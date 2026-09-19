# 本体空间列表接口对接（远程不可达期间 Mock 兜底）

- 日期：2026-09-16
- 契约文档：`docs/20260916/ontologyListApi-guoshengnan.md`
- 执行人：guoshengnan

## 1. 需求理解

1. 对接「查询本体空间列表」接口：进入本体空间管理页（`OntologySpaceManagement`）即发起查询。
2. 契约：GET `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL` + `/ontology/space`，无入参，标准 `ApiResponse<T>` 包裹。
3. 远程服务当前无法保证可用，真实请求失败时暂时以项目已有 Mock 数据兜底渲染；后端恢复后无需改代码即自动走真实数据。
4. 并行开发已做部分工作（函数改名、Mock 目录搬迁、页面 `onMounted(load)` 接线、loader 注入式 composable），相同部分沿用，断裂/不符契约部分按文档修正。

### 已确认决策（用户确认）

- **响应 data 结构**：`data` 直接为本体空间数组 `OntologySpaceItem[]`（文档 types 示例 `{ data: object }` 双层结构与 mock 示例 `data: {}` 自相矛盾，且页面渲染需要列表，采用单层数组）。
- **Mock 兜底方式**：页面进入即发真实 GET 请求；网络失败 / HTTP 错误 / `code !== 200` 时在 composable 层回退 Mock；apis 层不吞异常。

### 文档矛盾点的处理（以正文契约为准）

| 文档位置                                                                                       | 矛盾/问题                      | 处理                                                                                                 |
| ---------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 「接口 uri」`/ontology/space` vs「apis 示例」url `"/ontology/user/login"`                      | 示例残留登录路径               | 以正文 URI 为准：`/ontology/space`                                                                   |
| 「编译位置」`src/mocks/ontologyManageMock/` vs「mocks 示例」`src/mocks/ontologySpaceListMock/` | 目录名不一致                   | 沿用并行开发已创建的 `ontologySpaceListMock/`（与 mocks 示例一致）                                   |
| types 示例 `{ data: object }` vs mock 示例 `data: {}`                                          | 双层 vs 空对象，均无法表达列表 | 用户确认：`OntologySpaceListData = OntologySpaceItem[]`                                              |
| mock 场景                                                                                      | 文档仅提供 1 个成功样例        | 只生成成功样例，不补造空/失败场景（仓库目录规范要求的异常场景由 composable 状态机承载，Mock 不臆造） |

## 2. 修改范围

### 修改文件（8 个）

1. **`src/types/apis/ontologyManageType.ts`**
   - `OntologySpaceListData` 定义为 `import type { OntologySpaceItem } from "../pages/ontologySpaceManagementType"` 后的类型别名：`export type OntologySpaceListData = OntologySpaceItem[];`（types 目录内部使用相对路径）。

2. **`src/types/index.ts`**
   - 第 4 行旧导出 `OntologyListData` 改为 `OntologySpaceListData`（来源文件不变，保持路径字典序）。

3. **`src/apis/ontologyManageApi.ts`**
   - URL 改为 `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space"`，方法保持 `get`，无参数。
   - 补齐符合 apis readme 的 JSDoc（用途、GET `/ontology/space`、无参、`@returns` 说明 data 为本体空间数组）。
   - 函数签名保持 `getOntologySpaceListInterface(): Promise<ApiResponse<OntologySpaceListData>>`。
   - **实施增补（浏览器实测发现）**：请求层全局超时为 10 分钟，远程 TCP 半开/HTTP 挂起时 mock 回退要 10 分钟才生效。为列表接口单独设置 `timeout: 10000`（常量 `ONTOLOGY_SPACE_LIST_TIMEOUT`），保证不可达场景 10 秒内快速失败并回退；已在契约测试中锁定。

4. **`src/apis/index.ts`**
   - 出口由旧名 `getOntologyListInterface` 改为 `getOntologySpaceListInterface`，并按 readme 字典序与「先 import 后 export、空行分隔」格式重写（当前为并行开发半成品，格式亦不合规）。

5. **`src/types/global/runtimeConfigType.ts`**
   - `DomainConfig` 接口补充 `readonly ONTOLOGYMANAGE_URL: string;`（`public/configs/domainConfig.js` 用户已加入运行时值，本文件只读不改）。

6. **`src/mocks/ontologySpaceListMock/ontologySpaceListMock.ts`**
   - 复用现有 6 条空间数据与图片导入，改为文档要求的响应样例形态：
     `export const ontologySpaceListMock: ApiResponse<OntologySpaceListData> = { code: 200, message: "列表查询成功", data: <现有 6 条数组> }`。
   - 旧导出名 `ontologySpaceManagementMock` 移除；仅具名导出 `ontologySpaceListMock`。

7. **`src/views/OntologySpaceManagement/composables/useSpaceManagement.ts`**
   - 默认 loader 由「直接返回 Mock 数组」改为「调 `getOntologySpaceListInterface()`（经 `@/apis` 出口），校验 `code === 200` 后返回 `structuredClone(response.data)`；任何异常回退 `structuredClone(ontologySpaceListMock.data)`」，并加 JSDoc 与「远程恢复后移除回退」注释。
   - composable 现有状态机（loading/success/empty/error、pending 防重、disposed 防过期）与 `onMounted(load)` 入口不变，页面 `index.vue` 不改。

8. **`src/views/OntologySpaceManagementDetail/composables/useSpaceWorkspace.ts`**
   - 同步 Mock 引用改名：`findSpaceById(ontologySpaceListMock.data, spaceId.value)`，其余逻辑不变。

### 新增文件（1 个）

9. **`tests/ontology-space-list-api.test.mjs`**（TDD）
   - 静态契约断言（沿用仓库 readFileSync 测试惯例，规避 Node 对 `@/` 别名与 webp 资源的解析限制）：
     - apis：GET、`ONTOLOGYMANAGE_URL`、`/ontology/space`、函数名、JSDoc；不含 `LOGIN_URL`、`/ontology/user/login`。
     - 出口：`src/apis/index.ts` 导出新名、不含旧名且排序合规。
     - 类型：`ontologyManageType.ts` 为 `OntologySpaceItem[]` 别名；`src/types/index.ts` 导出新名、不含 `OntologyListData`。
     - 运行时配置：`runtimeConfigType.ts` 声明 `ONTOLOGYMANAGE_URL`。
     - Mock：导出 `ontologySpaceListMock`、`ApiResponse<OntologySpaceListData>` 形态、code 200 / message「列表查询成功」/ data 为 6 条 OntologySpaceItem 数组；不含旧导出名。
     - composable：默认 loader 引用 `@/apis` 的 `getOntologySpaceListInterface` 且出现 Mock 回退；详情页 composable 引用新 Mock 名。

### 不改动

- `public/configs/domainConfig.js`（受保护目录，用户已自行加入 `ONTOLOGYMANAGE_URL`）。
- `src/views/OntologySpaceManagement/index.vue`（`onMounted(load)` 已满足进入即查询）。
- 6 条 Mock 数据内容、图片资源、页面其余组件与逻辑。
- 与本任务无关的既有失败测试（3 个）。

## 3. 核心实现方式

- 数据流：`index.vue onMounted(load)` → composable loader → `getOntologySpaceListInterface()`（请求拦截器自动注入 `Authorization: Bearer <token>`）→ `code === 200` 取 `data`；失败回退 Mock → 既有分页/筛选/统计状态机渲染。
- 类型链：`OntologySpaceItem`（页面视图模型，已存在）→ `OntologySpaceListData = OntologySpaceItem[]` → `ApiResponse<OntologySpaceListData>` → `request<OntologySpaceListData>` 的 T 即响应 data 字段。
- 回退仅存在于 composable（业务编排层）；请求层与 apis 层错误处理语义不变。

## 4. 依赖

无新增依赖、无配置文件变更、无锁文件变更。

## 5. 验证方式

1. `node --test --experimental-strip-types tests/ontology-space-list-api.test.mjs`（先红后绿）。
2. `npm test`（新增测试通过；3 个任务前既有失败保持不变，不修复）。
3. `npm run test:coverage`（line/branch/funcs 不低于 80% 门槛）。
4. `npm run check:project-conventions`、`npm run check:types-conventions`。
5. `npm run type-check`、`npm run build:verify`（临时目录，禁止 `npm run build`）。
6. `npm run format:check -- <任务文件>`，不通过则仅对同一文件列表 `npm run format`。
7. `git diff --check` 与任务 diff、`git status --short` 核对。
8. 浏览器实测：登录后进入本体空间管理页，核对 GET `/ontology/space` 请求头携带 `Authorization`；当前远程不可用时页面以 Mock 6 条空间卡片正常渲染。
