# 接口名称

- 本体空间手动创建

## 编译位置

- apis：`src/apis/ontologyManageApi.ts`
- mocks：`src/mocks/createOntologySpaceMock/`
- types：`src/types/apis/createOntologySpaceType.ts`

## 接口描述

- 输入参数创建手动创建本体空间。

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology/space`

## 请求方式

- post

## 输入参数

- ```JSON
  {
    "displayName": "xxx战场",
    "apiName": "space_a",
    "iconUrl": "",
    "description": "这是空间描述"
  }
  ```
- `displayName`：【string，必填】 空间名称
- `apiName`：【string，必填】空间api名称
- `iconUrl`：【string，可选】空间图标url
- `description`：【string，可选】空间描述

## 输出参数

```JSON
{
  "code": 200,
  "message": "SUCCESS",
  "data": 8
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `data`：【number】新创建空间id

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`创建成功`
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/createOntologySpaceType.ts`

```ts
export interface createOntologySpaceParams {
  displayName: string;
  apiName: string;
  icon: string;
  description: string;
}

export interface createOntologySpaceData {
  data: number;
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { createOntologySpaceParams, createOntologySpaceData } from "./apis/createOntologySpaceType";
```

## apis 示例

文件：`src/apis/ontologyManageApi.ts`

```ts
import type { ApiResponse, CreateOntologySpaceData, CreateOntologySpaceParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 创建本体空间。
 *
 * 请求方式：POST `/ontology/space`
 *
 * @param params 创建空间参数。
 * @param params.apiName 空间API。
 * @param params.displayName 空间名称。
 * @param params.icon 空间图标url。
 * @param params.description 空间描述。
 * @returns 标准 API 响应，返回新创建的空间id。
 */
export function createOntologySpaceInterface(params: CreateOntologySpaceParams): Promise<ApiResponse<CreateOntologySpaceData>> {
  return request<CreateOntologySpaceData>({
    url: "/ontology/space",
    method: "post",
    params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { createOntologySpaceInterface } from "./ontologyManageApi";

export { createOntologySpaceInterface };
```

## mocks 示例

文件：`src/mocks/ontologyManageMock/createOntologySpaceMock.ts`

```ts
import type { ApiResponse, CreateOntologySpaceData } from "@/types";

export const createOntologySpaceMock: ApiResponse<CreateOntologySpaceData> = {
  code: 200,
  message: "SUCCESS",
  data: 8,
};
```
