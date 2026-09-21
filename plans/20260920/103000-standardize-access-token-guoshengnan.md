# 全项目统一 access-token 认证头

## 需求理解

登录和业务请求的认证头统一使用 `access-token`，消除登录解析、请求注入、工具函数命名和测试中的 `Authorization` 语义不一致。

## 修改范围

- 登录响应只读取 `access-token`，兼容 Axios 归一化键名和服务端大小写形式。
- 将认证工具与登录解析函数命名统一为 `AccessToken` 语义。
- 请求拦截器继续注入 `access-token`，同步注释和测试断言。
- 保留当前 `Bearer <token>` 令牌值归一化行为。

## 文件变更

- 修改 `src/apis/loginApi.ts`
- 修改 `src/utils/authToken.ts`
- 修改 `src/utils/request.ts`
- 修改 `tests/login-api.test.mjs`
- 修改 `tests/request.test.mjs`
- 修改 `tests/auth-token.test.mjs`

## 核心实现方式

将 `extractAuthorizationHeader` 改为 `extractAccessTokenHeader`，将 `getAuthorizationHeader` 改为 `getAccessTokenHeader`，并在所有调用方和测试中同步替换；响应头读取仅保留 `access-token` 与 `Access-Token` 键。

## 新增依赖

无。

## 验证方式

执行认证相关测试、全量测试与覆盖率检查、类型检查、构建验证、当前任务文件格式检查，并检查差异和空白错误。
