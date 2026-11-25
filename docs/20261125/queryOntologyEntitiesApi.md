# 批量查询对象实例

接口路径为 `/ontology/entity/query`。本文依据提供的请求和成功响应样例整理，HTTP 方法和鉴权要求待在线契约确认。

## 请求体

请求体为 JSON 数组。每项对应一个对象，`ontologyUniqueIdentifier` 为对象唯一标识，`entityPrimaryKeys` 为实例主键数组。以下使用示例标识。

```json
[
  { "ontologyUniqueIdentifier": "sample-book", "entityPrimaryKeys": [] },
  { "ontologyUniqueIdentifier": "sample-shelf", "entityPrimaryKeys": [] }
]
```

## 成功响应

样例返回 `code: 200` 和 `message: "SUCCESS"`。以下为缩短的结构示例。

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": [
    {
      "ontologyUniqueIdentifier": "sample-book",
      "entityList": [
        {
          "ontologyUniqueIdentifier": "sample-book",
          "ontologyName": "图书",
          "primaryKey": 1,
          "displayName": "示例图书",
          "properties": [{ "propertyApiName": "edition", "propertyDisplayName": "版次", "propertyValue": "第一版" }]
        }
      ]
    }
  ]
}
```

`data` 按对象分组。实例项包含对象标识、对象名称、实例主键、显示名称和属性列表。样例中的主键为整数。

## 样例能确认的范围

一次请求包含两个对象，两组分别返回 7 条和 3 条实例。空主键数组在该样例中能返回数据。响应中没有分类层级、分页信息或总数，默认返回上限及结果完整性仍需服务端契约确认。
