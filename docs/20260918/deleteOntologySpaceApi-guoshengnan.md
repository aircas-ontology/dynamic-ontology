# 接口名称

- 本体空间删除

## 编译位置

- apis：`src/apis/ontologyManageApi.ts`
- mocks：`src/mocks/deleteOntologySpaceMock/`
- types：`src/types/apis/deleteOntologySpaceType.ts`

## 接口描述

- 输入参数删除本体空间。

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology/space/{spaceId}`

## 请求方式

- delete

## 输入参数

- ```Path
    spaceId:number
  ```
- `spaceId`：【number，必填】空间id

## 输出参数

```JSON
{
  "code": 0,
  "message": "",
  "data": {}
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `data`：【object】

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`删除成功`
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/deleteOntologySpaceType.ts`

```ts
export interface deleteOntologySpaceParams {
  spaceId: number;
  icon: string;
}

export interface deleteOntologySpaceData {
  data: object;
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { deleteOntologySpaceParams, deleteOntologySpaceData } from "./apis/deleteOntologySpaceType";
```

## apis 示例

文件：`src/apis/ontologyManageApi.ts`

```ts
import type { ApiResponse, DeleteOntologySpaceData, DeleteOntologySpaceParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 删除本体空间。
 *
 * 请求方式：DELETE `/ontology/space/{spaceId}`
 *
 * @param params 删除空间参数。
 * @param params.spaceId 空间ID。。
 * @returns 标准 API 响应。
 */
export function deleteOntologySpaceInterface(params: DeleteOntologySpaceParams): Promise<ApiResponse<DeleteOntologySpaceData>> {
  return request<DeleteOntologySpaceData>({
    url: "/ontology/space/`${params}`",
    method: "delete",
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { deleteOntologySpaceInterface } from "./ontologyManageApi";

export { deleteOntologySpaceInterface };
```

## mocks 示例

文件：`src/mocks/ontologyManageMock/deleteOntologySpaceMock.ts`

```ts
import type { ApiResponse, DeleteOntologySpaceData } from "@/types";

export const deleteOntologySpaceMock: ApiResponse<DeleteOntologySpaceData> = {
  code: 200,
  message: "SUCCESS",
  data: {},
};
```
