# 接口名称

- 查询实例 URL（`spaceId` 必填；`objectId` / `instanceId` 不传则查该空间下全部，按存入时间倒序）

## 编译位置

apis 与 types 文件名自行语义化命名

- apis：`src/apis/`
- types：`src/types/apis/`

## 接口描述

- 按对象空间查询实例 URL 列表；`spaceId` 必填。
- 不传 `objectId` / `instanceId` 时返回该空间下全部记录，按存入时间倒序。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/instance/url/list`

## 请求方式

- GET

## 输入参数

- 请求通过 `query` 传递参数：

| 字段名       | 位置  | 类型            | 必填 | 说明                               |
| ------------ | ----- | --------------- | ---- | ---------------------------------- |
| `spaceId`    | query | Integer / int32 | 是   | 对象空间 id                        |
| `objectId`   | query | String          | 否   | 对象唯一值ontologyUniqueIdentifier |
| `instanceId` | query | String          | 否   | 实例 id                            |

- 示例：

```http
GET /ontology/instance/url/list?spaceId=156&objectId=ea512d439cd34c6ebbcde6b692261ab5&instanceId=1
```

```http
GET /ontology/instance/url/list?spaceId=156
```

## 输出参数

- 响应包装与 `data`（`List<OntologyInstanceUrlVO>`）：

| 字段名    | 类型                          | 必填 | 说明          |
| --------- | ----------------------------- | ---- | ------------- |
| `code`    | Integer / int32               | 否   | 响应码        |
| `message` | String                        | 否   | 消息描述      |
| `data`    | List\<OntologyInstanceUrlVO\> | 否   | 实例 URL 列表 |

**OntologyInstanceUrlVO**：

| 字段名       | 类型               | 必填 | 说明                                       |
| ------------ | ------------------ | ---- | ------------------------------------------ |
| `id`         | Integer / int64    | 否   | 主键 id                                    |
| `spaceId`    | Integer / int32    | 否   | 所属对象空间 id                            |
| `objectId`   | String             | 否   | 对象唯一值（`ontologyUniqueIdentifier`）   |
| `instanceId` | String             | 否   | 实例 id（实例主键值）                      |
| `url`        | String             | 否   | 实例对应的 URL                             |
| `createTime` | String / date-time | 否   | 存入时间；同一实例再次提交后为本次写入时间 |

- 示例：

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": [
    {
      "id": 1,
      "spaceId": 156,
      "objectId": "ea512d439cd34c6ebbcde6b692261ab5",
      "instanceId": "1",
      "url": "https://example.com/instance/1",
      "createTime": "2026-11-12T03:00:00"
    }
  ]
}
```

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`SUCCESS` 或业务成功文案
- 失败时返回具体错误信息

## types 示例

文件：`src/types/apis/` 下自行语义化命名（例如 `getOntologyInstanceUrlListType.ts`）

```ts
/** 查询实例 URL 请求参数。 */
export interface GetOntologyInstanceUrlListParams {
  /** 对象空间 id。 */
  spaceId: number;
  /** 对象 id（ontology_meta.unique_identifier）。 */
  objectId?: string;
  /** 实例 id。 */
  instanceId?: string;
}

/** 实例 URL 记录。 */
export interface OntologyInstanceUrlItem {
  /** 主键 id。 */
  id?: number;
  /** 所属对象空间 id。 */
  spaceId?: number;
  /** 对象 id。 */
  objectId?: string;
  /** 实例 id（实例主键值）。 */
  instanceId?: string;
  /** 实例对应的 URL。 */
  url?: string;
  /** 存入时间。 */
  createTime?: string;
}

/** 查询实例 URL 响应 data。 */
export type GetOntologyInstanceUrlListData = OntologyInstanceUrlItem[];
```

## apis 示例

文件：`src/apis/` 下自行语义化命名

```ts
import { get } from "@/utils/request";
import type { ApiResponse, GetOntologyInstanceUrlListData, GetOntologyInstanceUrlListParams } from "@/types";

/**
 * @description 查询实例 URL 列表。
 * @param params 查询参数。
 * @returns 接口响应。
 */
export function getOntologyInstanceUrlListInterface(params: GetOntologyInstanceUrlListParams): Promise<ApiResponse<GetOntologyInstanceUrlListData>> {
  return get(`${DOMAIN_CONFIG.ONTOLOGYMANAGE_URL}/ontology/instance/url/list`, { params });
}
```

## 注意

- `spaceId` 必填；`objectId`、`instanceId` 均可选。
- 不传 `objectId` / `instanceId` 时查询该空间下全部实例 URL，结果按存入时间倒序。
- Swagger Schema 中 `data` 下的 `items` 表示数组元素类型 `OntologyInstanceUrlVO`，不是业务字段名。
