# HTTP Mock 服务与 mockData 目录

## 需求理解

在 `src/mockData` 存放由接口响应生成的 HTTP Mock 文件，保留现有 `src/mocks`。本地 `npm run dev` 自动拉起 Mock 服务。`public/configs/domainConfig.js` 由开发人员手改 `USE_MOCK` 与 `MOCK_SERVER_URL`，本轮不修改 `public/`。`request` 按开关把登录与本体管理请求改写到 Mock 主机。写接口首批返回固定成功信封、不落盘。

## 修改范围

新增 `src/mockData`、`scripts/mock-server.mjs`、`scripts/dev.mjs`、`scripts/record-mock-from-api.mjs`、相关测试。修改 `package.json` scripts、`request`、运行时类型、`AGENTS.md`、`README.md`、`src/mocks/readme.md`。不改 `public/`、`html/`、现有 `src/mocks` 引用方。

## 新增、修改和删除文件

- 新增 `src/mockData/readme.md`、`src/mockData/routes.json`、`src/mockData/fixtures/**/*.json`
- 新增 `scripts/mock-server.mjs`、`scripts/dev.mjs`、`scripts/record-mock-from-api.mjs`
- 新增 `src/utils/resolveServiceRequestUrl.ts`
- 新增 `tests/mock-http-server.test.mjs`、`tests/request-mock-switch.test.mjs`
- 改 `package.json`、`src/utils/request.ts`、`src/types/global/runtimeConfigType.ts`
- 改 `AGENTS.md`、`README.md`、`src/mocks/readme.md`

## 核心实现方式

Node `http` 监听 `127.0.0.1:37003`，按 `routes.json` 匹配 method 与 path（含 `:param`）。登录补 `access-token`。`resolveServiceRequestUrl` 在 `USE_MOCK` 为 true 时改写 `LOGIN_URL` / `ONTOLOGYMANAGE_URL` 的 origin。`dev.mjs` 并行启动 Mock 与 Vite。fixture 首批来自现有 `*ApiMock` 信封，可用 `mock:record` 从真实环境覆盖。

## 新增依赖及必要性

无。

## 验证方式

先补失败测试再实现。跑相关测试、`npm test`、`npm run test:coverage`、`format:check`、`check:project-conventions`、`check:types-conventions`、`type-check`、`build:verify`。
