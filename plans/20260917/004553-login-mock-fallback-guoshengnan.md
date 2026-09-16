# 登录服务不可达时 Mock 登录兜底

- 日期：2026-09-17
- 执行人：guoshengnan

## 1. 需求理解

登录接口服务断掉时，用 mock 数据模拟登录：提交登录后优先请求真实登录接口，传输层失败（网络不可达、超时、HTTP 错误）时回退到本地 mock 成功响应并写入模拟令牌，使用户可进入系统继续开发联调。后端恢复后自动走真实登录（含账密校验），无需改代码。

已确认决策：mock 兜底**不校验账号密码**，任意非空用户名/密码均模拟成功（页面已有提交中状态，无必填校验不在本次范围）。业务拒绝（HTTP 正常但 `code !== 200`）**不回退**，仍显示后端错误消息。

## 2. 修改范围

### 新增（2 个）

1. `src/views/LoginPage/composables/useLoginCommand.ts`
   - 页面私有 composable，导出 `useLoginCommand()`，返回 `submitLogin(params)`。
   - `try { return await postLoginInterface(params) } catch { saveLoginToken(LOGIN_MOCK_TOKEN); return structuredClone(loginMock) }`。
   - 仅捕获传输失败；`code !== 200` 的判断保留在页面，不走回退。
   - 完整 JSDoc，注明临时回退、后端恢复后可删除。

2. `tests/login-mock-fallback.test.mjs`（TDD，静态契约断言，沿用仓库 readFileSync 惯例）
   - mock 导出 `LOGIN_MOCK_TOKEN`（`Bearer ` 前缀）；
   - composable 经 `@/apis` 调 `postLoginInterface`、经 `@/utils/authToken` 调 `saveLoginToken`、catch 中返回 `structuredClone(loginMock)`；
   - 页面经 `useLoginCommand` 的 `submitLogin` 提交，不再直接调 `postLoginInterface`；
   - loginApi 设置 10 秒登录超时常量。

### 修改（3 个）

3. `src/mocks/loginMock/loginMock.ts`
   - 增加 `export const LOGIN_MOCK_TOKEN = "Bearer mock-login-token";`（离线模拟令牌，带 Bearer 前缀）。
   - 现有 `loginMock` 成功响应体不变。

4. `src/apis/loginApi.ts`
   - 增加 `const LOGIN_REQUEST_TIMEOUT = 10000;` 并在请求配置加 `timeout`，避免半开连接等待全局 10 分钟超时才回退（与本体空间列表接口处理一致）。
   - 补 JSDoc 说明；`postLoginInterface` 其余逻辑（requestFull + persistLoginToken）不变，apis 层不吞异常。

5. `src/views/LoginPage/index.vue`
   - 导入由 `postLoginInterface` 改为 `useLoginCommand`，`onSubmit` 中改调 `submitLogin(formData.value)`；`code !== 200` 处理、错误提示、跳转逻辑不变。
   - 同步更新 `tests/login-api.test.mjs` 中对页面调用的断言。

### 不改动

- `postLoginInterface` 的请求/取头/持久化逻辑、authToken、request 层与路由守卫。
- 页面样式与其余交互。
- 3 个任务前既有无关失败测试。

## 3. 核心流程

`页面提交 -> submitLogin -> 真实 POST /ontology/user/login（10s 超时）-> 成功：响应头真实令牌持久化；传输失败：写入 mock 令牌 + 返回 loginMock（code 200）-> 页面 code 校验通过 -> 路由跳转 -> 守卫凭 sessionStorage 令牌放行 -> 业务请求携带 mock 令牌（失败的业务接口沿用各自 mock 回退）`。

## 4. 依赖

无新增依赖、无配置/锁文件变更。

## 5. 验证

1. 新增契约测试先红后绿；更新后的 login-api 测试通过。
2. `npm test`（3 个既有失败不变）、`npm run test:coverage`（≥80%）。
3. `npm run check:project-conventions`、`npm run check:types-conventions`、`npm run type-check`、`npm run build:verify`。
4. 任务文件 format:check / format、`git diff --check`。
5. 浏览器实测：登录页输入任意账密 -> 真实请求失败后自动 mock 登录 -> sessionStorage 存在令牌 -> 进入本体空间管理页。
