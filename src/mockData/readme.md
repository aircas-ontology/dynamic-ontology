# mockData 目录规范

## 1. 目录职责与边界

`src/mockData` 存放本地 HTTP Mock 服务使用的路由表和接口响应 fixture，由 `scripts/mock-server.mjs` 读取。

- 【必须】fixture 对齐正式接口契约，优先来自真实接口响应或现有 `*ApiMock` 信封。
- 【必须】与 `src/mocks` 分开维护：`src/mocks` 供页面内样例数据直接 import；本目录只服务 HTTP Mock。
- 【禁止】正式业务代码 import 本目录文件。
- 【禁止】写入真实账号、密码、生产令牌或个人数据。

## 2. 结构与命名

```text
src/mockData/
├─ readme.md
├─ routes.json
└─ fixtures/
   ├─ common/
   └─ ontology/
```

- 【必须】`routes.json` 声明 `method`、`path`、`file`；登录路由可附带 `headers`。
- 【必须】fixture 文件使用 kebab-case 或接口语义文件名，并以 `.json` 结尾。
- 【优先】写接口首批复用 `fixtures/common/success.json`，不在 Mock 服务内落盘修改数据。

## 3. 路由匹配

- 【必须】精确 `method + path` 优先于 `:param` 模式，避免 `/ontology/space/statistic` 被 `/ontology/space/:spaceId` 吞掉。
- 【必须】未匹配路由返回 `{ code: 404, success: false }` 信封。
- 【必须】登录成功响应暴露 `access-token`，供前端 `persistLoginToken` 使用。

## 4. 录制与开关

- 【优先】使用 `npm run mock:record` 从真实环境覆盖 GET fixture。
- 【必须】请求改写开关放在 `public/configs/domainConfig.js` 的 `USE_MOCK` 与 `MOCK_SERVER_URL`；大模型不得修改 `public/`。

## 5. 变更检查清单

1. 新增接口是否同步 `routes.json` 与 fixture。
2. 路径参数是否使用 `:name`，且精确路径排在参数路径之前。
3. 是否避免把页面内 `src/mocks` 误迁到本目录。
4. 本地验证是否覆盖登录、空间列表和至少一条写接口。
