# 外部 API 认证方式增加 API Key

## 需求理解

认证方式增加「API Key」。默认仍是「无认证」，认证 Header 只读。选中「API Key」后 Header 可编辑。切回「无认证」时清空已填内容并恢复只读文案。不提交创建接口。

## 修改范围

新建外部 API 函数表单的认证方式与认证 Header。

## 新增、修改和删除文件

- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改 `tests/function-operator-workspace.test.mjs`

## 核心实现方式

- 认证方式选项为「无认证」和「API Key」。
- 「API Key」时绑定可编辑的 Header；其他情况展示只读文案「仅作原型展示，正式密钥由后端托管」。
- 切换认证方式、切换函数类型或关闭弹框时清空 Header。

## 新增依赖及必要性

无。

## 验证方式

- 先更新断言并确认失败，再实现后运行 `node --test --experimental-strip-types --test-name-pattern "external api function create form" tests/function-operator-workspace.test.mjs`。
- 对本次文件执行 `format` 与 `format:check`。
- `npm run build:verify`。
