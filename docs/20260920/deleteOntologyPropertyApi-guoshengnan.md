# 接口名称

- 本体对象属性删除

## 接口描述

- 根据属性唯一标识删除本体对象属性。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/property/{propertyUniqueIdentifier}`

## 请求方式

- DELETE

## 输入参数

| 参数                     | 位置 | 类型   | 必填 | 说明         |
| ------------------------ | ---- | ------ | ---- | ------------ |
| propertyUniqueIdentifier | path | string | 是   | 属性唯一标识 |

- 请求体：无。

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": null
}
```

| 字段    | 类型            | 说明                             |
| ------- | --------------- | -------------------------------- |
| code    | integer / int32 | 响应码                           |
| message | string          | 消息描述                         |
| data    | unknown         | 业务数据，接口文档未定义具体结构 |

## code

- `200`：删除成功。
- `400`：请求参数错误。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/deleteOntologyPropertyType.ts`

```ts
export interface DeleteOntologyPropertyParams {
  propertyUniqueIdentifier: string;
}

export type DeleteOntologyPropertyData = undefined;
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { DeleteOntologyPropertyData, DeleteOntologyPropertyParams } from "./apis/deleteOntologyPropertyType";
```

## apis 示例

文件：`src/apis/ontologyPropertyApi.ts`

```ts
import type { ApiResponse, DeleteOntologyPropertyData, DeleteOntologyPropertyParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 删除本体对象属性。
 *
 * 请求方式：DELETE `/ontology/property/{propertyUniqueIdentifier}`
 *
 * @param params 删除本体对象属性参数。
 * @param params.propertyUniqueIdentifier 属性唯一标识。
 * @returns 标准 API 响应。
 */
export function deleteOntologyPropertyInterface(params: DeleteOntologyPropertyParams): Promise<ApiResponse<DeleteOntologyPropertyData>> {
  return request<DeleteOntologyPropertyData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + `/ontology/property/${encodeURIComponent(params.propertyUniqueIdentifier)}`,
    method: "delete",
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { deleteOntologyPropertyInterface } from "./ontologyPropertyApi";

export { deleteOntologyPropertyInterface };
```

## mocks 示例

文件：`src/mocks/deleteOntologyPropertyMock/deleteOntologyPropertyMock.ts`

```ts
import type { ApiResponse, DeleteOntologyPropertyData } from "@/types";

export const deleteOntologyPropertyMock: ApiResponse<DeleteOntologyPropertyData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: undefined,
};
```
