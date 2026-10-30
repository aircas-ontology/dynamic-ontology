# 外部 API 函数输入输出参数表单

## 需求理解

在新建外部 API 函数的认证 Header 下方增加输入参数和输出参数。两组都可以添加和删除。数据只留在表单本地状态，不提交创建接口。

## 修改范围

`FunctionOperatorFormDialog.vue` 中外部 API 表单区块。

## 新增、修改和删除文件

- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改 `tests/function-operator-workspace.test.mjs`

## 核心实现方式

- 输入参数字段：name、type（string/number/boolean/array/object，默认 string）、description、location（Body/Path/Query/Header，默认 Body）、required（是/否，默认否）。
- 输出参数字段：name、type、description，type 选项与默认值与输入参数相同。
- 初始为空列表。添加生成一行，删除按行移除。
- 切换函数类型或关闭弹框时与其他外部 API 字段一起清空。

## 新增依赖及必要性

无。

## 验证方式

- 先更新断言并确认失败，再实现后运行 `node --test --experimental-strip-types --test-name-pattern "external api function create form" tests/function-operator-workspace.test.mjs`。
- 对本次文件执行 `format` 与 `format:check`。
- `npm run build:verify`。
