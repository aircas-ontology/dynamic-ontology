# 接口名称

- 根据本体标识查询本体对象属性列表

## 接口描述

- 根据本体 `ontologyUniqueIdentifier` 查询用于展示的本体对象属性列表。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/property/info`

## 请求方式

- GET

## 输入参数

| 参数                     | 位置  | 类型   | 必填 | 说明                  |
| ------------------------ | ----- | ------ | ---- | --------------------- |
| ontologyUniqueIdentifier | query | string | 是   | 本体 uniqueIdentifier |

- 请求体：无。

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": [
    {
      "displayName": "属性名称",
      "description": "属性描述",
      "isPrimaryKey": false,
      "isTitleKey": false,
      "uniqueIdentifier": "property-001",
      "ontologyUniqueIdentifier": "ontology-001",
      "defaultValue": "",
      "storageGroup": "主存储",
      "categoryId": 0,
      "metadata": {}
    }
  ]
}
```

| 字段                            | 类型            | 说明                  |
| ------------------------------- | --------------- | --------------------- |
| code                            | integer / int32 | 响应码                |
| message                         | string          | 消息描述              |
| data                            | array           | 本体属性信息列表      |
| data[].displayName              | string          | 属性名称              |
| data[].description              | string          | 属性描述              |
| data[].isPrimaryKey             | boolean         | 是否为主键            |
| data[].isTitleKey               | boolean         | 是否为名称键          |
| data[].uniqueIdentifier         | string          | 属性唯一标识          |
| data[].ontologyUniqueIdentifier | string          | 本体唯一标识          |
| data[].defaultValue             | string          | 属性默认值            |
| data[].storageGroup             | string          | 属性存储分组          |
| data[].categoryId               | integer / int32 | 属性分类 id           |
| data[].metadata                 | object          | 属性元数据，JSON 格式 |

## code

- `200`：请求成功。
- `400`：请求参数错误。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。
