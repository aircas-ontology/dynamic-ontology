# 编辑脚本函数走 PUT

## 需求理解

编辑脚本保存走 PUT；新建仍 POST。

## 修改范围

Update 类型、functionApi JSDoc、saveScriptOperator、IDE language-locked、测试。

## 新增、修改和删除文件

- 修改：updateOntologyFunctionType.ts、functionApi.ts、useFunctionOperatorWorkspace.ts、FormDialog、ScriptIdeDialog、相关测试

## 核心实现方式

Update 支持 CUSTOMIZE；editingOperator 分流 PUT/POST；编辑禁用语言。

## 新增依赖及必要性

无。

## 验证方式

契约测试 + format:check。
