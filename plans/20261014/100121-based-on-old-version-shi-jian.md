# 创建脚本函数传入 basedOnOldVersion

## 需求理解

脚本创建时 basedOnOldVersion：源版本非空 true，否则 false。

## 修改范围

创建类型、组装工具、FormDialog/IDE、测试。

## 新增、修改和删除文件

- 修改：createOntologyFunctionType、buildCreateOntologyScriptFunctionParams、ScriptIdeDialog、FormDialog、相关测试

## 核心实现方式

类型增加字段；组装入参带 sourceVersion；透传到 IDE 保存。

## 新增依赖及必要性

无。

## 验证方式

相关测试 + format:check。
