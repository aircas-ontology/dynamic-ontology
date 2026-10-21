# 接口名称

- 探查接口文档，解析出接口列表（名称/api/请求方式/路径/描述/出入参）

## 编译位置

- apis：`src/apis/funtionApi.ts`
- types：`src/types/apis`

## 接口描述

- 探查接口文档，解析出接口列表（名称/api/请求方式/路径/描述/出入参）

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/function/container/probe_interfaces`

## 请求方式

- POST

## 输入参数

- ```JSON
  {
    "docPath": "",
  }
  ```
- `docPath`：【string，必填】上传接口文档接口返回的存储路径

## 输出参数

```JSON
{
    "code": 200,
    "message": "SUCCESS",
    "data": [
        {
            "name": "getEcho",
            "api": "GET /get",
            "method": "GET",
            "path": "/get",
            "description": "GET 回显查询参数",
            "inputParameters": [
                {
                    "name": "name",
                    "in": "query",
                    "required": false,
                    "type": "string",
                    "description": "要回显的名字"
                }
            ],
            "outputParameters": [
                {
                    "name": "args",
                    "in": "body",
                    "required": false,
                    "type": "object",
                    "description": "回显的查询参数"
                },
                {
                    "name": "origin",
                    "in": "body",
                    "required": false,
                    "type": "string",
                    "description": "调用方地址"
                },
                {
                    "name": "url",
                    "in": "body",
                    "required": false,
                    "type": "string",
                    "description": "完整请求 URL"
                }
            ]
        },
        {
            "name": "postEcho",
            "api": "POST /post",
            "method": "POST",
            "path": "/post",
            "description": "POST 回显请求体",
            "inputParameters": [
                {
                    "name": "title",
                    "in": "body",
                    "required": false,
                    "type": "string",
                    "description": "标题"
                },
                {
                    "name": "content",
                    "in": "body",
                    "required": false,
                    "type": "string",
                    "description": "内容"
                }
            ],
            "outputParameters": [
                {
                    "name": "json",
                    "in": "body",
                    "required": false,
                    "type": "object",
                    "description": "回显的请求体"
                }
            ]
        }
    ]
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

- 成功时返回：`上传成功`
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
