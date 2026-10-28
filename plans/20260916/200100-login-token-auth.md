# 登录 Token 鉴权实施 Plan

## 需求
登录接口在**响应头**下发 token；登录成功后保存 token，后续所有业务请求在**请求头**携带 token；未登录/401 回到登录页。

## 已确认契约（用户确认）
- 头字段：`Authorization`，值格式 `Bearer <token>`（登录响应头同字段，值可能已含/不含 Bearer 前缀，前端归一化）。
- 存储：sessionStorage，会话级（关闭标签页失效）。

## 设计（分层，单一 HTTP 出口）
1. 新增 `src/utils/authToken.ts`：基于现有 storage 适配器（注入 window.sessionStorage）封装
   saveLoginToken / getLoginToken / getAuthorizationHeader / hasLoginToken / clearLoginToken；
   Bearer 前缀归一化；空白 token 快速失败；脏数据清理降级。
2. `src/utils/request.ts`：
   - 新增请求拦截器，统一注入 `Authorization: Bearer <token>`（仅经 authToken 模块，不直接碰 storage）；
   - 新增 `requestFull<T>()` + axios 配置扩展 `resolveFullResponse`，登录接口可读取响应头，默认接口契约不变（仍返回 ApiResponse）；
   - 401 时 clearLoginToken（不主动硬跳转，避免与 router 循环依赖；导航由路由守卫兜底）。
3. `src/apis/loginApi.ts`：改用 requestFull，从响应头 authorization 提取并保存 token；
   code 200 但响应头缺 token 时抛明确错误（提示后端 Expose-Headers/契约问题）；页面调用签名不变。
4. 新增 `src/router/authGuard.ts`：纯函数 resolveAuthRedirect（未登录访问业务页→Login；已登录访问 Login→OntologySpaceManagement；其余放行）+ registerAuthGuard；在 router/index.ts 注册。
5. main.ts 无需改动。

## 测试（TDD）
- 新增 tests/auth-token.test.mjs（存取、Bearer 归一化、空白拒绝、清理、脏数据降级，注入内存 storage）
- 新增 tests/auth-guard.test.mjs（三分支重定向、守卫注册/注销）
- 更新 tests/request.test.mjs（演进旧约束：经 authToken 注入而非直接 storage；拦截器注入头、401 清 token、完整响应开关）
- 更新 tests/login-api.test.mjs（requestFull、响应头提取、saveLoginToken 静态契约）

## 后端硬前置（跨域）
- 响应头需 `Access-Control-Expose-Headers: Authorization`，否则浏览器读不到 token；
- 预检 OPTIONS 需放行 `Authorization` 请求头。

## 验证
npm test / test:coverage(80%) / check:project-conventions / check:types-conventions（无 types 目录结构变更可免）/
type-check / build:verify / format:check 任务文件 / git diff --check。
