# 接口名称

- 查询多对象下多个实体所有关联关系

## 编译位置

apis 与 types 文件名自行语义化命名

- apis：`src/apis/`
- types：`src/types/apis/`

## 接口描述

- 按多个对象分别传入实体主键列表，批量查询这些实体的全部关联关系。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/entity/link_between`

## 请求方式

- POST

## 输入参数

- 示例：

```json
{
  "ontologyUniqueIdentifierFrom": "ea512d439cd34c6ebbcde6b692261ab5",
  "entityPrimaryKeyFrom": 5,
  "ontologyUniqueIdentifierTo": "c8adbff823c54653adc11c8fa1fa7c14",
  "entityPrimaryKeyTo": 2
}
```

## 输出参数

- {
  "code": 200,
  "message": "SUCCESS",
  "data": [
  {
  "linkName": "搭载",
  "linkType": "POSSESSION",
  "ontologyFrom": "ea512d439cd34c6ebbcde6b692261ab5",
  "ontologyTo": "c8adbff823c54653adc11c8fa1fa7c14",
  "entityPrimaryKeyFrom": 4,
  "entityPrimaryKeyTo": 2,
  "entityNodeFrom": "835407",
  "displayNameFrom": "歼-20",
  "entityNodeTo": "835418",
  "displayNameTo": "AIM-9X",
  "startTime": "2026-11-03T16:00:00.000+00:00",
  "endTime": "2026-11-10T16:00:00.000+00:00",
  "visibilityWindows": [
  {
  "startTime": "2026-11-03T16:00:00.000+00:00",
  "endTime": "2026-11-10T16:00:00.000+00:00"
  }
  ],
  "status": "ENABLE"
  }
  ]
  }

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`SUCCESS`
- 失败时返回具体错误信息。
