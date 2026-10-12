# Plan: 列表状态筛选仅草稿/已发布

## 需求理解

按文档 `publishStatus`：0 草稿、1 已发布。函数列表页状态下拉只保留这两种选项。

## 修改范围

- `src/types/pages/ontologyFunctionOperatorType.ts`
- `src/types/index.ts`
- `src/views/FunctionOperatorPanel/index.vue`
- `tests/function-operator-workspace.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增 / 删除：无

## 核心实现方式

1. 新增 `FUNCTION_OPERATOR_PUBLISH_STATUS_OPTIONS`，仅含 `draft` / `published`。
2. 列表筛选用该常量；保留原完整 `FUNCTION_OPERATOR_STATUS_OPTIONS` 与 labels。
3. 测试断言筛选使用 publish 专用 options。

## 新增依赖及必要性

无。

## 验证方式

- 定向测试 + format:check
