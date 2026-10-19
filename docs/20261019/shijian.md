## 1 新建函数算子外部API函数创建

## 开发内容

根据文档 \dynamic-ontology\docs\20260923\6.createFunApi-shijian.md 中的接口开发创建外部API函数功能，请求参数格式参考
{
"functionApi": "httpbin-echo-test",
"version": "1.0.0",
"displayName": "httpbin回显测试",
"description": "外部API简化契约测试",
"type": "EXTERNAL",
"ontologySpaceId": 12,
"apiConfig": {
"endpoint": "https://httpbin.org/post",
"method": "POST",
"authType": "none",
"apiKey": "",
"contentType": "application/json",
"inputs": [
{ "name": "title", "type": "string", "required": true, "location": "body", "description": "标题" },
{ "name": "content", "type": "string", "required": false, "location": "body", "description": "内容" }
],
"outputs": [
{ "name": "json", "type": "object", "description": "回显的请求体" },
{ "name": "origin", "type": "string", "description": "客户端IP" }
]
}
}
