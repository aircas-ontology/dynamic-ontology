# 接口名称

- 根据实体 id 和存储分组分页查询属性行（只查指定分组，返回该组当前页与总行数）

## 编译位置

apis 与 types 文件名自行语义化命名

- apis：`src/apis/`（现有：`ontologyEntityApi.ts` → `postGetOntologyEntityRowDetailPageInterface`）
- types：`src/types/apis/`（现有：`getOntologyEntityRowDetailPageType.ts`）
- mocks：`src/mocks/`（如需）

## 接口描述

- 按实体主键与属性存储分组分页查询分组属性行；仅查询指定 `storageGroup`，返回该分组当前页记录与总行数。
- `storageGroup` 需与 `row_detail` 返回的 `propertyGroups[].storageGroup` 一致。
- 在线文档相关模型：`EntityPropertyRowPageQueryParam`、`RestResultPagePropertyGroupData`、`PagePropertyGroupData`、`PropertyGroupData`、`PropertyInfo`、`OrderItem`。
- OpenAPI 路径为 `/entity/row_detail/page`，服务前缀为 `/ontology`。项目请求路径使用加前缀后的完整路径。
- 请求体为 JSON 对象，无 query / path 参数。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/entity/row_detail/page`

## 请求方式

- POST

## 输入参数

- 无 query / path 请求参数。
- 请求体为 `EntityPropertyRowPageQueryParam`：

| 字段名                     | 位置 | 类型            | 必填 | 说明                                                                          |
| -------------------------- | ---- | --------------- | ---- | ----------------------------------------------------------------------------- |
| `ontologyUniqueIdentifier` | body | string          | 否   | 对象 id                                                                       |
| `entityPrimaryKey`         | body | unknown         | 是   | 实体主键值                                                                    |
| `sort`                     | body | string          | 是   | 排序规则：`ASC` / `DESC`                                                      |
| `storageGroup`             | body | string          | 是   | 属性存储分组名称，与 `row_detail` 返回的 `propertyGroups[].storageGroup` 一致 |
| `pageNum`                  | body | integer / int32 | 否   | 分页号，默认 `1`                                                              |
| `pageSize`                 | body | integer / int32 | 否   | 每页条数，默认 `10`                                                           |

说明：OpenAPI 将 `entityPrimaryKey` 标为 `unknown`；实测样例为整数。前端契约保持原始类型，勿强转丢失 `0`。

请求示例：

```http
POST /ontology/entity/row_detail/page
Content-Type: application/json
```

```json
{
  "entityPrimaryKey": 4,
  "sort": "DESC",
  "storageGroup": "weapon",
  "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
  "pageNum": 1,
  "pageSize": 10
}
```

## 输出参数

在线文档响应模型为 `RestResultPagePropertyGroupData`。该操作声明 HTTP `200`。下面取值来自实测样例；OpenAPI Schema 与实测字段存在差异时，对接以实测为准。

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "current": 1,
    "pages": 1,
    "records": [
      {
        "dataPrimaryKey": 9,
        "props": [
          {
            "categoryId": 709,
            "propertyApiName": "w_count",
            "propertyDisplayName": "挂载数量",
            "propertyUniqIdentifier": "06eb8a07b9f248c6b32963deb4cfbb54",
            "propertyValue": 2
          },
          {
            "categoryId": 709,
            "propertyApiName": "w_name",
            "propertyDisplayName": "武器名称",
            "propertyUniqIdentifier": "2a5886db0f664be3b86ff89a085363fe",
            "propertyValue": "鹰击-100"
          },
          {
            "categoryId": 709,
            "propertyApiName": "w_range",
            "propertyDisplayName": "武器射程",
            "propertyUniqIdentifier": "6e0f9bde6afb4d0b8d1e3abddbf4b57b",
            "propertyValue": 110.0
          },
          {
            "categoryId": 709,
            "propertyApiName": "w_type",
            "propertyDisplayName": "武器类型",
            "propertyUniqIdentifier": "7bc448386a3b4bc7a9b9d4db3a274e59",
            "propertyValue": "空地导弹"
          }
        ]
      },
      {
        "dataPrimaryKey": 8,
        "props": [
          {
            "categoryId": 709,
            "propertyApiName": "w_count",
            "propertyDisplayName": "挂载数量",
            "propertyUniqIdentifier": "06eb8a07b9f248c6b32963deb4cfbb54",
            "propertyValue": 6
          },
          {
            "categoryId": 709,
            "propertyApiName": "w_name",
            "propertyDisplayName": "武器名称",
            "propertyUniqIdentifier": "2a5886db0f664be3b86ff89a085363fe",
            "propertyValue": ""
          },
          {
            "categoryId": 709,
            "propertyApiName": "w_range",
            "propertyDisplayName": "武器射程",
            "propertyUniqIdentifier": "6e0f9bde6afb4d0b8d1e3abddbf4b57b",
            "propertyValue": 200.0
          },
          {
            "categoryId": 709,
            "propertyApiName": "w_type",
            "propertyDisplayName": "武器类型",
            "propertyUniqIdentifier": "7bc448386a3b4bc7a9b9d4db3a274e59",
            "propertyValue": "空空导弹"
          }
        ]
      }
    ],
    "size": 10,
    "total": 2
  }
}
```

顶层字段（`RestResultPagePropertyGroupData`）：

| 字段名    | 类型                  | 必填 | 说明     |
| --------- | --------------------- | ---- | -------- |
| `code`    | integer / int32       | 否   | 响应码   |
| `message` | string                | 否   | 消息描述 |
| `data`    | PagePropertyGroupData | 否   | 分页数据 |

`data`（`PagePropertyGroupData`）：

| 字段名    | 类型                | 必填 | 说明                                            |
| --------- | ------------------- | ---- | ----------------------------------------------- |
| `records` | PropertyGroupData[] | 否   | 当前页属性行列表                                |
| `total`   | integer / int64     | 否   | 总行数                                          |
| `size`    | integer / int64     | 否   | 每页条数                                        |
| `current` | integer / int64     | 否   | 当前页号                                        |
| `pages`   | integer / int64     | 否   | 总页数；实测样例有此字段，OpenAPI Schema 未列出 |

`records[]` 项（`PropertyGroupData`）：

| 字段名           | 类型           | 必填 | 说明     |
| ---------------- | -------------- | ---- | -------- |
| `dataPrimaryKey` | unknown        | 否   | 数据主键 |
| `props`          | PropertyInfo[] | 否   | 属性信息 |

`props[]` 项（`PropertyInfo`，以实测样例为准）：

| 字段名                   | 类型            | 必填 | 说明                                                                 |
| ------------------------ | --------------- | ---- | -------------------------------------------------------------------- |
| `propertyApiName`        | string          | 是   | 属性 api 名称                                                        |
| `propertyValue`          | unknown         | 是   | 属性值；OpenAPI Schema 写为 `propertyValues`，实测为 `propertyValue` |
| `propertyDisplayName`    | string          | 否   | 属性展示名称；OpenAPI Schema 未列出，实测有此字段                    |
| `propertyUniqIdentifier` | string          | 否   | 属性唯一标识；OpenAPI Schema 未列出，实测有此字段                    |
| `categoryId`             | integer / int64 | 否   | 属性分类 id；OpenAPI Schema 未列出，实测有此字段                     |

## 前端调用说明

- 必须传 `entityPrimaryKey`、`sort`、`storageGroup`；`pageNum` / `pageSize` 可省略，默认分别为 `1` / `10`。
- `entityPrimaryKey`、`dataPrimaryKey`、`propertyValue` 保持后端原始类型。
- 成功时按 `response.code === 200` 处理；用 `data.records` 渲染当前页行，用 `data.total` 做分页。
- 现有实现可复用 `postGetOntologyEntityRowDetailPageInterface` 与 `GetOntologyEntityRowDetailPageParams` / `GetOntologyEntityRowDetailPageData`。
