# 接口错误信息展示

## 需求理解

接口以 HTTP 错误返回时，公共请求层当前会丢弃响应体中的 `message`，页面只能收到“内部服务器错误”等统一文案。需要优先将后端返回的错误信息传递到页面，并在对象工作区加载失败时直接展示该信息。

## 修改范围

- 调整公共请求错误归一化，安全读取响应体中的字符串 `message`。
- 对象工作区加载失败时保留异常消息。
- 更新请求工具和对象工作区相关测试。

## 文件变更

- 修改 `src/utils/request.ts`。
- 修改 `src/views/OntologySpaceManagementDetail/composables/useOntologyObjectWorkspace.ts`。
- 修改 `tests/request.test.mjs` 和 `tests/ontology-object-workspace.test.mjs`。
- 不修改接口定义、依赖、`public/` 或 `html/`。

## 核心实现方式

公共请求层只读取响应数据对象中非空的 `message` 字符串，将其作为 `RequestError.message`。没有有效后端消息时继续使用状态码、超时和网络错误兜底文案。对象工作区查询捕获异常后，将 `Error.message` 写入页面错误状态。

## 依赖

不新增依赖。

## 验证方式

- 先更新错误信息测试并确认旧实现失败，再完成实现使其通过。
- 执行请求工具和对象工作区定向测试。
- 执行格式检查、类型检查、验证构建、全量测试、覆盖率测试和 `git diff --check`。
