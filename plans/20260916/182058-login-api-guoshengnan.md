# 登录接口对接实施 Plan

## 需求理解
按 docs/20260916/loginAPI-guoshengnan.md 对接登录页登录按钮：输入用户名、密码调用登录接口，成功后进入本体空间管理页，失败展示后端返回的具体错误信息。

## 契约映射（文档正文 -> 实现）
- domain：`DOMAIN_CONFIG.LOGIN_URL` -> `src/apis/loginApi.ts` 中 `url: DOMAIN_CONFIG.LOGIN_URL + "/ontology/user/login"`（与 exampleApi 拼接 domain 的现有惯例一致；request 实例无全局 baseURL）。
- uri / 方法：`/ontology/user/login`，POST。
- 入参：JSON body `{ username: string; password: string }`，POST 按 apis 规范使用 `data`（文档示例写作 `params`，与正文 JSON body 及 apis readme“POST 使用 data”冲突，已确认按规范）。
- 出参：`ApiResponse<LoginData>`，`code`/`message`/`success`/`data`；成功 `code === 200`、message“登录成功”。
- 跳转：文档 `layout/ontology-space-management` -> 路由 name `OntologySpaceManagement`（path `/workspace/ontology-space-management`，挂在 layout/Workspace 下）。
- 失败：透传后端 `message`；网络层错误透传 RequestError 中文消息；导航失败提示“进入系统失败，请稍后重试。”。

## 文档示例与目录规范冲突（已与用户确认：按 readme 规范）
- 函数名：示例 `loginInterface` -> 规范 `postLoginInterface`。
- 承载：示例 `params` -> 规范 POST 用 `data`。
- LoginData：示例 `{ data: object }` 与正文样例 `data: {}` 经 ApiResponse 包裹后矛盾 -> 保留 `[key: string]: unknown`。
- 类型路径：示例 `./apis/login` -> 规范 `./apis/loginType`。

## 文件
- 新增 src/apis/loginApi.ts（既有未跟踪文件，本轮补 domain 拼接与 JSDoc）
- 新增 src/types/apis/loginType.ts（既有）
- 新增 src/mocks/loginMock/loginMock.ts（既有，code 200 / success true / message“登录成功” / data {}）
- 修改 src/apis/index.ts（统一出口）
- 修改 src/types/index.ts（统一出口，含恢复被截断的其他导出具名）
- 修改 src/types/global/runtimeConfigType.ts（DomainConfig 增加 `readonly LOGIN_URL: string`）
- 修改 src/views/LoginPage/index.vue（onSubmit：code 200 判定、错误透传、跳转 OntologySpaceManagement）
- 修改 tests/login-navigation.test.mjs（按新契约重写 5 个 vm 用例）
- 新增 tests/login-api.test.mjs（domain/uri/method/data/出口/页面调用静态契约 5 用例）
- 不修改 public/configs/domainConfig.js（public 受保护，LOGIN_URL 已由开发人员配置）

## 依赖
不新增依赖。

## 验证
- 登录测试 10/10 通过；全量 70 中 67 通过，余 3 个失败为任务前既有且与登录无关
  （全文检索 placeholder 标点、verify-build 临时目录断言、废弃 src/layout/index.vue 路径断言）。
- 覆盖率 all files：line 91.81% / branch 85.62% / funcs 87.27%，均超 80% 门槛。
- check:project-conventions、check:types-conventions、type-check、build:verify 全部通过。

## 备注
- LOGIN_URL 当前为内网地址 http://172.16.18.58:37002，浏览器直连需后端允许 CORS（vite 未配代理）。
