# 接口名称

- 根据实体 id 和存储分组分页查询属性行（只查指定分组，返回该组当前页与总行数）

## 编译位置

apis 与 types 文件名自行语义化命名

- apis：`src/apis/`
- types：`src/types/apis/`

## 接口描述

- 按实体主键与属性存储分组分页查询该分组下的属性行数据；只查询指定 `storageGroup`，返回该组当前页记录与总行数。
- 相关模型：`EntityPropertyRowPageQueryParam`、`RestResultPagePropertyGroupData`、`PagePropertyGroupData`、`PropertyGroupData`、`PropertyInfo`、`OrderItem`。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/entity/row_detail/page`

## 请求方式

- POST

## 输入参数

- 无 path / query 请求参数。
- 请求体（`EntityPropertyRowPageQueryParam`）：

| 字段名                     | 类型            | 必填 | 说明                                                                          |
| -------------------------- | --------------- | ---- | ----------------------------------------------------------------------------- |
| `ontologyUniqueIdentifier` | String          | 否   | 对象 id                                                                       |
| `entityPrimaryKey`         | Object          | 是   | 实体主键值                                                                    |
| `sort`                     | String          | 是   | 排序规则：`ASC` / `DESC`                                                      |
| `storageGroup`             | String          | 是   | 属性存储分组名称，与 `row_detail` 返回的 `propertyGroups[].storageGroup` 一致 |
| `pageNum`                  | Integer / int32 | 否   | 分页号，默认 `1`                                                              |
| `pageSize`                 | Integer / int32 | 否   | 每页条数，默认 `10`                                                           |

- 示例：

```json
{
  "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
  "entityPrimaryKey": 1,
  "sort": "DESC",
  "storageGroup": "main",
  "pageNum": 1,
  "pageSize": 10
}
```

## 输出参数

- 响应包装与 `data`（`PagePropertyGroupData`）：

| 字段名    | 类型                  | 必填 | 说明     |
| --------- | --------------------- | ---- | -------- |
| `code`    | Integer / int32       | 否   | 响应码   |
| `message` | String                | 否   | 消息描述 |
| `data`    | PagePropertyGroupData | 否   | 分页数据 |

**PagePropertyGroupData**：

| 字段名    | 类型                      | 必填 | 说明             |
| --------- | ------------------------- | ---- | ---------------- |
| `records` | List\<PropertyGroupData\> | 否   | 当前页属性行列表 |
| `total`   | Integer / int64           | 否   | 总行数           |
| `size`    | Integer / int64           | 否   | 每页条数         |
| `current` | Integer / int64           | 否   | 当前页号         |
| `pages`   | Integer / int64           | 否   | 已废弃           |

**PropertyGroupData**：

| 字段名           | 类型                 | 必填 | 说明         |
| ---------------- | -------------------- | ---- | ------------ |
| `dataPrimaryKey` | Object               | 否   | 数据主键     |
| `props`          | List\<PropertyInfo\> | 否   | 属性信息列表 |

**PropertyInfo**：

| 字段名                   | 类型    | 必填 | 说明          |
| ------------------------ | ------- | ---- | ------------- |
| `propertyUniqIdentifier` | String  | 否   | 属性唯一标识  |
| `propertyApiName`        | String  | 是   | 属性 api 名称 |
| `propertyDisplayName`    | String  | 否   | 属性显示名称  |
| `propertyValue`          | Object  | 是   | 属性值        |
| `categoryId`             | Integer | 否   | 属性分类 id   |

- 示例：

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "records": [
      {
        "dataPrimaryKey": 101,
        "props": [
          {
            "propertyUniqIdentifier": "e0791fc07cbe4a85b2c9f974b88954a3",
            "propertyApiName": "weapon_name",
            "propertyDisplayName": "武器名称",
            "propertyValue": "AIM-9X",
            "categoryId": 709
          }
        ]
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1,
    "pages": 1
  }
}
```

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`SUCCESS`
- 失败时返回具体错误信息。

真实示例数据
{
"code": 200,
"message": "SUCCESS",
"data": {
"records": [
{
"dataPrimaryKey": 7,
"props": [
{
"propertyUniqIdentifier": "06eb8a07b9f248c6b32963deb4cfbb54",
"propertyApiName": "w_count",
"propertyDisplayName": "挂载数量",
"propertyValue": 6,
"categoryId": 709
},
{
"propertyUniqIdentifier": "2a5886db0f664be3b86ff89a085363fe",
"propertyApiName": "w_name",
"propertyDisplayName": "武器名称",
"propertyValue": "R-77M",
"categoryId": 709
},
{
"propertyUniqIdentifier": "6e0f9bde6afb4d0b8d1e3abddbf4b57b",
"propertyApiName": "w_range",
"propertyDisplayName": "武器射程",
"propertyValue": 190,
"categoryId": 709
},
{
"propertyUniqIdentifier": "7bc448386a3b4bc7a9b9d4db3a274e59",
"propertyApiName": "w_type",
"propertyDisplayName": "武器类型",
"propertyValue": "空空导弹",
"categoryId": 709
}
]
},
{
"dataPrimaryKey": 6,
"props": [
{
"propertyUniqIdentifier": "06eb8a07b9f248c6b32963deb4cfbb54",
"propertyApiName": "w_count",
"propertyDisplayName": "挂载数量",
"propertyValue": 4,
"categoryId": 709
},
{
"propertyUniqIdentifier": "2a5886db0f664be3b86ff89a085363fe",
"propertyApiName": "w_name",
"propertyDisplayName": "武器名称",
"propertyValue": "R-37M",
"categoryId": 709
},
{
"propertyUniqIdentifier": "6e0f9bde6afb4d0b8d1e3abddbf4b57b",
"propertyApiName": "w_range",
"propertyDisplayName": "武器射程",
"propertyValue": 300,
"categoryId": 709
},
{
"propertyUniqIdentifier": "7bc448386a3b4bc7a9b9d4db3a274e59",
"propertyApiName": "w_type",
"propertyDisplayName": "武器类型",
"propertyValue": "空空导弹",
"categoryId": 709
}
]
}
],
"total": 2,
"size": 10,
"current": 1,
"pages": 1
}
}
