# 脚本 IDE 切换语言始终同步默认模板

## 需求理解

返回上一步再进入编辑器后切换语言，代码仍不随语言变化。需改为：切换语言时始终写入新语言默认 starter。

## 修改范围

- `src/views/FunctionOperatorPanel/utils/scriptFunctionStarters.ts`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue`
- `tests/script-function-starters.test.mjs`

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan
- 无新增依赖

## 核心实现方式

`onScriptLanguageChange` 切换语言时无条件写入 `SCRIPT_FUNCTION_STARTERS[language]`；`shouldReplaceScriptStarterOnLanguageChange` 固定返回 true 以表达产品策略（编辑态语言下拉仍由 `languageLocked` 禁用）。

## 新增依赖及必要性

无。

## 验证方式

- `tests/script-function-starters.test.mjs`
- `npm run format:check -- <任务文件>`
