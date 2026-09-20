# 接口名称

- 本体对象属性分类树查询

## 编译位置

- apis：`src/apis/ontologyObjectArrManageApi.ts`
- mocks：`src/mocks/getOntologyObjectArrTypeTreeMock/`
- types：`src/types/apis/getOntologyObjectArrTypeTreeType.ts`

## 接口描述

- 查询本体对象属性分类

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology/property/category`

## 请求方式

- GET

## 输入参数

- ```JSON
  {
    "ontologyUniqueIdentifier":"ae6cca59ced9432189da4af315554957",
  }
  ```
- 请求体：GET 请求使用 `query` 传递参数。
- `ontologyUniqueIdentifier`：【string，必填】 本体对象标识

## 输出参数

```JSON
{
  "code": 200,
  "message": "SUCCESS",
  "success": true,
  "data": {
    "categoryId": 6,
    "name": "qwe",
    "children": [
      {
        "categoryId": 7,
        "name": "qwe123"
      }
    ]
  }
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `data`：【object】响应体
  - `categoryId`:【number】分类id
  - `name`:【string】分类name
  - `children`:【array】子级数组
    - `categoryId`:【number】分类id
    - `name`:【string】分类name
    - `children`:【array】子级数组
      ...

  前端以 `code === 200` 判定查询成功，不依赖 `success` 字段。

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`SUCCESS`
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/getOntologyObjectArrTypeTreeType.ts`

```ts
export interface GetOntologyObjectArrTypeTreeParams {
  ontologyUniqueIdentifier: string;
}
export interface GetOntologyObjectArrTypeTreeData {
  categoryId: number;
  name: string;
  children?: GetOntologyObjectArrTypeTreeData[];
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { GetOntologyObjectArrTypeTreeParams, GetOntologyObjectArrTypeTreeData } from "./apis/getOntologyObjectArrTypeTreeType";
```

## apis 示例

文件：`src/apis/ontologyObjectArrManageApi.ts`

```ts
import type { ApiResponse, GetOntologyObjectArrTypeTreeParams, GetOntologyObjectArrTypeTreeData } from "@/types";
import { request } from "@/utils/request";

/**
 * 查询本体对象属性分类树。
 *
 * 请求方式：GET `/ontology/property/category`
 *
 * @param params 查询本体对象属性分类参数。
 * @param params.ontologyUniqueIdentifier 对象唯一标识
 * @returns 标准 API 响应，返回本体属性分类树。
 */
export function getOntologyObjectArrTypeTreeInterface(params: GetOntologyObjectArrTypeTreeParams): Promise<ApiResponse<GetOntologyObjectArrTypeTreeData>> {
  return request<GetOntologyObjectArrTypeTreeData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/category",
    method: "get",
    params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { getOntologyObjectArrTypeTreeInterface } from "./ontologyObjectArrManageApi";

export { getOntologyObjectArrTypeTreeInterface };
```

## mocks 示例

文件：`src/mocks/getOntologyObjectArrTypeTreeMock/getOntologyObjectArrTypeTreeMock.ts`

```ts
import type { ApiResponse, GetOntologyObjectArrTypeTreeData } from "@/types";

export const getOntologyObjectArrTypeTreeMock: ApiResponse<GetOntologyObjectArrTypeTreeData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    categoryId: 6,
    name: "全部",
    children: [
      {
        categoryId: 7,
        name: "qwe123",
      },
    ],
  },
};
```
