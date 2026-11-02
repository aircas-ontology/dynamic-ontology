# 创建脚本函数（IDE 保存）

## 需求理解

脚本函数 IDE 保存调用 createFun CUSTOMIZE，携带 code 与 parameters。

## 修改范围

创建类型、组装工具、ScriptIdeDialog、FormDialog、workspace、测试。

## 新增、修改和删除文件

- 新增：buildCreateOntologyScriptFunctionParams.ts、单测
- 修改：createOntologyFunctionType、types/index、ScriptIdeDialog、FormDialog、workspace、index、契约测试

## 核心实现方式

组装 CUSTOMIZE payload；IDE emit save；workspace createOntologyFunctionInterface 后关窗刷新。

## 新增依赖及必要性

无。

## 验证方式

组装单测 + 契约测试 + format:check。
