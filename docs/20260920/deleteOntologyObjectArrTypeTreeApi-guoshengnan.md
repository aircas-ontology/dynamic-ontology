# 接口名称

- 删除本体对象属性分类树

## 编译位置

- apis：`src/apis/ontologyObjectArrManageApi.ts`
- mocks：`src/mocks/deleteOntologyObjectArrTypeTreeMock/`
- types：`src/types/apis/deleteOntologyObjectArrTypeTreeType.ts`

## 接口描述

- 根据本体对象属性分类id删除本体对象属性分类节点。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/property/category`

## 请求方式

- delete

## 输入参数

- ```JSON
  {
    "ontologyIdentifier":"ae6cca59ced9432189da4af315554957",
    "categoryId":6
  }
  ```
- 请求体：POST 请求使用 `data` 传递 JSON 对象。
- `ontologyIdentifier`：【string，必填】 本体对象标识
- `categoryId`：【number，必填】 分类id

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS"
}
```

- `code`：【number】响应码。
- `message`：【string】消息描述

## code

- `200`：删除成功。
- `400`：请求参数错误。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/deleteOntologyObjectArrTypeTreeType.ts`

```ts
export interface DeleteOntologyObjectArrTypeTreeParams {
  ontologyIdentifier: string;
  categoryId: number;
}
```

## apis 示例

文件：`src/apis/ontologyObjectManageApi.ts`

```ts
import type { ApiResponse, DeleteOntologyObjectArrTypeTreeParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 删除本体对象属性分类节点。
 *
 * 请求方式：DELETE `/ontology/property/category`
 *
 * @param params 删除本体对象参数。
 * @param params.ontologyIdentifier 本体对象唯一标识。
 * @param params.categoryId 本体对象属性分类唯一标识。
 * @returns 标准 API 响应，data 未定义具体业务字段。
 */
export function deleteOntologyObjectArrTypeTreeInterface(params: DeleteOntologyObjectArrTypeTreeParams): Promise<ApiResponse<>> {
  return request<>({
    url: `${DOMAIN_CONFIG.ONTOLOGYMANAGE_URL}/ontology/property/category`,
    method: "delete",
  });
}
```

## mocks 示例

文件：`src/mocks/deleteOntologyObjectArrTypeTreeMock/deleteOntologyObjectArrTypeTreeMock.ts`

```ts
import type { ApiResponse } from "@/types";

export const deleteOntologyObjectArrTypeTreeMock: ApiResponse<> = {
  code: 200,
  message: "SUCCESS"
};
```
