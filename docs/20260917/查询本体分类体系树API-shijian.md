# 接口名称

- 查询本体分类体系树

## 编译位置

文件名自行语义化命名
- apis：`src/apis/`
- mocks：`src/mocks/`
- types：`src/types/apis/`

## 接口描述

- 查询本体分类体系树

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology`

## 请求方式

- get

## 输入参数

- ```JSON
  {
    "spaceId": "1",
  }
  ```
- `spaceId`：【string，必填】 空间id


## 输出参数

```JSON
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "categoryId": 1,
    "name": "舰船",
    "ontologyMetaInfos": [
      {
        "uniqueIdentifier": "d3e1b0c27f29452eb7cadd1f51eac535",
        "createTime": "2026-09-17 11:15:13",
        "updateTime": "2026-09-17 11:15:13",
        "latestQueryTime": "2026-09-17 11:15:13",
        "displayName": "舰船",
        "description": "我方舰船",
        "apiName": "ship",
        "metaGroupId": [],
        "spaceId": 1,
        "ontologyCategoryId": 1,
        "entityCount": 0,
        "relationCount": 1,
        "propertyCount": 4,
        "actionCount": 0
      },
      {
        "uniqueIdentifier": "17829f55e64e4efba9fdcee03eb46675",
        "createTime": "2026-09-17 11:46:31",
        "updateTime": "2026-09-17 11:46:31",
        "latestQueryTime": "2026-09-17 11:46:31",
        "displayName": "舰船1",
        "description": "我方舰船",
        "apiName": "ship1",
        "metaGroupId": [],
        "spaceId": 1,
        "ontologyCategoryId": 1,
        "parentOntologyUniqueIdentifier": "d3e1b0c27f29452eb7cadd1f51eac535",
        "parentOntologyDisplayName": "舰船",
        "entityCount": 0,
        "relationCount": 2,
        "propertyCount": 2,
        "actionCount": 0
      },
      {
        "uniqueIdentifier": "d58eecff239c4c7f908d9c640a95d68e",
        "createTime": "2026-09-16 15:51:55",
        "updateTime": "2026-09-16 15:51:55",
        "latestQueryTime": "2026-09-16 15:51:55",
        "icon": "",
        "displayName": "飞机",
        "description": "这是一架我方战斗机",
        "apiName": "airplane",
        "metaGroupId": [],
        "spaceId": 1,
        "ontologyCategoryId": 1,
        "entityCount": 0,
        "relationCount": 1,
        "propertyCount": 6,
        "actionCount": 0
      }
    ],
    "children": [
      {
        "categoryId": 2,
        "name": "航空母舰",
        "children": [
          {
            "categoryId": 3,
            "name": "航空母舰",
            "children": [
              {
                "categoryId": 4
              }
            ]
          }
        ]
      }
    ]
  }
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `success`：【boolean】请求是否成功
- `data`：【object】响应数据


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
