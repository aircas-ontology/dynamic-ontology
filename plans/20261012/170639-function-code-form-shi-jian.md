# Plan: 脚本函数通用配置表单

## 需求理解

选择「脚本函数」时展示截图红框内容：基于已有函数（源函数/源版本）、通用配置（函数名称、API名称、版本号、调用协议、函数说明），页脚为「取消 / 下一步」。结构与现有函数编排表单一致。

默认约定（与编排表单对齐）：

- 源函数 / 源版本列表暂时留空
- 调用协议仅 `HTTP`
- 「下一步」校验通过后提示后续步骤暂未开放，不真正提交创建

## 修改范围

- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `src/types/pages/ontologyFunctionOperatorType.ts`（脚本函数类型描述）
- `tests/function-operator-workspace.test.mjs`

## 新增、修改和删除文件

- 修改：上述三个文件
- 新增 / 删除：无

## 核心实现方式

1. 复用编排表单区块：将 `v-else-if="form.type === 'composite'"` 扩展为 `form.type === 'composite' || form.type === 'code'`，避免复制粘贴同一套字段。
2. 源函数选项：新增空的 `codeSourceOptions`；按当前类型绑定对应空 options。
3. `changeType('code')`：设置 `protocol = "HTTP"`，`definition = { kind: "code" }`。
4. 校验：`code` 与 `composite` 共用同一套规则（名称、API名称、版本号、协议、函数说明必填）。
5. 页脚：`code` / `composite` 均显示「下一步」；扩展下一步处理按类型提示。
6. 空状态文案改为提示选择基础函数 / 脚本函数 / 函数编排。
7. 类型选项中 `code` 描述改为「通过脚本编写自定义函数逻辑」。

## 新增依赖及必要性

无。

## 验证方式

- 先更新测试断言（TDD），确认因未实现而失败，再实现并通过
- `node --test tests/function-operator-workspace.test.mjs`
- `npm run format -- <任务文件>` + `format:check`
