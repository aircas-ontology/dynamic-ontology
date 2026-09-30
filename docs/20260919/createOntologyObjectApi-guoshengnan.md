# 接口名称

- 本体对象手动创建

## 编译位置

- apis：`src/apis/ontologyObjectManageApi.ts`
- mocks：`src/mocks/createOntologyObjectMock/`
- types：`src/types/apis/createOntologyObjectType.ts`

## 接口描述

- 输入参数手动创建本体对象。

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology/meta`

## 请求方式

- post

## 输入参数

- ```JSON
  {
    "spaceId": 11,
    "displayName": "测试本体对象",
    "apiName":"object_1",
    "iconUrl": "",
    "description": "这是本体描述",
    "parentOntologyUniqueIdentifier": "d3e1b0c27f29452eb7cadd1f51eac535",
    "categoryId": 29,
    "groupIds":[]
  }
  ```
- 请求体：POST 请求使用 `data` 传递 JSON 对象。
- `spaceId`：【number，必填】 本体空间 id
- `displayName`：【string，必填】 本体名称
- `apiName`：【string，必填】本体api名称
- `iconUrl`：【string，可选】本体图标url
- `description`：【string，可选】本体描述
- `parentOntologyUniqueIdentifier`：【string，可选】继承的本体唯一标识
- `categoryId`：【number，可选】分类id
- `groupIds`：【string[]，可选】分组ids

## 输出参数

```JSON
{
  "code": 200,
  "message": "SUCCESS",
  "success": true,
  "data": {
    "uniqueIdentifier": "ae6cca59ced9432189da4af315554957"
  }
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `success`：【boolean】请求是否成功
- `data`：【object】响应数据
  - `uniqueIdentifier`：【string】本体标识

前端以 `code === 200` 判定创建成功；即使服务端省略统一响应中的 `success` 字段，也会正常关闭弹窗并刷新列表。

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`SUCCESS`
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/createOntologyObjectType.ts`

```ts
export interface CreateOntologyObjectParams {
  spaceId: number;
  displayName: string;
  apiName: string;
  icon?: string;
  description?: string;
  parentOntologyUniqueIdentifier?: string;
  categoryId?: number;
  groupIds?: string[];
}

export interface CreateOntologyObjectData {
  uniqueIdentifier: string;
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { CreateOntologyObjectData, CreateOntologyObjectParams } from "./apis/createOntologyObjectType";
```

## apis 示例

文件：`src/apis/ontologyObjectManageApi.ts`

```ts
import type { ApiResponse, CreateOntologyObjectData, CreateOntologyObjectParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 创建本体。
 *
 * 请求方式：POST `/ontology/meta`
 *
 * @param params 创建本体参数。
 * @param params.spaceId 空间ID。
 * @param params.apiName 本体API。
 * @param params.displayName 本体名称。
 * @param params.icon 本体图标url。
 * @param params.description 本体描述。
 * @param params.parentOntologyUniqueIdentifier 继承ID。
 * @param params.categoryId 本体分类id。
 * @param params.groupIds 本体分组ids。
 * @returns 标准 API 响应，返回新创建的本体id。
 */
export function createOntologyObjectInterface(params: CreateOntologyObjectParams): Promise<ApiResponse<CreateOntologyObjectData>> {
  return request<CreateOntologyObjectData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/meta",
    method: "post",
    data: params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { createOntologyObjectInterface } from "./ontologyObjectManageApi";

export { createOntologyObjectInterface };
```

## mocks 示例

文件：`src/mocks/createOntologyObjectMock/createOntologyObjectMock.ts`

```ts
import type { ApiResponse, CreateOntologyObjectData } from "@/types";

export const createOntologyObjectMock: ApiResponse<CreateOntologyObjectData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    uniqueIdentifier: "ae6cca59ced9432189da4af315554957",
  },
};
```
