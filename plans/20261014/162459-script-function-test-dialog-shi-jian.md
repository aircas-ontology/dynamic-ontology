# 脚本函数独立测试弹框

## 需求理解

脚本函数独立测试弹框；INPUT 表单；POST test 传 parameters；结果展示完整响应。

## 修改范围

testOntologyFunctionType、mapOntologyFunctionTest、workspace、ScriptTestDialog、index、测试。

## 新增、修改和删除文件

- 新增：FunctionOperatorScriptTestDialog.vue
- 修改：类型、map、workspace、index、测试

## 核心实现方式

openTest 分流；脚本弹框拉详情 INPUT；组装 parameters 调用 test 接口。

## 新增依赖及必要性

无。

## 验证方式

契约测试 + format:check。
