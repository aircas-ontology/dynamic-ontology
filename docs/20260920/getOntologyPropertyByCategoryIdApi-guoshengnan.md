# 接口名称

- 根据分类查询本体对象属性列表

## 接口描述

- 根据属性分类 id 查询本体对象属性列表；不传 `categoryId` 时查询全部属性。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/property/by_category`

## 请求方式

- GET

## 输入参数

| 参数       | 位置  | 类型            | 必填 | 说明                            |
| ---------- | ----- | --------------- | ---- | ------------------------------- |
| categoryId | query | integer / int32 | 否   | 属性分类 id；不传时查询全部属性 |

- 请求体：无。

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": [
    {
      "displayName": "属性名称",
      "description": "属性描述",
      "isPrimaryKey": false,
      "isTitleKey": false,
      "uniqueIdentifier": "property-001",
      "ontologyUniqueIdentifier": "ontology-001",
      "defaultValue": "",
      "storageGroup": "主存储",
      "categoryId": 6,
      "metadata": {}
    }
  ]
}
```

| 字段                            | 类型            | 说明                  |
| ------------------------------- | --------------- | --------------------- |
| code                            | integer / int32 | 响应码                |
| message                         | string          | 消息描述              |
| data                            | array           | 本体属性信息列表      |
| data[].displayName              | string          | 属性名称              |
| data[].description              | string          | 属性描述              |
| data[].isPrimaryKey             | boolean         | 是否为主键            |
| data[].isTitleKey               | boolean         | 是否为名称键          |
| data[].uniqueIdentifier         | string          | 属性唯一标识          |
| data[].ontologyUniqueIdentifier | string          | 本体唯一标识          |
| data[].defaultValue             | string          | 属性默认值            |
| data[].storageGroup             | string          | 属性存储分组          |
| data[].categoryId               | integer / int32 | 属性分类 id           |
| data[].metadata                 | object          | 属性元数据，JSON 格式 |

## code

- `200`：请求成功。
- `400`：请求参数错误。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/getOntologyPropertyByCategoryIdType.ts`

```ts
import type { OntologyPropertyInfo } from "./getOntologyPropertyByOntologyIdType";

export interface GetOntologyPropertyByCategoryIdParams {
  categoryId?: number;
}

export type GetOntologyPropertyByCategoryIdData = OntologyPropertyInfo[];
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { GetOntologyPropertyByCategoryIdData, GetOntologyPropertyByCategoryIdParams } from "./apis/getOntologyPropertyByCategoryIdType";
```

## apis 示例

文件：`src/apis/ontologyPropertyApi.ts`

```ts
import type { ApiResponse, GetOntologyPropertyByCategoryIdData, GetOntologyPropertyByCategoryIdParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 根据分类查询本体对象属性列表。
 *
 * 请求方式：GET `/ontology/property/by_category`
 *
 * @param params 可选查询参数；不传 categoryId 时查询全部属性。
 * @returns 标准 API 响应，data 为属性列表。
 */
export function getOntologyPropertyByCategoryIdInterface(
  params?: GetOntologyPropertyByCategoryIdParams,
): Promise<ApiResponse<GetOntologyPropertyByCategoryIdData>> {
  return request<GetOntologyPropertyByCategoryIdData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/by_category",
    method: "get",
    params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { getOntologyPropertyByCategoryIdInterface } from "./ontologyPropertyApi";

export { getOntologyPropertyByCategoryIdInterface };
```

## mocks 示例

文件：`src/mocks/getOntologyPropertyByCategoryIdMock/getOntologyPropertyByCategoryIdMock.ts`

```ts
import type { ApiResponse, GetOntologyPropertyByCategoryIdData } from "@/types";

export const getOntologyPropertyByCategoryIdMock: ApiResponse<GetOntologyPropertyByCategoryIdData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: [],
};
```
