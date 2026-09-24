# 接口名称

- 本体对象属性修改

## 接口描述

- 修改本体对象属性。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/property`

## 请求方式

- PUT

## 输入参数

- 请求体：JSON 对象。

| 字段             | 类型            | 必填 | 说明                                      |
| ---------------- | --------------- | ---- | ----------------------------------------- |
| uniqueIdentifier | string          | 是   | 属性唯一标识，文档说明为 `uniqIdentifier` |
| displayName      | string          | 是   | 属性名称                                  |
| apiName          | string          | 是   | 属性 API 名称                             |
| dataType         | string          | 是   | 数据类型                                  |
| description      | string          | 否   | 属性描述                                  |
| isTitleKey       | boolean         | 是   | 是否为名称键                              |
| isPrimaryKey     | boolean         | 是   | 是否为主键                                |
| defaultValue     | string          | 否   | 属性默认值                                |
| storageGroup     | string          | 是   | 属性存储分组                              |
| categoryId       | integer / int32 | 否   | 属性分类 id                               |

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

- `200`：请求成功。
- `400`：请求参数错误。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/updateOntologyPropertyType.ts`

```ts
export interface UpdateOntologyPropertyParams {
  uniqueIdentifier: string;
  displayName: string;
  apiName: string;
  dataType: string;
  description?: string;
  isTitleKey: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
  storageGroup: string;
  categoryId?: number;
}

export type UpdateOntologyPropertyData = undefined;
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { UpdateOntologyPropertyData, UpdateOntologyPropertyParams } from "./apis/updateOntologyPropertyType";
```

## apis 示例

文件：`src/apis/ontologyPropertyApi.ts`

```ts
import type { ApiResponse, UpdateOntologyPropertyData, UpdateOntologyPropertyParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 修改本体对象属性。
 *
 * 请求方式：PUT `/ontology/property`
 *
 * @param params 修改本体对象属性参数。
 * @returns 标准 API 响应。
 */
export function updateOntologyPropertyInterface(params: UpdateOntologyPropertyParams): Promise<ApiResponse<UpdateOntologyPropertyData>> {
  return request<UpdateOntologyPropertyData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property",
    method: "put",
    data: params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { updateOntologyPropertyInterface } from "./ontologyPropertyApi";

export { updateOntologyPropertyInterface };
```

## mocks 示例

文件：`src/mocks/updateOntologyPropertyMock/updateOntologyPropertyMock.ts`

```ts
import type { ApiResponse, UpdateOntologyPropertyData } from "@/types";

export const updateOntologyPropertyMock: ApiResponse<UpdateOntologyPropertyData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: undefined,
};
```
