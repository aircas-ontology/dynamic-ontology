# 接口名称

- 本体对象属性分类树编辑

## 编译位置

- apis：`src/apis/ontologyObjectArrManageApi.ts`
- mocks：`src/mocks/updateOntologyObjectArrTypeTreeMock/`
- types：`src/types/apis/updateOntologyObjectArrTypeTreeType.ts`

## 接口描述

- 输入参数修改本体对象属性分类节点。

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology/property/category`

## 请求方式

- put

## 输入参数

- ```JSON
  {
    "ontologyIdentifier":"ae6cca59ced9432189da4af315554957",
    "categoryId":0,
    "name":"qwe"
  }
  ```
- 请求体：put 请求使用 `data` 传递 JSON 对象。
- `ontologyIdentifier`：【string，必填】 本体对象标识
- `categoryId`：【number，必填】 分类id
- `name`：【string，必填】分类名称

## 输出参数

```JSON
{
  "code": 200,
  "message": "SUCCESS",
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
  前端以 `code === 200` 判定修改成功；即使服务端省略统一响应中的 `success` 字段，也会正常关闭弹窗并刷新列表。

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`SUCCESS`
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/updateOntologyObjectArrTypeTreeType.ts`

```ts
export interface updateOntologyObjectArrTypeTreeParams {
  ontologyIdentifier: string;
  categoryId: number;
  name: string;
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { updateOntologyObjectArrTypeTreeParams } from "./apis/updateOntologyObjectArrTypeTreeType";
```

## apis 示例

文件：`src/apis/ontologyObjectArrManageApi.ts`

```ts
import type { ApiResponse, updateOntologyObjectArrTypeTreeParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 修改本体对象属性分类树。
 *
 * 请求方式：put `/ontology/property/category`
 *
 * @param params 修改本体对象属性分类参数。
 * @param params.ontologyIdentifier 对象标识。
 * @param params.categoryId 节点id。
 * @param params.name 属性分类名称。
 * @returns 标准 API 响应，返回新修改的本体id。
 */
export function updateOntologyObjectArrTypeTreeInterface(params: updateOntologyObjectArrTypeTreeParams): Promise<ApiResponse<>> {
  return request<>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/category",
    method: "put",
    data: params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { updateOntologyObjectArrTypeTreeInterface } from "./ontologyObjectArrManageApi";

export { updateOntologyObjectArrTypeTreeInterface };
```

## mocks 示例

文件：`src/mocks/updateOntologyObjectMock/updateOntologyObjectArrTypeTreeMock.ts`

```ts
import type { ApiResponse } from "@/types";

export const updateOntologyObjectArrTypeTreeMock: ApiResponse<> = {
  code: 200,
  message: "SUCCESS",
};
```
