# 接口名称

- 函数算子修改函数

## 编译位置

mocks与types文件名自行语义化命名

- apis：`src/apis/functionApi.ts`
- mocks：`src/mocks/`
- types：`src/types/apis/`

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology/function`

## 请求方式

- PUT

## 输入参数

- ```JSON
  {
    "functionApi": "",
    "displayName": "",
    "description": "",
    "type": "",
    "ontologySpaceId": "",
    "queryConfig":{
      "aggFunc":"",
      "filters":{}
    }
  }
  ```

- `functionApi`：【string，必填】 函数api
- `displayName`：【string，必填】 函数名称
- `description`：【string，必填】 描述
- `type`：【string，必填】 函数模型,目前只有一个值BASIC_QUERY
- `ontologySpaceId`：【number，必填】 所属本体空间 id
- `queryConfig`：【object，非必填】 基础查询算子配置对象

## 输出参数

```JSON
{
  "code": 200,
  "message": "SUCCESS",
}
```

- `code`：【number】响应码
- `message`：【string】消息描述

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`查询成功`
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/ontologySearchType.ts`

```ts
export interface OntologySearchParams {
  keyword?: string;
  page: number;
  pageSize: number;
}

export interface OntologySearchItem {
  id: string;
  name: string;
  description: string;
}

export interface OntologySearchData {
  items: OntologySearchItem[];
  total: number;
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { OntologySearchData, OntologySearchItem, OntologySearchParams } from "./apis/ontologySearchType";
```

## apis 示例

文件：`src/apis/ontologySearchApi.ts`

```ts
import type { ApiResponse, OntologySearchData, OntologySearchParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 根据关键词分页查询本体数据。
 *
 * 请求方式：GET `/ontology/search`
 *
 * @param params 查询参数。
 * @param params.keyword 可选的本体名称或描述关键词。
 * @param params.page 当前页码，从 1 开始。
 * @param params.pageSize 每页返回的数据条数。
 * @returns 标准 API 响应，包含当前页本体列表和数据总数。
 */
export function getOntologySearchInterface(params: OntologySearchParams): Promise<ApiResponse<OntologySearchData>> {
  return request<OntologySearchData>({
    url: "/ontology/search",
    method: "get",
    params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { getOntologySearchInterface } from "./ontologySearchApi";

export { getOntologySearchInterface };
```

## mocks 示例

文件：`src/mocks/ontologySearchMock/ontologySearchMock.ts`

```ts
import type { ApiResponse, OntologySearchData } from "@/types";

export const ontologySearchMock: ApiResponse<OntologySearchData> = {
  code: 200,
  message: "查询成功",
  success: true,
  data: {
    items: [
      {
        id: "ontology-001",
        name: "Satellite Ontology",
        description: "用于描述卫星及其关联资源的本体。",
      },
    ],
    total: 1,
  },
};
```
