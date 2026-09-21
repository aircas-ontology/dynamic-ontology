# 接口名称

- 搜索查询本体空间下数据源列表

## 接口描述

- 分页搜索指定本体空间下的数据源（数据表）列表，支持按关键字模糊查询。
- 对应后端 `OntologyDatasourceController#getTables`。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/datasource/table`

## 请求方式

- GET

## 输入参数

- Query 参数，通过 URL 查询串传递。

| 字段     | 类型            | 必填 | 默认值 | 说明                |
| -------- | --------------- | ---- | ------ | ------------------- |
| spaceId  | integer / int32 | 是   | -      | 本体空间 id         |
| keyword  | string          | 否   | `""`   | 搜索关键字          |
| pageNum  | integer / int32 | 否   | `1`    | 当前页码，从 1 开始 |
| pageSize | integer / int32 | 否   | `1000` | 每页条数            |

请求示例：

```text
GET /ontology/datasource/table?spaceId=1&keyword=&pageNum=1&pageSize=1000
```

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "records": [
      {
        "schemaName": "public",
        "tableName": "xtmb",
        "description": "系统目标"
      }
    ],
    "total": 1,
    "size": 1000,
    "current": 1,
    "pages": 1
  }
}
```

顶层字段：

| 字段    | 类型                  | 说明     |
| ------- | --------------------- | -------- |
| code    | integer / int32       | 响应码   |
| message | string                | 消息描述 |
| data    | PageDatasourceTableVO | 分页数据 |

`data` 字段：

| 字段    | 类型                | 说明                                 |
| ------- | ------------------- | ------------------------------------ |
| records | DatasourceTableVO[] | 当前页数据源记录列表                 |
| total   | integer / int64     | 总记录数                             |
| size    | integer / int64     | 每页条数                             |
| current | integer / int64     | 当前页码                             |
| pages   | integer / int64     | 总页数（后端标记废弃，前端不应依赖） |

`data.records[]` 字段（`DatasourceTableVO`，数据源 VO）：

| 字段        | 类型   | 说明        | 示例       |
| ----------- | ------ | ----------- | ---------- |
| schemaName  | string | schema 名称 | `public`   |
| tableName   | string | 数据源标识  | `xtmb`     |
| description | string | 数据源描述  | `系统目标` |

## code

- `200`：请求成功。
- `400`：请求参数错误。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/getOntologyDatasourceTablesType.ts`

```ts
/** 数据源表视图对象。 */
export interface OntologyDatasourceTableVO {
  /** schema 名称。 */
  schemaName: string;
  /** 数据源标识。 */
  tableName: string;
  /** 数据源描述。 */
  description: string;
}

/** 数据源表分页结果。 */
export interface GetOntologyDatasourceTablesData {
  /** 当前页数据源记录列表。 */
  records: OntologyDatasourceTableVO[];
  /** 总记录数。 */
  total: number;
  /** 每页条数。 */
  size: number;
  /** 当前页码。 */
  current: number;
}

/** 查询本体空间下数据源列表的查询参数。 */
export interface GetOntologyDatasourceTablesParams {
  /** 本体空间 id。 */
  spaceId: number;
  /** 搜索关键字，默认空字符串。 */
  keyword?: string;
  /** 当前页码，默认 1。 */
  pageNum?: number;
  /** 每页条数，默认 1000。 */
  pageSize?: number;
}
```

并在 `src/types/index.ts` 中按字典序统一导出：

```ts
export type { GetOntologyDatasourceTablesData, GetOntologyDatasourceTablesParams, OntologyDatasourceTableVO } from "./apis/getOntologyDatasourceTablesType";
```

## apis 示例

文件：`src/apis/ontologyDatasourceApi.ts`

```ts
import type { ApiResponse, GetOntologyDatasourceTablesData, GetOntologyDatasourceTablesParams } from "@/types";
import { requestTimeoutMs } from "@/utils/constants";
import { request } from "@/utils/request";

/**
 * @description 搜索查询本体空间下数据源（数据表）列表，支持关键字模糊搜索与分页。
 *
 * 请求方式：GET `/ontology/datasource/table`
 *
 * @param params 查询参数。
 * @param params.spaceId 本体空间 id，必填。
 * @param params.keyword 搜索关键字，可选，默认空字符串。
 * @param params.pageNum 当前页码，可选，默认 1。
 * @param params.pageSize 每页条数，可选，默认 1000。
 * @returns 标准 API 响应，data 为数据源表分页结果。
 */
export function getOntologyDatasourceTablesInterface(params: GetOntologyDatasourceTablesParams): Promise<ApiResponse<GetOntologyDatasourceTablesData>> {
  return request<GetOntologyDatasourceTablesData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/table",
    method: "get",
    params,
    timeout: requestTimeoutMs,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { getOntologyDatasourceTablesInterface } from "./ontologyDatasourceApi";

export { getOntologyDatasourceTablesInterface };
```

## mocks 示例

文件：`src/mocks/getOntologyDatasourceTablesMock/getOntologyDatasourceTablesMock.ts`

```ts
import type { ApiResponse, GetOntologyDatasourceTablesData } from "@/types";

export const getOntologyDatasourceTablesMock: ApiResponse<GetOntologyDatasourceTablesData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    records: [
      {
        schemaName: "public",
        tableName: "xtmb",
        description: "系统目标",
      },
    ],
    total: 1,
    size: 1000,
    current: 1,
  },
};
```
