# 接口名称

- 查询对象分类体系树

## 编译位置

文件名自行语义化命名

- apis：`src/apis/`
- mocks：`src/mocks/`
- types：`src/types/apis/`

## 接口描述

- 查询对象分类体系树

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology/category/tree`

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
        "name": "平台",
        "ontologyMetaInfos": [
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
                "entityCount": 3,
                "relationCount": 2,
                "propertyCount": 7,
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
                "entityCount": 2,
                "relationCount": 2,
                "propertyCount": 1,
                "actionCount": 0
            },
            {
                "uniqueIdentifier": "d7749eaded274a8f98fa0ac78032d3d0",
                "createTime": "2026-09-17 18:43:49",
                "updateTime": "2026-09-17 18:43:49",
                "latestQueryTime": "2026-09-17 18:43:49",
                "displayName": "舰船2",
                "description": "我方舰船",
                "apiName": "ship2",
                "metaGroupId": [],
                "spaceId": 1,
                "ontologyCategoryId": 1,
                "parentOntologyUniqueIdentifier": "d3e1b0c27f29452eb7cadd1f51eac535",
                "parentOntologyDisplayName": "舰船",
                "entityCount": 0,
                "relationCount": 1,
                "propertyCount": 0,
                "actionCount": 0
            },
            {
                "uniqueIdentifier": "cf4e612b5d80424c865cbce3c31699cc",
                "createTime": "2026-09-21 15:03:04",
                "updateTime": "2026-09-21 15:03:04",
                "latestQueryTime": "2026-09-21 15:03:04",
                "displayName": "海玛斯目标",
                "description": "海玛斯目标对象，记录目标的识别与基本信息",
                "apiName": "hms_target",
                "metaGroupId": [],
                "spaceId": 1,
                "ontologyCategoryId": 1,
                "entityCount": 0,
                "relationCount": 0,
                "propertyCount": 0,
                "actionCount": 0
            },
            {
                "uniqueIdentifier": "7674c7fa5b1d4ade94206f26b7d416a6",
                "createTime": "2026-10-22 21:31:06",
                "updateTime": "2026-10-22 21:31:06",
                "latestQueryTime": "2026-10-22 21:31:06",
                "displayName": "海马斯",
                "description": "海马斯",
                "apiName": "hiamsi",
                "metaGroupId": [],
                "spaceId": 1,
                "ontologyCategoryId": 1,
                "entityCount": 0,
                "relationCount": 0,
                "propertyCount": 2,
                "actionCount": 0
            },
            {
                "uniqueIdentifier": "69752f8cc0e94090a20c3780f2372393",
                "createTime": "2026-10-26 10:41:38",
                "updateTime": "2026-10-26 10:41:38",
                "latestQueryTime": "2026-10-26 10:41:38",
                "displayName": "飞机1",
                "description": "这是一架我方战斗机",
                "apiName": "airplane1",
                "metaGroupId": [],
                "spaceId": 1,
                "ontologyCategoryId": 1,
                "entityCount": 2,
                "relationCount": 1,
                "propertyCount": 7,
                "actionCount": 0
            },
            {
                "uniqueIdentifier": "2e4ef43ea91a40d595bf6cbc482c1e6a",
                "createTime": "2026-10-26 10:48:50",
                "updateTime": "2026-10-26 10:48:50",
                "latestQueryTime": "2026-10-26 10:48:50",
                "displayName": "飞机2",
                "description": "这是一架我方战斗机",
                "apiName": "airplane2",
                "metaGroupId": [],
                "spaceId": 1,
                "ontologyCategoryId": 1,
                "entityCount": 0,
                "relationCount": 0,
                "propertyCount": 7,
                "actionCount": 0
            },
            {
                "uniqueIdentifier": "f33c330717d2454eaa4ebf27379f4372",
                "createTime": "2026-10-26 10:50:11",
                "updateTime": "2026-10-26 10:50:11",
                "latestQueryTime": "2026-10-26 10:50:11",
                "displayName": "飞机3",
                "description": "这是一架我方战斗机",
                "apiName": "airplane3",
                "metaGroupId": [],
                "spaceId": 1,
                "ontologyCategoryId": 1,
                "entityCount": 0,
                "relationCount": 1,
                "propertyCount": 7,
                "actionCount": 0
            },
            {
                "uniqueIdentifier": "31b44104f6bc4ee7924fce5589c9369b",
                "createTime": "2026-10-26 10:51:35",
                "updateTime": "2026-10-26 10:51:35",
                "latestQueryTime": "2026-10-26 10:51:35",
                "displayName": "飞机4",
                "description": "这是一架我方战斗机",
                "apiName": "airplane4",
                "metaGroupId": [],
                "spaceId": 1,
                "ontologyCategoryId": 1,
                "entityCount": 1,
                "relationCount": 0,
                "propertyCount": 7,
                "actionCount": 0
            }
        ],
        "children": [
            {
                "categoryId": 2,
                "name": "航空母舰",
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
                        "ontologyCategoryId": 2,
                        "entityCount": 0,
                        "relationCount": 0,
                        "propertyCount": 0,
                        "actionCount": 0
                    },
                    {
                        "uniqueIdentifier": "44424b0a888e4c5ebf2f4fd0854d6182",
                        "createTime": "2026-09-20 18:30:24",
                        "updateTime": "2026-09-20 18:30:24",
                        "latestQueryTime": "2026-09-20 18:30:24",
                        "displayName": "辽宁号",
                        "description": "辽宁号描述",
                        "apiName": "liao",
                        "metaGroupId": [],
                        "spaceId": 1,
                        "ontologyCategoryId": 2,
                        "entityCount": 0,
                        "relationCount": 7,
                        "propertyCount": 0,
                        "actionCount": 0
                    }
                ],
                "children": [
                    {
                        "categoryId": 3,
                        "name": "航空母舰"
                    }
                ]
            },
            {
                "categoryId": 5,
                "name": "舰船分类",
                "children": [
                    {
                        "categoryId": 6,
                        "name": "水面舰艇",
                        "children": [
                            {
                                "categoryId": 9,
                                "name": "航空母舰"
                            },
                            {
                                "categoryId": 10,
                                "name": "驱逐舰"
                            },
                            {
                                "categoryId": 11,
                                "name": "护卫舰",
                                "children": [
                                    {
                                        "categoryId": 17,
                                        "name": "舰船分类11"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "categoryId": 7,
                        "name": "潜艇",
                        "children": [
                            {
                                "categoryId": 12,
                                "name": "常规动力潜艇"
                            },
                            {
                                "categoryId": 13,
                                "name": "核动力潜艇"
                            }
                        ]
                    },
                    {
                        "categoryId": 8,
                        "name": "辅助舰艇",
                        "children": [
                            {
                                "categoryId": 14,
                                "name": "补给舰"
                            },
                            {
                                "categoryId": 15,
                                "name": "医疗船"
                            }
                        ]
                    }
                ]
            },
            {
                "categoryId": 16,
                "name": "舰船分类1"
            },
            {
                "categoryId": 619,
                "name": "new"
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
 * 根据关键词分页查询对象数据。
 *
 * 请求方式：GET `/ontology/search`
 *
 * @param params 查询参数。
 * @param params.keyword 可选的对象名称或描述关键词。
 * @param params.page 当前页码，从 1 开始。
 * @param params.pageSize 每页返回的数据条数。
 * @returns 标准 API 响应，包含当前页对象列表和数据总数。
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
        description: "用于描述卫星及其关联资源的对象。",
      },
    ],
    total: 1,
  },
};
```
