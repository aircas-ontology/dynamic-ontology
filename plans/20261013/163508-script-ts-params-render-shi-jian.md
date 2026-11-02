# 脚本函数入参出参实时渲染（仅 TypeScript）

## 需求理解

TypeScript 脚本从第一个 export 方法实时解析输入输出参数；其它语言不解析。

## 修改范围

parseTypescriptScriptExportParams、ScriptIdeDialog、相关测试。

## 新增、修改和删除文件

- 新增：utils/parseTypescriptScriptExportParams.ts、tests/parse-typescript-script-export-params.test.mjs
- 修改：FunctionOperatorScriptIdeDialog.vue、function-operator-workspace.test.mjs

## 核心实现方式

轻量解析 export function 签名与 interface/type；出参 any 时从 return {} 推断。

## 新增依赖及必要性

无。

## 验证方式

单元测试 + format:check。
