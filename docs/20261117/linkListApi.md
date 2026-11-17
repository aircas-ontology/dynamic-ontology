# 接口名称

- 分页查询空间内关系

## 编译位置

- apis：`src/apis`
- types：`src/types/apis`

## 接口描述

- 分页查询空间内关系，支持按关系名称模糊匹配，返回关系 ID、名称及两端对象信息。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/link/list`

## 请求方式

- GET

## 输入参数

- 传参方式：【必须】以 **query string parameters** 传递（非 request body）。

| 参数           | 类型    | 必填   | 说明                               |
| -------------- | ------- | ------ | ---------------------------------- |
| `spaceId`      | Integer | **是** | 对象空间 id                        |
| `relationName` | String  | 否     | 关系名称，模糊匹配；不传则查询全部 |
| `pageNum`      | Integer | 否     | 页码，从 1 开始；默认 1            |
| `pageSize`     | Integer | 否     | 每页条数；默认 10                  |

- 请求示例：

```
GET /ontology/link/list?spaceId=156&pageNum=1&pageSize=10
```

## 输出参数

```JSON
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "current": 1,
    "pages": 1,
    "size": 10,
    "total": 10,
    "records": [
      {
        "uniqueIdentifier": "4ed7c4da646f4006bec301815b61debb",
        "name": "搭载",
        "fromObject": {
          "uniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
          "createTime": "2026-11-02 14:43:07",
          "updateTime": "2026-11-02 14:43:07",
          "latestQueryTime": "2026-11-02 14:43:07",
          "displayName": "飞机",
          "description": "属性值行为（weapon/engine 两个分组）、实例关系行为、算子行为的主对象",
          "apiName": "act_aircraft",
          "metaGroupId": [],
          "spaceId": 156,
          "ontologyCategoryId": 626
        },
        "toObject": {
          "uniqueIdentifier": "c8adbff823c54653adc11c8fa1fa7c14",
          "createTime": "2026-11-02 14:43:07",
          "updateTime": "2026-11-02 14:43:07",
          "latestQueryTime": "2026-11-02 14:43:07",
          "displayName": "导弹",
          "description": "关系对端对象；seeker 分组是属性值行为-新增/删除的第二个测试目标",
          "apiName": "act_missile",
          "metaGroupId": [],
          "spaceId": 156,
          "ontologyCategoryId": 627
        }
      }
    ]
  }
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `data`：【object】分页数据
  - `current`：【number】当前页码
  - `pages`：【number】总页数
  - `size`：【number】每页条数
  - `total`：【number】总条数
  - `records`：【array】关系列表
    - `uniqueIdentifier`：【string】关系唯一标识
    - `name`：【string】关系名称
    - `fromObject`：【object】关系源端对象
    - `toObject`：【object】关系目标端对象
- `fromObject` / `toObject` 字段：
  - `uniqueIdentifier`：【string】对象唯一标识
  - `createTime`：【string】创建时间
  - `updateTime`：【string】更新时间
  - `latestQueryTime`：【string】最近查询时间
  - `displayName`：【string】对象显示名称
  - `description`：【string】对象描述
  - `apiName`：【string】对象 api 名称
  - `metaGroupId`：【array】元数据分组 id 列表
  - `spaceId`：【number】所属空间 id
  - `ontologyCategoryId`：【number】对象分类 id

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回具体成功文案
- 失败时返回具体错误信息
