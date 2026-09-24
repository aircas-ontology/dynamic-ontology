# 接口名称

- 查询本体空间资源统计

## 接口描述

- 查询指定本体空间下的资源数量统计，包括对象（本体）、关系、函数算子、行为及行为调度数量。
- 对应后端 `OntologySpaceController#getStatistic`。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/space/statistic`

## 请求方式

- GET

## 输入参数

- Query 参数，通过 URL 查询串传递。

| 参数名  | 类型            | 必填 | 默认值 | 说明        |
| ------- | --------------- | ---- | ------ | ----------- |
| spaceId | integer / int32 | 是   | -      | 本体空间 id |

请求示例：

```text
GET /ontology/space/statistic?spaceId=11
```

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "spaceId": 11,
    "ontologyCount": 23,
    "linkCount": 8,
    "functionCount": 5,
    "actionCount": 12,
    "actionSchedulingCount": 3
  }
}
```

顶层字段：

| 字段    | 类型                     | 说明     |
| ------- | ------------------------ | -------- |
| code    | integer / int32          | 响应码   |
| message | string                   | 消息描述 |
| data    | OntologySpaceStatisticVO | 统计数据 |

`data` 字段（`OntologySpaceStatisticVO`，本体空间资源统计）：

| 字段                  | 类型            | 说明                      | 示例 |
| --------------------- | --------------- | ------------------------- | ---- |
| spaceId               | integer / int32 | 本体空间 id               | 11   |
| ontologyCount         | integer / int32 | 对象（本体）数量          | 23   |
| linkCount             | integer / int32 | 关系数量                  | 8    |
| functionCount         | integer / int32 | 函数算子数量              | 5    |
| actionCount           | integer / int32 | 行为数量                  | 12   |
| actionSchedulingCount | integer / int32 | 行为调度数量（规则+任务） | 3    |

## code

- `200`：请求成功。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/getOntologySpaceStatisticType.ts`

```ts
/** 本体空间资源统计 VO。 */
export interface OntologySpaceStatisticVO {
  /** 本体空间 id。 */
  spaceId: number;
  /** 对象（本体）数量。 */
  ontologyCount: number;
  /** 关系数量。 */
  linkCount: number;
  /** 函数算子数量。 */
  functionCount: number;
  /** 行为数量。 */
  actionCount: number;
  /** 行为调度数量（规则+任务）。 */
  actionSchedulingCount: number;
}

/** 查询本体空间资源统计的响应 data。 */
export type GetOntologySpaceStatisticData = OntologySpaceStatisticVO;

/** 查询本体空间资源统计的查询参数。 */
export interface GetOntologySpaceStatisticParams {
  /** 本体空间 id，必填。 */
  spaceId: number;
}
```

并在 `src/types/index.ts` 中按字典序统一导出：

```ts
export type { GetOntologySpaceStatisticData, GetOntologySpaceStatisticParams, OntologySpaceStatisticVO } from "./apis/getOntologySpaceStatisticType";
```

## apis 示例

文件：`src/apis/ontologyManageApi.ts`

```ts
import type { ApiResponse, GetOntologySpaceStatisticData, GetOntologySpaceStatisticParams } from "@/types";
import { request } from "@/utils/request";

/**
 * @description 查询指定本体空间下的资源数量统计。
 *
 * 请求方式：GET `/ontology/space/statistic`
 *
 * @param params 查询参数。
 * @param params.spaceId 本体空间 id，必填。
 * @returns 标准 API 响应，data 为本体空间资源统计对象。
 */
export function getOntologySpaceStatisticInterface(params: GetOntologySpaceStatisticParams): Promise<ApiResponse<GetOntologySpaceStatisticData>> {
  return request<GetOntologySpaceStatisticData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space/statistic",
    method: "get",
    params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { getOntologySpaceStatisticInterface } from "./ontologyManageApi";

export { getOntologySpaceStatisticInterface };
```

## mocks 示例

文件：`src/mocks/getOntologySpaceStatisticMock/getOntologySpaceStatisticMock.ts`

```ts
import type { ApiResponse, GetOntologySpaceStatisticData } from "@/types";

export const getOntologySpaceStatisticMock: ApiResponse<GetOntologySpaceStatisticData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    spaceId: 11,
    ontologyCount: 23,
    linkCount: 8,
    functionCount: 5,
    actionCount: 12,
    actionSchedulingCount: 3,
  },
};
```
