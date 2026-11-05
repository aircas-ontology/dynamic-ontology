### 2.3 实体属性详情（按行返回，带存储分组）

**接口**：`POST /ontology/entity/row_detail`

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": null
}
```

- `code`：【integer / int32】响应码
- `message`：【string】消息描述
- `data`：【unknown】删除接口无业务响应数据

**请求体（`EntityPropertyRowQueryParam`）**：

```json
{
  "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
  "entityPrimaryKey": "1",
  "sort": "DESC"
}
```

> `sort` 必填：`ASC` / `DESC`，控制动态属性行的排序。

**响应字段（`EntityPropertyRowDetailVO`）**：

| 字段名                     | 类型                  | 说明         |
| -------------------------- | --------------------- | ------------ |
| `primaryKey`               | Object                | 实体主键     |
| `ontologyUniqueIdentifier` | String                | 对象 id      |
| `propertyGroups`           | List\<PropertyGroup\> | 属性分组列表 |

**PropertyGroup**：

| 字段名          | 类型                      | 说明                               |
| --------------- | ------------------------- | ---------------------------------- |
| `storageGroup`  | String                    | 存储分组名称（如 `main`、`extra`） |
| `groupDataList` | List\<PropertyGroupData\> | 该分组下的数据行列表               |

**PropertyGroupData**：

| 字段名           | 类型                 | 说明                                                  |
| ---------------- | -------------------- | ----------------------------------------------------- |
| `dataPrimaryKey` | Object               | 数据行主键（属性值行为修改/删除时需要它定位具体一行） |
| `props`          | List\<PropertyInfo\> | 该行下的属性信息列表                                  |

**PropertyInfo**：

| 字段名                   | 类型     | 说明          |
| ------------------------ | -------- | ------------- |
| `propertyUniqIdentifier` | String   | 属性唯一标识  |
| `propertyApiName`        | String   | 属性 api 名称 |
| `propertyDisplayName`    | String   | 属性显示名称  |
| `propertyValue`          | Object   | 属性值        |
| `categoryId`             | Integer  | 属性分类 id   |
| `metadata`               | JsonNode | 属性元数据    |

---
