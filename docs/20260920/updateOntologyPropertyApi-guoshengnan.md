# 接口名称

- 本体对象属性修改

## 接口描述

- 修改本体对象属性。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/property`

## 请求方式

- PUT

## 输入参数

- 请求体：JSON 对象。

| 字段                 | 类型            | 必填 | 说明                                             |
| -------------------- | --------------- | ---- | ------------------------------------------------ |
| uniqueIdentifier     | string          | 是   | 属性唯一标识，文档说明为 `uniqIdentifier`        |
| datasource           | object          | 否   | 数据源属性请求，结构见 `PropertyDatasourceParam` |
| schemaName           | string          | 是   | schema 名称                                      |
| datasourceId         | string          | 是   | 数据源表名                                       |
| datasourceColumnName | string          | 是   | 数据源列名                                       |
| displayName          | string          | 是   | 属性名称                                         |
| dataType             | string          | 是   | 数据类型                                         |
| description          | string          | 否   | 属性描述                                         |
| isTitleKey           | boolean         | 是   | 是否为名称键                                     |
| isPrimaryKey         | boolean         | 是   | 是否为主键                                       |
| defaultValue         | string          | 否   | 属性默认值                                       |
| storageGroup         | string          | 是   | 属性存储分组                                     |
| categoryId           | integer / int32 | 否   | 属性分类 id                                      |
| metadata             | object          | 否   | 属性元数据，JSON 格式                            |

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": null
}
```

| 字段    | 类型            | 说明                             |
| ------- | --------------- | -------------------------------- |
| code    | integer / int32 | 响应码                           |
| message | string          | 消息描述                         |
| data    | unknown         | 业务数据，接口文档未定义具体结构 |

## code

- `200`：请求成功。
- `400`：请求参数错误。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。
