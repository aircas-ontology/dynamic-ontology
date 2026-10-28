# Plan: 编辑态锁定函数名称与版本

## 需求理解

编辑弹窗中「函数名称」「函数版本」不可修改；与现有「函数 api 名称」编辑禁用一致。新建仍可编辑。

## 修改范围

- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `tests/function-operator-workspace.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增 / 删除：无

## 核心实现方式

1. 基础函数与编排/脚本表单的 `name`、`version` 增加 `:disabled="Boolean(operator)"`。
2. 测试断言编辑态禁用。

## 新增依赖及必要性

无。

## 验证方式

- 定向测试 + format:check
