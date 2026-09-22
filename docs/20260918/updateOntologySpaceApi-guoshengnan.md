# 接口名称

- 本体空间编辑

## 编译位置

- apis：`src/apis/ontologyManageApi.ts`
- mocks：`src/mocks/updateOntologySpaceMock/`
- types：`src/types/apis/updateOntologySpaceType.ts`

## 接口描述

- 输入参数修改本体空间。

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology/space`

## 请求方式

- put

## 输入参数

- ```JSON
  {
    "displayName": "xxx战场-11",
    "spaceId":8,
    "iconUrl": "",
    "description": "这是空间描述"
  }
  ```
- `displayName`：【string，必填】 空间名称
- `spaceId`：【number，必填】空间id
- `iconUrl`：【string，可选】空间图标url
- `description`：【string，可选】空间描述

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

- 成功时返回：`更新成功`
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/updateOntologySpaceType.ts`

```ts
export interface updateOntologySpaceParams {
  displayName: string;
  spaceId: number;
  icon: string;
  description: string;
}

export interface updateOntologySpaceData {
  data: object;
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { updateOntologySpaceParams, updateOntologySpaceData } from "./apis/updateOntologySpaceType";
```

## apis 示例

文件：`src/apis/ontologyManageApi.ts`

```ts
import type { ApiResponse, UpdateOntologySpaceData, UpdateOntologySpaceParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 编辑本体空间。
 *
 * 请求方式：PUT `/ontology/space`
 *
 * @param params 编辑空间参数。
 * @param params.spaceId 空间ID。
 * @param params.displayName 空间名称。
 * @param params.icon 空间图标url。
 * @param params.description 空间描述。
 * @returns 标准 API 响应。
 */
export function updateOntologySpaceInterface(params: UpdateOntologySpaceParams): Promise<ApiResponse<UpdateOntologySpaceData>> {
  return request<UpdateOntologySpaceData>({
    url: "/ontology/space",
    method: "put",
    params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { updateOntologySpaceInterface } from "./ontologyManageApi";

export { updateOntologySpaceInterface };
```

## mocks 示例

文件：`src/mocks/ontologyManageMock/updateOntologySpaceMock.ts`

```ts
import type { ApiResponse, UpdateOntologySpaceData } from "@/types";

export const updateOntologySpaceMock: ApiResponse<UpdateOntologySpaceData> = {
  code: 200,
  message: "SUCCESS",
  data: {},
};
```
