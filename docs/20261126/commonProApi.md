## 一、查询多个对象的公共字段

```
POST /ontology/action/basic-function/common-properties
Content-Type: application/json
```

前端选了多个对象后先调这个接口，返回这批对象**共有**的字段。查询字段、聚合目标、条件字段都只能从返回的
`properties` 里选——少一个字段，别的对象就查不出来；类型不一致，UNION ALL 合不到一列里。

### 1.1 请求字段

| 字段                  | 类型               | 必填   | 说明                                                         |
| --------------------- | ------------------ | ------ | ------------------------------------------------------------ |
| `ontologySpaceId`     | Integer            | 否     | 对象空间 id；传了会核对所选对象都属于该空间                  |
| `ontologyIdentifiers` | List&lt;String&gt; | **是** | 对象 id 列表，至少一个；单对象也允许，返回该对象全部可用字段 |

### 1.2 完整请求

```json
{
  "ontologySpaceId": 156,
  "ontologyIdentifiers": ["3f2a9c1e-7b4d-4a86-9e21-5c8d1f0a6b34", "a5e8c206-3f17-4d92-8b74-1c6f9d3e5028"]
}
```

### 1.3 响应字段

| 字段                        | 类型               | 说明                                                                      |
| --------------------------- | ------------------ | ------------------------------------------------------------------------- |
| `ontologyIdentifiers`       | List&lt;String&gt; | 参与取交集的对象 id，与请求顺序一致                                       |
| `ontologyNames`             | List&lt;String&gt; | 对象名称，与 `ontologyIdentifiers` 同序逐项对应；名称为空时用对象 id 占位 |
| `properties`                | Array              | 公共字段，按**第一个对象**的属性顺序排列                                  |
| `properties[].apiName`      | String             | 属性 apiName，配置里就填它                                                |
| `properties[].propertyType` | String             | 属性数据类型（如 `String` / `Double` / `Timestamp`）                      |
| `properties[].isPrimaryKey` | Boolean            | 是否主键，按第一个对象取                                                  |
| `properties[].isTitleKey`   | Boolean            | 是否名称键，按第一个对象取                                                |
| `properties[].displayNames` | List&lt;String&gt; | 各对象上该属性的展示名，与 `ontologyIdentifiers` 同序逐项对应             |

### 1.4 完整响应

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "ontologyIdentifiers": ["3f2a9c1e-7b4d-4a86-9e21-5c8d1f0a6b34", "a5e8c206-3f17-4d92-8b74-1c6f9d3e5028"],
    "ontologyNames": ["卫星", "导弹"],
    "properties": [
      {
        "apiName": "name",
        "propertyType": "String",
        "isPrimaryKey": false,
        "isTitleKey": true,
        "displayNames": ["名称", "名称"]
      },
      {
        "apiName": "speed",
        "propertyType": "Double",
        "isPrimaryKey": false,
        "isTitleKey": false,
        "displayNames": ["速度", "速度"]
      },
      {
        "apiName": "recordTime",
        "propertyType": "Timestamp",
        "isPrimaryKey": false,
        "isTitleKey": false,
        "displayNames": ["记录时间", "采样时间"]
      }
    ]
  }
}
```

注意 `displayNames`：同名属性在不同对象上叫法可能不同（如「记录时间」/「采样时间」），
下拉列表按它展示、按 `apiName` 回传。

### 1.5 什么字段会出现在 properties 里

同时满足以下条件才返回：

1. 每个选中对象上都有同名 `apiName` 的属性；
2. 该属性在每个对象上**都已关联数据源**（有数据源 id 和列名）；
3. 各对象上 `propertyType` **完全一致**（类型不同的字段直接不返回，前端也就无从选错）；
4. 多对象必须属于**同一个对象分类**（不满足直接报错，见下）。

### 1.6 报错

| 错误信息                                                                   | 原因                                    |
| -------------------------------------------------------------------------- | --------------------------------------- |
| `ontologyIdentifiers 不能为空` / `要传至少一个对象id`                      | 没传对象 id，或全是空串                 |
| `无效的对象：xxx`                                                          | 对象 id 不存在                          |
| `对象[卫星]不属于该对象空间`                                               | 传了 `ontologySpaceId` 但对象不在该空间 |
| `多个对象必须属于同一个对象分类：卫星（分类：飞行器）、导弹（分类：武器）` | 选了不同分类下的对象                    |

`properties` 为空不报错，表示这批对象没有可共用的字段（常见于两个对象根本没同名字段，或都还没关联数据源）。
