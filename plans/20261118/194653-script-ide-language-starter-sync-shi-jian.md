# 脚本 IDE 切换语言同步默认模板

## 需求理解

刚进入脚本函数 Web-IDE 切换语言时，代码模板需同步切换为对应语言默认 starter；用户已改代码时不覆盖。

## 修改范围

- `src/views/FunctionOperatorPanel/utils/scriptFunctionStarters.ts`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue`
- `tests/script-function-starters.test.mjs`（新增）
- `tests/function-operator-workspace.test.mjs`（补充源码断言）

## 新增、修改和删除文件

- 修改上述文件；新增测试与本 Plan
- 无新增依赖

## 核心实现方式

规范化换行后再判断当前代码是否仍为默认 starter（含 CRLF）；匹配上一语言或任一语言 starter，或代码为空时，切换语言同步写入新 starter；打开 IDE 时同步 `lastStarterLanguage`。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/script-function-starters.test.mjs`
- 相关 workspace 源码断言
- `npm run format:check -- <任务文件>`
