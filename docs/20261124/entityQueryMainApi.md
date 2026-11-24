# 接口名称

- 根据多个对象下多个实体 id 查询实体主属性信息

## 编译位置

apis 与 types 文件名自行语义化命名

- apis：`src/apis/`
- types：`src/types/apis/`
- mocks：`src/mocks/`（如需）

## 接口描述

- 按多个对象唯一标识及各自实体主键列表，批量查询实体主属性信息。
- 在线文档相关模型：`EntityIdsQueryParam`、`RestResultListEntityIdsQueryVO`、`EntityIdsQueryVO`、`EntityInfoVO`、`EntityPropertyVO`。
- OpenAPI 路径为 `/entity/query`，服务前缀为 `/ontology`。项目请求路径使用加前缀后的完整路径。
- 请求体为 JSON 数组，无 query / path 参数。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/entity/query`

## 请求方式

- POST

## 输入参数

- 无 query / path 请求参数。
- 请求体为 `EntityIdsQueryParam[]`：

| 字段名                     | 位置 | 类型      | 必填 | 说明           |
| -------------------------- | ---- | --------- | ---- | -------------- |
| （根）                     | body | array     | 否   | 批量查询项列表 |
| `ontologyUniqueIdentifier` | body | string    | 否   | 对象 id        |
| `entityPrimaryKeys`        | body | unknown[] | 否   | 实体主键值列表 |

说明：OpenAPI 将 `entityPrimaryKeys` 元素标为 `unknown`；实测样例为整数。前端契约可用 `unknown` / `string | number` 接收原始值，勿强转丢失 `0`。

请求示例：

```http
POST /ontology/entity/query
Content-Type: application/json
```

```json
[
  {
    "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
    "entityPrimaryKeys": [4]
  }
]
```

## 输出参数

在线文档响应模型为 `RestResultListEntityIdsQueryVO`。该操作声明 HTTP `200`。`code`、`message`、`data` 及嵌套属性均未标记 required。下面取值来自实测样例，仅说明字段结构。

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": [
    {
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "entityList": [
        {
          "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
          "ontologyName": "飞机",
          "primaryKey": 4,
          "displayName": "qxh-test",
          "properties": [
            {
              "propertyApiName": "delivery_date",
              "propertyDisplayName": "首飞交付日",
              "propertyValue": "2017-03-08T16:00:00.000Z"
            },
            {
              "propertyApiName": "id",
              "propertyDisplayName": "标识1",
              "propertyValue": 4
            },
            {
              "propertyApiName": "is_stealth",
              "propertyDisplayName": "是否隐身",
              "propertyValue": true
            },
            {
              "propertyApiName": "last_sortie",
              "propertyDisplayName": "最近出动时间",
              "propertyValue": "2026-10-25T08:40:00.000Z"
            },
            {
              "propertyApiName": "max_mach",
              "propertyDisplayName": "最大速度",
              "propertyValue": 10.0
            },
            {
              "propertyApiName": "name",
              "propertyDisplayName": "飞机名称",
              "propertyValue": "qxh-test"
            },
            {
              "propertyApiName": "radius",
              "propertyDisplayName": "作战半径",
              "propertyValue": 1800.0
            },
            {
              "propertyApiName": "unit_cost",
              "propertyDisplayName": "单价",
              "propertyValue": 1
            }
          ]
        }
      ]
    }
  ]
}
```

顶层字段（`RestResultListEntityIdsQueryVO`）：

| 字段名    | 类型               | 必填 | 说明     |
| --------- | ------------------ | ---- | -------- |
| `code`    | integer / int32    | 否   | 响应码   |
| `message` | string             | 否   | 消息描述 |
| `data`    | EntityIdsQueryVO[] | 否   | 查询结果 |

`data[]` 项（`EntityIdsQueryVO`）：

| 字段名                     | 类型           | 必填 | 说明             |
| -------------------------- | -------------- | ---- | ---------------- |
| `ontologyUniqueIdentifier` | string         | 否   | 对象唯一标识     |
| `entityList`               | EntityInfoVO[] | 否   | 实体属性信息列表 |

`entityList[]` 项（`EntityInfoVO`）：

| 字段名                     | 类型               | 必填 | 说明         |
| -------------------------- | ------------------ | ---- | ------------ |
| `ontologyUniqueIdentifier` | string             | 否   | 对象 id      |
| `ontologyName`             | string             | 否   | 对象名称     |
| `primaryKey`               | unknown            | 否   | 实体主键 id  |
| `displayName`              | string             | 否   | 实体显示名称 |
| `properties`               | EntityPropertyVO[] | 否   | 实体属性值   |

`properties[]` 项（`EntityPropertyVO`）：

| 字段名                | 类型    | 必填 | 说明                                                                                           |
| --------------------- | ------- | ---- | ---------------------------------------------------------------------------------------------- |
| `propertyApiName`     | string  | 否   | 属性 api 名称                                                                                  |
| `propertyDisplayName` | string  | 否   | 属性展示名称；实测样例字段名。OpenAPI Schema 写为 `propertyName`，对接时以实测为准，可兼容二者 |
| `propertyValue`       | unknown | 否   | 属性值；可为 string / number / boolean 等                                                      |

## 前端调用说明

- 请求体为数组，可一次传入多个对象及其实体主键列表。
- `entityPrimaryKeys`、`primaryKey`、`propertyValue` 保持后端原始类型，不要一律转字符串。
- 成功时按 `response.code === 200` 处理；`data` 按对象分组，再展开 `entityList` / `properties`。
