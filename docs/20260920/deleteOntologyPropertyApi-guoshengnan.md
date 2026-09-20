# 接口名称

- 本体对象属性删除

## 接口描述

- 根据属性唯一标识删除本体对象属性。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/property/{propertyUniqueIdentifier}`

## 请求方式

- DELETE

## 输入参数

| 参数                     | 位置 | 类型   | 必填 | 说明         |
| ------------------------ | ---- | ------ | ---- | ------------ |
| propertyUniqueIdentifier | path | string | 是   | 属性唯一标识 |

- 请求体：无。

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

- `200`：删除成功。
- `400`：请求参数错误。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。
