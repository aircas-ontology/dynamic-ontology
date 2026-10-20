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

## 1 编辑函数算子外部API函数

## 外部API函数详情参考格式

{
"code": 200,
"message": "SUCCESS",
"data": {
"functionApi": "wb",
"version": "1.0.0",
"publishStatus": 0,
"displayName": "外部测试",
"description": "wb",
"model": "OTHER",
"type": "EXTERNAL",
"language": "GROOVY",
"ontologySpaceId": 1,
"params": [
{
"paramId": 1334,
"paramName": "result",
"paramType": "OBJECT",
"category": "OUTPUT",
"paramOrder": 1,
"description": "响应报文"
},
{
"paramId": 1335,
"paramName": "status",
"paramType": "DOUBLE",
"category": "OUTPUT",
"paramOrder": 2,
"description": "HTTP 状态码"
}
],
"code": "{\"endpoint\":\"https://httpbin.org/post\",\"method\":\"POST\",\"authType\":\"none\",\"apiKeyHeader\":null,\"apiKey\":null,\"contentType\":\"application/json\",\"headers\":null,\"timeoutSeconds\":null,\"inputs\":[],\"outputs\":[]}",
"apiConfig": {
"endpoint": "https://httpbin.org/post",
"method": "POST",
"authType": "none",
"contentType": "application/json",
"inputs": [],
"outputs": []
}
}
}
