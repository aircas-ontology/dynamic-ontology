# 接口名称

- 本体对象属性新增

## 接口描述

- 创建本体对象属性。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/property`

## 请求方式

- POST

## 输入参数

- 请求体：JSON 对象。

| 字段                 | 类型            | 必填 | 说明                                                      |
| -------------------- | --------------- | ---- | --------------------------------------------------------- |
| ontologyIdentifier   | string          | 是   | 本体 id                                                   |
| datasource           | object          | 否   | 数据源属性请求，结构见 `PropertyDatasourceParam`          |
| schemaName           | string          | 是   | schema 名称                                               |
| datasourceId         | string          | 是   | 数据源表名                                                |
| datasourceColumnName | string          | 是   | 数据源列名                                                |
| dataType             | string          | 是   | 数据类型                                                  |
| description          | string          | 是   | 列描述                                                    |
| displayName          | string          | 是   | 属性展示名称                                              |
| apiName              | string          | 是   | 代码中的属性名称，格式：`^[a-zA-Z_$][a-zA-Z0-9_$]{0,62}$` |
| isPrimaryKey         | boolean         | 是   | 是否为主键                                                |
| isTitleKey           | boolean         | 是   | 是否为名称键                                              |
| type                 | string          | 否   | 属性自定义标签                                            |
| defaultValue         | string          | 否   | 属性默认值                                                |
| storageGroup         | string          | 是   | 属性存储分组                                              |
| categoryId           | integer / int32 | 否   | 属性分类 id                                               |
| metadata             | object          | 否   | 属性元数据，JSON 格式                                     |

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
