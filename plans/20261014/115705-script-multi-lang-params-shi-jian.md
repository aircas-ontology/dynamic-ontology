# 多语言脚本 starter 与入出参识别

## 需求理解

Python/Groovy/Java 基础模版 + 按语法解析入出参标签。

## 修改范围

scriptFunctionStarters、各语言解析器、parseScriptExportParams、ScriptIdeDialog、测试。

## 新增、修改和删除文件

- 新增：parsePython/Groovy/Java + parseScriptExportParams + 测试
- 修改：starters、ScriptIdeDialog、契约测试

## 核心实现方式

轻量文本解析；统一 name - type；IDE 按语言分发。

## 新增依赖及必要性

无。

## 验证方式

单测 + format:check。
