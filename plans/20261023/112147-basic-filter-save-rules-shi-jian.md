# 基础函数过滤条件保存校验与可删空

## 需求理解

创建/修改基础函数时：若仍存在过滤条件，则每条 FILTER 的 propertyApiName 必填；需要取值的运算符还必须填 value/values；IS_NULL/IS_NOT_NULL 只需变量名。允许删除全部条件后保存。

## 修改范围

- BasicFilterGroupEditor：放开至少一条删除限制
- functionOperatorBasicFilter：normalizeGroup 允许空 children；新增 validateBasicFilterDocument
- FunctionOperatorFormDialog.submitDraft：保存前校验

## 新增、修改和删除文件

- 修改 `src/views/FunctionOperatorPanel/components/BasicFilterGroupEditor.vue`
- 修改 `src/utils/functionOperatorBasicFilter.ts`
- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改 `tests/function-operator-workspace.test.mjs`

不新增、不删除业务源码文件。

## 核心实现方式

删除按钮与 `removeChild` 允许空数组；校验递归遍历 FILTER/GROUP，失败返回中文提示；`submitDraft` 在 emit 前阻断。

## 新增依赖及必要性

无。

## 验证方式

先更新断言并确认失败，再实现。执行相关测试、`npm run format:check`、`npm run type-check`、`npm run build:verify`。
