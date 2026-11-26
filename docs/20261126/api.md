## 二、创建/编辑行为时怎么传

```
POST /ontology/action        创建
PUT  /ontology/action        编辑（body 同创建，加上 actionApi 定位）
```

### 2.1 顶层字段

| 字段                                         | 传法                          | 说明                                                                                |
| -------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| `actionApi` / `displayName` / `categoryId`   | 必传                          | 行为标识 / 名称 / 行为分类                                                          |
| `actionKind`                                 | 必传，固定 `"BASE"`           | 基础行为                                                                            |
| `subjectType`                                | 必传，固定 `"BASIC_FUNCTION"` | 基础函数                                                                            |
| `basicFunction`                              | 必传                          | 查询配置，见 2.3                                                                    |
| `ontologyIdentifier`                         | **不传**                      | 基础函数作用于哪些对象写在 `basicFunction.ontologyIdentifiers` 里，可以多个         |
| `ontologySpaceId`                            | 不传                          | 空间由 `basicFunction.ontologyIdentifiers` 的第一个对象反查                         |
| `functionApi`                                | **不传**                      | 基础函数不绑算子                                                                    |
| `mappingIns`                                 | **不传**                      | 基础函数不绑算子入参/出参                                                           |
| `operation` / `storageGroup` / `linkMapping` | **不传**                      | 只有属性值、实例关系行为使用                                                        |
| `outputMode`                                 | 不传                          | 后端按 `basicFunction` 有没有配 `writeBack` 自动给 `RESULT_ONLY` / `WRITE_PROPERTY` |

### 2.2 完整创建示例（查询方式，两个对象，分页 + 固定条件 + 外部输入条件）

```json
{
  "actionApi": "act.bf.track.query",
  "displayName": "基础函数-轨迹时间段查询",
  "description": "卫星、导弹按时间段查轨迹点，条件值测试时输入",
  "categoryId": 14,
  "actionKind": "BASE",
  "subjectType": "BASIC_FUNCTION",
  "basicFunction": {
    "ontologyIdentifiers": ["3f2a9c1e-7b4d-4a86-9e21-5c8d1f0a6b34", "a5e8c206-3f17-4d92-8b74-1c6f9d3e5028"],
    "mode": "QUERY",
    "selectFields": ["name", "speed", "recordTime"],
    "pageNum": 1,
    "pageSize": 20,
    "filters": {
      "logic": "AND",
      "children": [
        {
          "type": "FILTER",
          "filter": {
            "propertyApiName": "recordTime",
            "op": "BETWEEN",
            "source": "EXTERNAL"
          }
        },
        {
          "type": "FILTER",
          "filter": {
            "propertyApiName": "speed",
            "op": "GT",
            "value": 10
          }
        }
      ]
    }
  }
}
```

新建的行为是**草稿**，测试不受状态限制；要让调度/智能体使用要走 `PUT /ontology/action/publish`。

### 2.3 basicFunction 字段

| 字段                  | 类型               | 必填           | 说明                                                                    |
| --------------------- | ------------------ | -------------- | ----------------------------------------------------------------------- |
| `ontologyIdentifiers` | List&lt;String&gt; | **是**         | 查询对象 id，至少一个；多个时必须是同一对象分类                         |
| `mode`                | String             | **是**         | `QUERY` 查询（返回行） / `AGGREGATE` 聚合（返回一个值）                 |
| `selectFields`        | List&lt;String&gt; | QUERY 必填     | 查询字段 apiName，至少一个；多对象时必须是公共字段（见第一节）          |
| `pageNum`             | Integer            | 否             | 分页号，默认 1；多对象时作用在 UNION ALL 合并后的整批结果上             |
| `pageSize`            | Integer            | 否             | 每页条数，默认 10；配了结果回写时这里只决定回显几行，回写仍落全部命中行 |
| `aggFunc`             | String             | AGGREGATE 必填 | `SUM` / `COUNT` / `AVG` / `MAX` / `MIN` / `DISTINCT`                    |
| `targetField`         | String             | AGGREGATE 必填 | 聚合目标属性 apiName；多对象时每个对象上都要有                          |
| `filters`             | Object             | 否             | 过滤条件树，见 2.4                                                      |
| `writeBack`           | Object             | 否             | 结果回写配置，见 2.6；不传就是只查不落库                                |

多对象两种方式的结果口径：

- `QUERY`：每个对象各查一遍选中字段，SQL 层 `UNION ALL` 合并后统一分页。各对象行混在一批里，
  结果不标某一行的来源对象（`ontologyUniqueIdentifier` 为空，`ontologyDisplayName` 是各对象名拼接）。
- `AGGREGATE`：各对象命中的值先合成一批，聚合函数只在最外层算一次，得到一个**统一值**
  （不是每个对象各算一个再拼）。

### 2.4 过滤条件写法

条件树：`FilterGroupParam.logic`（`AND` / `OR`）+ `children`；子节点两种：

| `type`   | 内容                    |
| -------- | ----------------------- |
| `FILTER` | `filter`：单个属性条件  |
| `GROUP`  | `group`：嵌套一层条件组 |

单个条件字段（`PropertyFilterParam`）：

| 字段              | 说明                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `propertyApiName` | 属性 apiName，多对象时必须是公共字段；`source=EXTERNAL` 时测试/执行用它作为 `params` 的键                                                        |
| `op`              | `EQ` `NE` `LIKE` `LIKE_LEFT` `LIKE_RIGHT` `IN` `NOT_IN` `BETWEEN` `NOT_BETWEEN` `GT` `GE` `LT` `LE` `IS_NULL` `IS_NOT_NULL` `APPLY`，不传按 `EQ` |
| `source`          | 取值来源：`FIXED` 固定值（默认）/ `EXTERNAL` 外部输入                                                                                            |
| `value`           | 单值（`EQ`/`GT`/`LIKE` 等用）；仅 `FIXED` 时传                                                                                                   |
| `values`          | 多值：`IN`/`NOT_IN` 写候选值数组；`BETWEEN`/`NOT_BETWEEN` 约定 `[下界, 上界]`；仅 `FIXED` 时传                                                   |
| `dataType`        | 变量类型（基础查询算子使用）；基础函数按属性定义的类型处理，可不传                                                                               |

外部输入的硬规则（创建和执行都会校验）：

1. `source=EXTERNAL` 时**不传** `value`/`values`（填了报错，不会悄悄忽略）；测试/执行时在 `params` 里按 `propertyApiName` 给值；
2. `APPLY` 不支持外部输入（模板会被当 SQL 拼）；
3. `IN`/`NOT_IN` 的外部值要传数组；`BETWEEN`/`NOT_BETWEEN` 要传长度为 2 的数组。

### 2.5 聚合方式怎么写

把 2.2 里 `basicFunction` 换成下面这块即可（其余顶层字段不变，`selectFields`/`pageNum`/`pageSize` 不需要）：

```json
"basicFunction": {
  "ontologyIdentifiers": [
    "3f2a9c1e-7b4d-4a86-9e21-5c8d1f0a6b34",
    "a5e8c206-3f17-4d92-8b74-1c6f9d3e5028"
  ],
  "mode": "AGGREGATE",
  "aggFunc": "AVG",
  "targetField": "speed",
  "filters": {
    "logic": "AND",
    "children": [
      {
        "type": "FILTER",
        "filter": {"propertyApiName": "recordTime", "op": "GE", "source": "EXTERNAL"}
      }
    ]
  }
}
```

### 2.6 结果回写（可选）

`QUERY` 往目标对象的**子表分组**逐行追加，`AGGREGATE` 改目标对象**主表**的一个属性。
不配 `writeBack` 就只返回结果、不落库。查询方式示例片段：

```json
"writeBack": {
  "targetOntologyIdentifier": "c8d2e4f6-1a3b-4c5d-8e9f-0a1b2c3d4e5f",
  "targetStorageGroup": "track",
  "bindings": [
    {"sourceField": "name", "targetPropertyIdentifier": "1a2b3c4d-5e6f-4a8b-9c0d-1e2f3a4b5c6d"},
    {"sourceField": "speed", "targetPropertyIdentifier": "7f8e9d0c-4b3a-4219-8f7e-6d5c4b3a201f"},
    {"sourceField": "recordTime", "targetPropertyIdentifier": "2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f"}
  ]
}
```

- 查询方式 `targetStorageGroup` 必填且不能是 `main`；聚合方式不传（固定写 main）。
- `sourceField` 是结果里的查询字段 apiName，`targetPropertyIdentifier` 是目标属性的**唯一标识**（不是 apiName）。
- 回写实例在测试/执行请求里按对象传（见 3.1 的 `entityPrimaryKeys` / `writeBackEntityPrimaryKey`）。

---

## 三、测试/执行时外部输入怎么传

### 3.1 行为测试

```
POST /ontology/action/test
Content-Type: application/json
```

```json
{
  "ontologySpaceId": 156,
  "actionApi": "act.bf.track.query",
  "params": {
    "recordTime": ["2026-11-25 00:00:00", "2026-11-25 23:59:59"]
  }
}
```

- `params` 的键是条件里的 `propertyApiName`，值按条件算子的要求给：单值直接给，`IN`/`NOT_IN` 给数组，
  `BETWEEN`/`NOT_BETWEEN` 给 `[下界, 上界]`。时间按 `yyyy-MM-dd HH:mm:ss` 传即可。
- 查询范围默认是所选对象的**全部实例**。只测某几条实例时：
  - 单对象：`"entityPrimaryKey": 1`；
  - 多对象：`"entityPrimaryKeys": {"3f2a9c1e-7b4d-4a86-9e21-5c8d1f0a6b34": 1, "a5e8c206-3f17-4d92-8b74-1c6f9d3e5028": 2}`。
- 配了结果回写时，回写落点用 `entityPrimaryKeys` 里回写目标对象的键，或用 `writeBackEntityPrimaryKey` 单独指定
  （只决定写到哪个实例，不参与查询收窄）。

### 3.2 响应与结果

`data.result` 是**字符串**，里面是基础函数结果 JSON（`ActionBasicFunctionResultVO`）：

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "actionApi": "act.bf.track.query",
    "message": "行为执行成功",
    "result": "{\"mode\":\"QUERY\",\"results\":[{\"ontologyDisplayName\":\"卫星、导弹\",\"records\":[[{\"propertyApiName\":\"name\",\"propertyDisplayName\":\"名称\",\"value\":\"遥感一号\"},{\"propertyApiName\":\"speed\",\"propertyDisplayName\":\"速度\",\"value\":12.5},{\"propertyApiName\":\"recordTime\",\"propertyDisplayName\":\"记录时间\",\"value\":1763990400000}]],\"total\":37}]}"
  }
}
```

把 `result` 解析后的结构：

```json
{
  "mode": "QUERY",
  "results": [
    {
      "ontologyDisplayName": "卫星、导弹",
      "records": [
        [
          { "propertyApiName": "name", "propertyDisplayName": "名称", "value": "遥感一号" },
          { "propertyApiName": "speed", "propertyDisplayName": "速度", "value": 12.5 },
          { "propertyApiName": "recordTime", "propertyDisplayName": "记录时间", "value": 1763990400000 }
        ]
      ],
      "total": 37
    }
  ]
}
```

字段说明：

| 字段                                           | 说明                                                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `mode`                                         | `QUERY` / `AGGREGATE`                                                                                          |
| `results[0].ontologyUniqueIdentifier`          | 单对象时有值；多对象时为空（该键不输出）                                                                       |
| `results[0].ontologyDisplayName`               | 对象名称；多对象时是各对象名拼接                                                                               |
| `results[0].records`                           | 查询结果行：一行是数组，元素按 `selectFields` 顺序，每项含 `propertyApiName` / `propertyDisplayName` / `value` |
| `results[0].total`                             | 命中总行数（不是页数），与配置里 pageNum/pageSize 无关                                                         |
| `results[0].aggFunc` / `targetField` / `value` | 聚合方式才出现；`value` 是各对象合批算出的统一值                                                               |
| `writeBack`                                    | 配了结果回写才有：目标对象/分组/实例/行数/实际写入的属性，没配时该键不输出                                     |

### 3.3 外部输入缺失时的报错

```
过滤条件[recordTime]用了外部输入，本次执行没有提供它的值
```

`params` 里没给对应 `propertyApiName` 键、或给的是 null，都会这样报错（创建时校验通过不代表这次带够了值）。

### 3.4 哪些入口不支持外部输入

| 入口                             | 能否给外部输入                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `POST /action/test`（行为测试）  | 能，传 `params`                                                                   |
| 调度（周期/规则触发）            | **不能**，调度的请求里没有 `params`；行为含外部输入条件时，调度执行会报上面那条错 |
| 按对象全量执行 `/action/execute` | **不能**，请求没有 `params`                                                       |

需要在调度里用的行为，条件用固定值，或等调度侧支持参数后再配外部输入。

---

## 四、常见错误

| 错误信息                                                                                                                         | 原因                                                 |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `基础函数行为要选择操作方式：聚合还是查询`                                                                                       | 没传 `mode`                                          |
| `查询方式要选查询哪些属性`                                                                                                       | `mode=QUERY` 但 `selectFields` 为空                  |
| `聚合方式要先选聚合函数` / `聚合方式要选聚合目标属性`                                                                            | `mode=AGGREGATE` 缺 `aggFunc` / `targetField`        |
| `查询方式的分页号要大于 0` / `查询方式的每页条数要大于 0`                                                                        | `pageNum` / `pageSize` 传了 0 或负数                 |
| `对象[卫星]没有属性 xxx，基础函数的聚合目标、查询字段和条件字段要在每个选中的对象上都有`                                         | 选的字段不是所有对象的公共字段                       |
| `查询字段[speed]在各对象上的数据类型不一致（卫星：Double、导弹：Int），合并查询要求同名字段类型一致，请改字段类型或去掉这个字段` | 同名同类型才允许跨对象查，改用公共字段接口返回的字段 |
| `对象[卫星]的属性[速度]还没关联数据源字段，查询跑不出来`                                                                         | 属性未关联数据源列                                   |
| `过滤条件[xxx]的取值来源是外部输入，不要再填固定值（填了也不会用）`                                                              | `source=EXTERNAL` 同时传了 `value`/`values`          |
| `过滤条件[xxx]的 APPLY 不能用外部输入`                                                                                           | `op=APPLY` 配了 `source=EXTERNAL`                    |
| `多个对象必须属于同一个对象分类：…`                                                                                              | 多对象查询要求同分类                                 |
| `本次查询命中 N 行，超过结果回写的单次上限 1000 行，请给行为加过滤条件缩小范围后再执行`                                          | 配了回写但命中行超过 1000                            |
| `各对象上同名字段关联的数据源列类型不一致，合不到一列里，请检查这些字段的数据类型`                                               | 库里列类型与属性元数据不一致                         |
| `数值型过滤值不合法：xxx`                                                                                                        | 数值属性的条件值不是合法数字（外部输入传了非数字）   |

---

## 五、限制与注意事项

1. **UNION ALL 分页没有 ORDER BY**：翻页时的行序由数据库决定，同一次查询内稳定，两次分开执行不保证一致；
   需要固定顺序目前只能在前端展示层处理。
2. **多对象查询结果不标来源对象**：行里没有对象 id，展示列名按第一个对象的属性展示名；
   需要区分来源时，按单个对象各建一个行为。
3. **结果回写与分页**：配了回写时取数从第 1 页取到 1000 行为止（超了报错），落库落全部命中行；
   `pageNum`/`pageSize` 只决定回显几行。
4. **外部输入只在测试/执行请求里生效**：配置里只标 `source=EXTERNAL` 与属性 apiName，不存某一次的值；测试时按 `propertyApiName` 在 `params` 里传值。
5. **数值条件值会被严格校验为数字**：外部输入往数值属性传 `"10"` 可以，传 `"abc"` 直接报错。
