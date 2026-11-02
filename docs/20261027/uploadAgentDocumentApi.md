# 接口名称

- 上传会话参考文档

## 编译位置

- apis：`src/apis/agentChatApi.ts`
- types：`src/types/apis/agentChatType.ts`
- mocks：`src/mocks/agentChatMock/agentChatMock.ts`

## 接口来源

- Knife4j 文档：`http://172.16.18.58:37003/agent/doc.html#/default/Agent%20%E5%AF%B9%E8%AF%9D/AgentChatController_uploadDocument/doc`
- 文档标题：`POST 上传会话参考文档（对象构建第2步导入资料，仅支持 txt/md，重复上传以最新一份为准）`
- 文档定义的操作标识：`AgentChatController_uploadDocument`

## 接口描述

- 为指定会话上传参考文档，用于对象构建第 2 步导入资料。
- 仅支持 `txt` 和 `md` 文件。
- 同一会话重复上传时，以最新上传的文档为准。

## 接口 domain

- `DOMAIN_CONFIG.AGENT_URL`

## 接口 uri

- `/chat/upload_document`

## 请求方式

- POST

## 请求参数

| 参数        | 位置                | 类型   | 必填 | 说明                             |
| ----------- | ------------------- | ------ | ---- | -------------------------------- |
| `sessionId` | query               | string | 是   | 会话标识                         |
| `file`      | multipart/form-data | binary | 是   | 参考文档文件，仅支持 `txt`、`md` |

## 输入参数

请求头：

- `Content-Type: multipart/form-data`

请求示例：

```text
POST /chat/upload_document?sessionId=session-001
Content-Type: multipart/form-data
```

表单字段：

```text
file=<对象说明.md>
```

`sessionId` 放在 URL query 参数中，`file` 以 multipart 表单文件字段传递。调用前应校验会话标识非空，并限制文件扩展名为 `.txt` 或 `.md`。

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "fileName": "对象说明.md",
    "charCount": 4260,
    "truncated": false
  }
}
```

- `code`：【integer / int32】响应码
- `message`：【string】消息描述
- `data`：【DocumentUploadVO】文档上传结果
- `data.fileName`：【string】文档文件名
- `data.charCount`：【integer / int32】解析后保留的字符数
- `data.truncated`：【boolean】正文超长是否被截断，正文上限为 8000 字符

## 处理说明

- 当 `truncated` 为 `true` 时，服务端已截断超出 8000 字符上限的正文，前端应向用户明确提示。
- 重复上传不会产生多份当前会话参考文档，最新上传内容会覆盖之前的文档。
- 上传成功以响应 `code` 为 `200` 为准；失败时使用 `message` 展示错误原因。

## 响应状态码

- `200`：上传成功
- `400`：请求参数或文件格式错误
- `401`：权限不足，请重新登录
- `413`：文件或正文内容超过服务端限制
- `500`：服务器内部错误

## 前端调用示例

```ts
const formData = new FormData();
formData.append("file", file);

const response = await uploadAgentDocumentInterface(sessionId, formData);
if (response.code !== 200) {
  throw new Error(response.message || "文档上传失败");
}

if (response.data?.truncated) {
  ElMessage.warning(`文档已上传，但正文已截断至 ${response.data.charCount} 个字符`);
}
```

接口函数应通过 `DOMAIN_CONFIG.AGENT_URL` 拼接 `/chat/upload_document`，并将 `sessionId` 作为 query 参数、`FormData` 作为请求体提交。
