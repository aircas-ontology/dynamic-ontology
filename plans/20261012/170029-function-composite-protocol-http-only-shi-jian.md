# Plan: 函数编排调用协议仅 HTTP

## 需求理解

在已确认的函数编排表单方案上，调用协议选项由 `HTTP` / `gRPC` / `MQ` 调整为仅 `HTTP`，与 Plan `165100` 第 3 条保持一致。

## 修改范围

- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `tests/function-operator-workspace.test.mjs`

## 新增、修改和删除文件

- 修改：上述两个文件
- 新增 / 删除：无

## 核心实现方式

1. `PROTOCOL_OPTIONS` 仅包含 `"HTTP"`。
2. 切换到 `composite` 时强制 `form.protocol = "HTTP"`。
3. 测试断言协议选项仅为 HTTP，不含 gRPC / MQ。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/function-operator-workspace.test.mjs`
- `npm run format -- <任务文件>` + `format:check`
