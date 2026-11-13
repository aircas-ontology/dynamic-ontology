## 一、行为列表

```
GET /ontology/action/list

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`


```

| 参数              | 类型    | 必填   | 说明                                        |
| ----------------- | ------- | ------ | ------------------------------------------- |
| `ontologySpaceId` | Integer | **是** | 本体空间 id                                 |
| `ontologyId`      | string  | 否     | 对象唯一标符                                |
| `categoryId`      | Integer | 否     | 行为分类id                                  |
| `keyword`         | String  | 否     | 关键词：行为名称、算子 api、描述            |
| `status`          | Integer | 否     | 状态：1 启用，0 失效                        |
| `actionKind`      | Integer | 否     | 行为类别：BASE/APPLICATION/TREE，不传查全部 |
| `pageNum`         | Integer | 否     | 页码，默认 1                                |
| `pageSize`        | Integer | 否     | 每页条数，默认 10                           |

**响应**：

```json
{
  "code": 200,
  "data": {
    "records": [
      {
        "id": 1,
        "actionApi": "act.pv.weapon.add",
        "displayName": "武器行-新增",
        "description": "属性值行为：向 weapon 分组新增一行",
        "ontologyUniqIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
        "categoryId": 14,
        "status": 1, //2 草稿，1 已发布
        "updateTime": "2026-11-06 15:23:36",
        "actionKind": "BASE", //行为类别：BASE 基础行为 / APPLICATION 应用行为 / TREE 行为树
        "subjectType": "PROPERTY_VALUE",
        "operation": "CREATE",
        "storageGroup": "weapon",
        "functionApi": null,
        "functionDescription": null,
        "outputMode": null
      }
    ],
    "total": 9,
    "size": 10,
    "current": 1,
    "pages": 1
  }
}
```

---
