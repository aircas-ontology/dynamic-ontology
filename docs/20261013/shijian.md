## 1 脚本函数弹框的输入输出参数展示要根据代码实时渲染

## 功能要求

目前先只实现TypeScript语言，注意只识别export的方法（正常情况下只会export一个方法）

## 2 创建脚本函数功能开发

## 功能要求

点击脚本函数弹框的保存按钮后调用\dynamic-ontology\docs\20260923\6.createFunApi-shijian.md 中的接口完成脚本函数的创建

## 请求参数示例

{
"functionApi": "smoke.hello.ts",
"version": "1.0.0",
"displayName": "冒烟测试函数-TS",
"description": "TypeScript 脚本链路验证",
"type": "CUSTOMIZE",
"language": "TYPESCRIPT",
"ontologySpaceId": 1,
"code": "function handle(input: any): any {\n const name = (input && input.name) ? input.name : 'world';\n return {\n data: 'hello ' + String(name),\n description: 'from ts runner',\n status: 'SUCCESS'\n };\n}",
"parameters": [
{ "paramName": "name", "paramType": "STRING", "category": "INPUT"},
{ "paramName": "data", "paramType": "STRING", "category": "OUTPUT"}
]
}

其中code为脚本函数ide中的代码，parameters为识别的输入输出参数
