# 接口名称

- 删除本体对象

## 编译位置

- apis：`src/apis/ontologyObjectManageApi.ts`
- mocks：`src/mocks/deleteOntologyObjectMock/`
- types：`src/types/apis/deleteOntologyObjectType.ts`

## 接口描述

- 根据本体对象唯一标识删除本体对象。
- 在线接口文档：[OntologyMetaController_deleteOntology](http://172.16.18.58:37002/ontology/doc.html#/ontology/%E6%9C%AC%E4%BD%93%E5%AF%B9%E8%B1%A1%E7%AE%A1%E7%90%86/OntologyMetaController_deleteOntology/doc)。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/meta/{ontologyIdentifier}`

## 请求方式

- delete

## 输入参数

- 无请求体、无 query 参数。
- 路径参数：

```text
/ontology/meta/ae6cca59ced9432189da4af315554957
```

- `ontologyIdentifier`：【string，必填】本体对象唯一标识，通过 URL 路径传递。

## 输出参数

在线文档的 200 响应包含 `code`、`message` 和 `data`，其中 `data` 类型未进一步定义。项目统一 `ApiResponse` 类型还包含 `success`，Mock 为适配项目类型保留该字段；业务成功判断以 `code === 200` 为准。

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {}
}
```

- `code`：【number】响应码。
- `message`：【string】消息描述。
- `data`：【object】接口未定义具体业务字段，按空对象承载。

## code

- `200`：删除成功。
- `400`：请求参数错误。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/deleteOntologyObjectType.ts`

```ts
export interface DeleteOntologyObjectParams {
  ontologyIdentifier: string;
}

export type DeleteOntologyObjectData = Record<string, unknown>;
```

## apis 示例

文件：`src/apis/ontologyObjectManageApi.ts`

```ts
import type { ApiResponse, DeleteOntologyObjectData, DeleteOntologyObjectParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 删除本体对象。
 *
 * 请求方式：DELETE `/ontology/meta/{ontologyIdentifier}`
 *
 * @param params 删除本体对象参数。
 * @param params.ontologyIdentifier 本体对象唯一标识。
 * @returns 标准 API 响应，data 未定义具体业务字段。
 */
export function deleteOntologyObjectInterface(params: DeleteOntologyObjectParams): Promise<ApiResponse<DeleteOntologyObjectData>> {
  return request<DeleteOntologyObjectData>({
    url: `${DOMAIN_CONFIG.ONTOLOGYMANAGE_URL}/meta/${encodeURIComponent(params.ontologyIdentifier)}`,
    method: "delete",
  });
}
```

## mocks 示例

文件：`src/mocks/deleteOntologyObjectMock/deleteOntologyObjectMock.ts`

```ts
import type { ApiResponse, DeleteOntologyObjectData } from "@/types";

export const deleteOntologyObjectMock: ApiResponse<DeleteOntologyObjectData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {},
};
```
