# Plan：取消接口失败回退 Mock

## 需求理解

取消「接口失败后静默使用 Mock」行为；失败时直接向用户提示错误。本期不引入统一 Mock 开关。

## 修改范围

运行时失败回退四处：

1. `useLoginCommand.ts`
2. `useSpaceManagement.ts`（空间列表 `fetchOntologySpaces`）
3. `useSpaceOverview.ts`
4. `useApplicationApiDocs.ts`

同步更新断言失败回退的测试；更新 `loginApi.ts` JSDoc 中关于回退的说明。

不改：`setFunctionOperatorStatusMock`、关系 Mock 工具、`public/`、统一 Mock 配置。

## 文件

- 修改：上述 4 个 composable + `loginApi.ts` JSDoc
- 修改：`tests/login-mock-fallback.test.mjs`、`tests/login-navigation.test.mjs`、`tests/ontology-space-list-api.test.mjs`、`tests/application-management-page.test.mjs`
- 新增依赖：无

## 核心实现

- 登录：直接 `return postLoginInterface(params)`，异常由登录页 catch 提示
- 空间列表：成功映射返回；失败抛错，由 `loadOntologySpaces` 置 `error`
- 空间概览：成功映射返回；失败抛错，由 `useSpaceOverview` 置 `error`；非法 id 抛错，不再查 Mock
- OpenAPI：失败清空文档并设置 error，不写入 `apiDocsOntologyMock`

## 验证

- 相关测试从「断言回退」改为「断言不回退 / 失败提示」
- `npm test` 相关文件 + `format:check` 任务文件
