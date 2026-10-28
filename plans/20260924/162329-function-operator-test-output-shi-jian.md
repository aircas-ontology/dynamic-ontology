# Plan：测试弹框双栏输出结果

确认范围（用户 2026-09-24「确认」）。

## 需求理解

加宽测试弹框；请求参数与输出结果各占一半宽度；运行测试后把完整响应 JSON 写入输出结果文本框。

## 修改范围

- FunctionOperatorPanel 测试弹框布局与宽度
- useFunctionOperatorWorkspace：testOutput + runTest 回填
- 相关单测

## 新增依赖

无。

## 验证方式

相关单测 + format。
