# 接口名称

- 根据本体空间和数据源表名查询字段信息

## 接口描述

- 查询指定本体空间下某一数据源表的字段（列）列表，返回字段名、数据类型、描述及是否主键。
- 对应后端 `OntologyDatasourceController#getColumns`。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/datasource/column`

## 请求方式

- GET

## 输入参数

- Query 参数，通过 URL 查询串传递。

| 参数名       | 类型            | 必填 | 默认值 | 说明                                         |
| ------------ | --------------- | ---- | ------ | -------------------------------------------- |
| spaceId      | integer / int32 | 是   | -      | 本体空间 id                                  |
| dataSourceId | string          | 是   | -      | 数据源表名，使用数据源列表返回的 `tableName` |

请求示例：

```text
GET /ontology/datasource/column?spaceId=11&dataSourceId=text_001.123
```

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": [
    {
      "columnName": "id",
      "description": "主键",
      "type": "BIGINT",
      "isPrimaryKey": true
    },
    {
      "columnName": "name",
      "description": "名称",
      "type": "VARCHAR(255)",
      "isPrimaryKey": false
    }
  ]
}
```

顶层字段：

| 字段    | 类型     | 说明     |
| ------- | -------- | -------- |
| code    | int32    | 响应码   |
| message | string   | 消息描述 |
| data    | object[] | 字段列表 |

`data[]` 字段（`TableColumnDescVO`，表描述信息 VO）：

| 字段         | 类型    | 说明       | 示例     |
| ------------ | ------- | ---------- | -------- |
| columnName   | string  | 列名       | `id`     |
| description  | string  | 列描述信息 | `主键`   |
| type         | string  | 列数据类型 | `BIGINT` |
| isPrimaryKey | boolean | 是否为主键 | `true`   |

## code

- `200`：请求成功。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/getOntologyDatasourceColumnsType.ts`

```ts
/** 数据源表字段（列）描述 VO。 */
export interface OntologyDatasourceColumnDescVO {
  /** 列名。 */
  columnName: string;
  /** 列描述信息。 */
  description: string;
  /** 列数据类型。 */
  type: string;
  /** 是否为主键。 */
  isPrimaryKey: boolean;
}

/** 查询数据源表字段列表的响应 data。 */
export type GetOntologyDatasourceColumnsData = OntologyDatasourceColumnDescVO[];

/** 查询数据源表字段列表的查询参数。 */
export interface GetOntologyDatasourceColumnsParams {
  /** 本体空间 id，必填。 */
  spaceId: number;
  /** 数据源表名，使用数据源列表返回的 tableName，必填。 */
  dataSourceId: string;
}
```

并在 `src/types/index.ts` 中按字典序统一导出：

```ts
export type {
  GetOntologyDatasourceColumnsData,
  GetOntologyDatasourceColumnsParams,
  OntologyDatasourceColumnDescVO,
} from "./apis/getOntologyDatasourceColumnsType";
```

## apis 示例

文件：`src/apis/ontologyDatasourceApi.ts`

```ts
import type { ApiResponse, GetOntologyDatasourceColumnsData, GetOntologyDatasourceColumnsParams } from "@/types";
import { requestTimeoutMs } from "@/utils/constants";
import { request } from "@/utils/request";

/**
 * @description 根据本体空间和数据源表名查询字段（列）列表。
 *
 * 请求方式：GET `/ontology/datasource/column`
 *
 * @param params 查询参数。
 * @param params.spaceId 本体空间 id，必填。
 * @param params.dataSourceId 数据源表名，使用数据源列表返回的 tableName，必填。
 * @returns 标准 API 响应，data 为字段描述数组。
 */
export function getOntologyDatasourceColumnsInterface(params: GetOntologyDatasourceColumnsParams): Promise<ApiResponse<GetOntologyDatasourceColumnsData>> {
  return request<GetOntologyDatasourceColumnsData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/datasource/column",
    method: "get",
    params,
    timeout: requestTimeoutMs,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { getOntologyDatasourceColumnsInterface } from "./ontologyDatasourceApi";

export { getOntologyDatasourceColumnsInterface };
```

## mocks 示例

文件：`src/mocks/getOntologyDatasourceColumnsMock/getOntologyDatasourceColumnsMock.ts`

```ts
import type { ApiResponse, GetOntologyDatasourceColumnsData } from "@/types";

export const getOntologyDatasourceColumnsMock: ApiResponse<GetOntologyDatasourceColumnsData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: [
    {
      columnName: "id",
      description: "主键",
      type: "BIGINT",
      isPrimaryKey: true,
    },
    {
      columnName: "name",
      description: "名称",
      type: "VARCHAR(255)",
      isPrimaryKey: false,
    },
    {
      columnName: "description",
      description: "描述",
      type: "TEXT",
      isPrimaryKey: false,
    },
  ],
};
```
