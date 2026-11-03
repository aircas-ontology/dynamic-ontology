## 三、创建行为（核心）

```
POST /ontology/action
```

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

## 前端编译位置

- apis：`src/apis/`
- types：`src/types/`

### 3.1 通用字段

| 字段                 | 类型    | 必填   | 说明                                                    |
| -------------------- | ------- | ------ | ------------------------------------------------------- |
| `actionApi`          | String  | **是** | 行为唯一标识，如 `act.pv.weapon.add`                    |
| `displayName`        | String  | **是** | 行为显示名称                                            |
| `description`        | String  | 否     | 描述                                                    |
| `categoryId`         | Integer | **是** | 行为分类 id（从分类树获取）                             |
| `ontologyIdentifier` | String  | **是** | 本体唯一标识                                            |
| `actionKind`         | String  | **是** | 行为类别：`BASE`（基础行为）/ `APPLICATION`（应用行为） |

---

### 3.2 属性值行为（`actionKind=BASE`, `subjectType=PROPERTY_VALUE`）

对存储分组做增删改。`outputMode` 不传（后端固定）。

| 字段           | 类型   | 必填   | 说明                                 |
| -------------- | ------ | ------ | ------------------------------------ |
| `subjectType`  | String | **是** | 固定 `"PROPERTY_VALUE"`              |
| `operation`    | String | **是** | `"CREATE"` / `"UPDATE"` / `"DELETE"` |
| `storageGroup` | String | **是** | 分组名                               |
| `mappingIns`   | Array  | **是** | 属性绑定列表                         |

**mappingIns 每项**：

| 字段                       | 类型   | 必填   | 说明                                                                                     |
| -------------------------- | ------ | ------ | ---------------------------------------------------------------------------------------- |
| `propertyUniqueIdentifier` | String | **是** | 属性唯一标识                                                                             |
| `ontologyUniqueIdentifier` | String | **是** | 本体标识（同外层）                                                                       |
| `parameterName`            | String | 否     | 参数名（不传则用属性 apiName）                                                           |
| `sourceType`               | String | 否     | `"PROPERTY"`（对象属性）/ `"EXTERNAL"`（外部输入）/ `"FIXED"`（固定值），默认 `PROPERTY` |
| `sourceConfig`             | String | 否     | 固定值时填字面量（如 `"120.5"`、`"空空导弹"`）                                           |

**CREATE 特殊规则**：必须绑定分组内**全部**非空属性。

**示例 - 新增武器行**：

```json
{
  "ontologyIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
  "categoryId": 14,
  "actionApi": "act.pv.weapon.add",
  "displayName": "武器行-新增",
  "description": "属性值行为：向 weapon 分组新增一行",
  "actionKind": "BASE",
  "subjectType": "PROPERTY_VALUE",
  "operation": "CREATE",
  "storageGroup": "weapon",
  "mappingIns": [
    {
      "propertyUniqueIdentifier": "2a5886db0f664be3b86ff89a085363fe",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "parameterName": "w_name",
      "sourceType": "EXTERNAL"
    },
    {
      "propertyUniqueIdentifier": "06eb8a07b9f248c6b32963deb4cfbb54",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "parameterName": "w_count",
      "sourceType": "EXTERNAL"
    },
    {
      "propertyUniqueIdentifier": "6e0f9bde6afb4d0b8d1e3abddbf4b57b",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "parameterName": "w_range",
      "sourceType": "FIXED",
      "sourceConfig": "120.5"
    },
    {
      "propertyUniqueIdentifier": "7bc448386a3b4bc7a9b9d4db3a274e59",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "parameterName": "w_type",
      "sourceType": "FIXED",
      "sourceConfig": "空空导弹"
    }
  ]
}
```

---

### 3.3 实例关系行为（`actionKind=BASE`, `subjectType=LINK`）

对关系边做增删改状态。`outputMode` 不传。

| 字段          | 类型   | 必填   | 说明                                 |
| ------------- | ------ | ------ | ------------------------------------ |
| `subjectType` | String | **是** | 固定 `"LINK"`                        |
| `operation`   | String | **是** | `"CREATE"` / `"UPDATE"` / `"DELETE"` |
| `linkMapping` | Object | **是** | 关系绑定                             |

**linkMapping**：

| 字段                         | 类型   | 必填              | 说明                                                                      |
| ---------------------------- | ------ | ----------------- | ------------------------------------------------------------------------- |
| `ontologyLinkUniqIdentifier` | String | **是**            | 关系唯一标识                                                              |
| `targetStatus`               | String | **新增/修改必填** | `"ENABLE"` / `"DISABLE"`（新增还允许 `"DELETE"`）                         |
| `visibilityWindows`          | Array  | **新增必填**      | 持续时段列表，每项 `{startTime: <epoch_millis>, endTime: <epoch_millis>}` |

**语义规则**：

- **新增**：`targetStatus` + `visibilityWindows` 必填，原样写到图库的边上
- **修改**：`targetStatus` 必填（不能是 DELETE），`visibilityWindows` 填了才改、不填保留边上原值
- **删除**：`targetStatus` 和 `visibilityWindows` 都不传，边上已有的时段原样保留，只把状态置为 DELETE

**示例 - 新增关系（带持续时段）**：

```json
{
  "ontologyIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
  "categoryId": 14,
  "actionApi": "act.lk.carry.create",
  "displayName": "搭载关系-新增",
  "actionKind": "BASE",
  "subjectType": "LINK",
  "operation": "CREATE",
  "linkMapping": {
    "ontologyLinkUniqIdentifier": "4ed7c4da646f4006bec301815b61debb",
    "targetStatus": "ENABLE",
    "visibilityWindows": [
      {
        "startTime": 1767225600000,
        "endTime": 1798761599000
      }
    ]
  }
}
```

**示例 - 修改关系状态（保留原有时段）**：

```json
{
  "ontologyIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
  "categoryId": 14,
  "actionApi": "act.lk.carry.disable",
  "displayName": "搭载关系-停用",
  "actionKind": "BASE",
  "subjectType": "LINK",
  "operation": "UPDATE",
  "linkMapping": {
    "ontologyLinkUniqIdentifier": "4ed7c4da646f4006bec301815b61debb",
    "targetStatus": "DISABLE"
  }
}
```

**示例 - 删除关系（只置状态，不传时段）**：

```json
{
  "ontologyIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
  "categoryId": 14,
  "actionApi": "act.lk.carry.delete",
  "displayName": "搭载关系-删除",
  "actionKind": "BASE",
  "subjectType": "LINK",
  "operation": "DELETE",
  "linkMapping": {
    "ontologyLinkUniqIdentifier": "4ed7c4da646f4006bec301815b61debb"
  }
}
```

---

### 3.4 基础算子行为（`actionKind=BASE`, `subjectType=BASIC_OPERATOR`）

绑定 `BASIC_QUERY` 算子，只读，`outputMode` 固定 `RESULT_ONLY`。

| 字段          | 类型   | 必填   | 说明                                              |
| ------------- | ------ | ------ | ------------------------------------------------- |
| `subjectType` | String | **是** | 固定 `"BASIC_OPERATOR"`                           |
| `functionApi` | String | **是** | BASIC_QUERY 算子 api                              |
| `outputMode`  | String | 否     | 固定 `"RESULT_ONLY"`（不传也行）                  |
| `mappingIns`  | Array  | 否     | 变量绑定（**必须用** `FIXED` **传属性 apiName**） |

**关键限制**：BASIC_QUERY 算子的变量绑定需要的是**属性的 apiName**（用于构建 SQL 的列名），不是属性的数据值。因此 `sourceType` **只能用** `FIXED`，`sourceConfig` 填属性的 apiName。

**为什么不能用** `sourceType=PROPERTY`：

- `PROPERTY` 会在执行时取具体实例的属性数据值（如 "F-22"）
- 但 BASIC_QUERY 需要的是属性 apiName（如 "name"）来构建 SQL
- 如果传数据值，SQL 会变成 `SELECT "F-22" FROM table`，这是错误的

**示例**：

假设 BASIC_QUERY 算子 `act.bq.aircraft` 的 queryConfig 定义了一个变量 `nm`（代表要查询的属性），前端需要把 `nm` 绑定到 "name" 属性：

```json
{
  "ontologyIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
  "categoryId": 14,
  "actionApi": "act.bo.aircraft",
  "displayName": "基础算子-查飞机",
  "description": "基础算子行为：绑定 BASIC_QUERY，只查询不回写",
  "actionKind": "BASE",
  "subjectType": "BASIC_OPERATOR",
  "functionApi": "act.bq.aircraft",
  "outputMode": "RESULT_ONLY",
  "mappingIns": [
    {
      "functionParamId": 2292,
      "parameterName": "nm",
      "sourceType": "FIXED",
      "sourceConfig": "name"
    }
  ]
}
```

**执行时**：

- 行为测试只需传 `entityPrimaryKey`（指定查哪个实例的数据）
- 算子内部用 `sourceConfig` 里的 "name" 作为列名构建 SQL：`SELECT name FROM table WHERE ...`
- 返回该实例的 name 属性值

---

### 3.5 应用行为（`actionKind=APPLICATION`）

绑定 CUSTOMIZE/EXTERNAL/CONTAINER 算子，必须绑一条关系。

| 字段          | 类型   | 必填   | 说明                                                                                                       |
| ------------- | ------ | ------ | ---------------------------------------------------------------------------------------------------------- |
| `functionApi` | String | **是** | 算子 api                                                                                                   |
| `outputMode`  | String | **是** | `"RESULT_ONLY"`（仅返回）/ `"WRITE_PROPERTY"`（写回属性）                                                  |
| `linkMapping` | Object | **是** | 关系绑定（应用行为的边落位只看算子返回的 `startTime/endTime`，与 `targetStatus`/`visibilityWindows` 无关） |

**linkMapping**：

| 字段                                  | 类型   | 必填   | 说明                                       |
| ------------------------------------- | ------ | ------ | ------------------------------------------ |
| `ontologyLinkUniqIdentifier`          | String | **是** | 关系唯一标识                               |
| `ontologyLinkFunctionParamExpression` | String | 否     | **已废弃**，仅存储，执行时不再参与关系判定 |

**mappingIns 入参绑定**（重点：对象入参的子字段绑定）：

| 字段                       | 类型    | 必填                       | 说明                                                                                                                                         |
| -------------------------- | ------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `functionParamId`          | Integer | **是**                     | 函数入参 id（从 `GET /function/detail` 获取；**对象入参的子字段没有独立 paramId，用顶层参数的 paramId**）                                    |
| `paramPath`                | String  | **对象入参子字段必填**     | 子字段路径（相对参数名按点分层级，如 `position.longitude`；带上参数名前缀也可识别，如 `pos.position.longitude` 等价于 `position.longitude`） |
| `propertyUniqueIdentifier` | String  | sourceType=PROPERTY 时必填 | 属性标识                                                                                                                                     |
| `parameterName`            | String  | sourceType=EXTERNAL 时必填 | 参数名（行为测试时从 `params.<parameterName>` 取值）                                                                                         |
| `sourceType`               | String  | 否                         | `"PROPERTY"` / `"EXTERNAL"` / `"FIXED"`，默认 `PROPERTY`                                                                                     |
| `sourceConfig`             | String  | sourceType=FIXED 时必填    | 固定值字面量                                                                                                                                 |

**出参绑定**（仅 `WRITE_PROPERTY` 需要）：

| 字段                       | 类型    | 必填   | 说明                                                  |
| -------------------------- | ------- | ------ | ----------------------------------------------------- |
| `functionParamId`          | Integer | **是** | 函数出参 id                                           |
| `propertyUniqueIdentifier` | String  | **是** | 要写回的属性标识                                      |
| `functionParamExpression`  | String  | **是** | JsonPath（如 `"$.newName"`），作用于算子返回的 `data` |

#### 3.5.1 对象入参的子字段绑定（paramPath）

**场景**：算子的某个入参类型是 OBJECT（自定义类），前端需要把该对象的多个子字段分别绑定到不同的属性或外部输入。

**规则**：

1. **子字段没有独立的 paramId**：`GET /action` 的 `functionParams` 只返回顶层参数，不包含 `fields`。要获取子字段树，前端必须调用 `GET /function/detail?functionApi=<api>&spaceId=<spaceId>`，从 `params[].fields` 读取嵌套结构。
2. **paramPath 是相对路径**：从参数名开始按点分层级，如参数名 `pos` 有子字段 `lng`/`lat`，则 `paramPath` 填 `lng` 或 `lat`（不带参数名前缀）；也可以带前缀 `pos.lng`，后端会自动去掉。
3. **同一 functionParamId 可以出现多次**：每次用不同的 `paramPath` 绑定不同的子字段。
4. **整包绑定与子字段绑定互斥**：如果同一 `functionParamId` 既有一条不带 `paramPath` 的绑定（整包），又有带 `paramPath` 的绑定（子字段），执行时整包取值优先，子字段不生效。
5. **类型校验**：创建时后端会按 `paramPath` 在算子声明的 `fields` 树里逐层定位，取出子字段的声明类型，与绑定的属性类型比对；不匹配会报 `行为属性类型与函数参数类型不匹配`。
6. **路径不存在**：如果 `paramPath` 指向的子字段在算子声明里不存在，会报 `算子入参 <paramName> 不存在子字段：<paramPath>`。

**示例 - 对象入参逐子字段绑定**：

假设算子 `act.fn.obj` 有一个 INPUT 参数 `pos`（类型 OBJECT），声明了两个子字段 `lng`（DOUBLE）和 `lat`（DOUBLE）。前端需要把 `lng` 绑定到属性 `max_mach`，`lat` 作为外部输入。

```json
{
  "ontologyIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
  "categoryId": 14,
  "actionApi": "act.ap.obj.nested",
  "displayName": "应用行为-对象子字段绑定",
  "description": "验证 OBJECT 入参按子字段绑定：lng 取属性，lat 外部输入",
  "actionKind": "APPLICATION",
  "functionApi": "act.fn.obj",
  "outputMode": "RESULT_ONLY",
  "linkMapping": {
    "ontologyLinkUniqIdentifier": "4ed7c4da646f4006bec301815b61debb"
  },
  "mappingIns": [
    {
      "functionParamId": 2298,
      "paramPath": "lng",
      "propertyUniqueIdentifier": "7f7f85dc5c68422aba360ca89d7b6831",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "parameterName": "lng",
      "sourceType": "PROPERTY"
    },
    {
      "functionParamId": 2298,
      "paramPath": "lat",
      "parameterName": "lat",
      "sourceType": "EXTERNAL"
    }
  ]
}
```

**执行时**：后端会把两条绑定组装成一个嵌套对象 `{"lng": <属性值>, "lat": <外部输入值>}`，传给算子的 `pos` 参数。

**示例 - 整包绑定（不传 paramPath）**：

如果算子接受整个对象一次取值（比如从某个属性直接取一个 JSON 对象），可以不传 `paramPath`，用一条绑定完成：

```json
{
  "functionParamId": 2298,
  "propertyUniqueIdentifier": "7f7f85dc5c68422aba360ca89d7b6831",
  "sourceType": "PROPERTY"
}
```

此时 `propertyUniqueIdentifier` 指向的属性类型必须是 OBJECT（自定义类），否则创建时会报 `行为属性类型与函数参数类型不匹配`。

#### 3.5.2 应用行为的边落位（算子返回窗口）

**规则**：应用行为执行后，是否写入/更新实例关系边，**只看算子返回的** `startTime`**/**`endTime`，与行为定义里的 `targetStatus`/`visibilityWindows` 无关。

- **算子返回了 startTime + endTime**：
  - 边不存在 → 新建边，状态 ENABLE，时段写入
  - 边已存在 → 更新边的 startTime/endTime/timeWindows，状态置为 ENABLE
- **算子没返回 startTime 或 endTime**：整段跳过，不建不删不改

**算子返回示例**（Groovy 脚本）：

```groovy
def handle(max_mach) {
    def now = System.currentTimeMillis()
    return [
        startTime: now,
        endTime: now + 86400000L,
        timeWindows: [[startTime: now, endTime: now + 86400000L]],
        data: [result: "ok"]
    ]
}
```

**示例 - 应用行为（算子返回窗口，自动建边）**：

```json
{
  "ontologyIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
  "categoryId": 14,
  "actionApi": "act.ap.window",
  "displayName": "应用行为-按窗口建边",
  "actionKind": "APPLICATION",
  "functionApi": "act.fn.window",
  "outputMode": "RESULT_ONLY",
  "linkMapping": {
    "ontologyLinkUniqIdentifier": "4ed7c4da646f4006bec301815b61debb"
  },
  "mappingIns": [
    {
      "functionParamId": 2301,
      "propertyUniqueIdentifier": "7f7f85dc5c68422aba360ca89d7b6831",
      "parameterName": "max_mach",
      "sourceType": "PROPERTY"
    }
  ]
}
```

---

### 3.6 完整示例 - 应用行为写回属性

```json
{
  "ontologyIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
  "categoryId": 14,
  "actionApi": "act.ap.rename",
  "displayName": "应用行为-改名并刷新速度",
  "description": "应用行为：出参写回 name 和 max_mach",
  "actionKind": "APPLICATION",
  "functionApi": "act.fn.rename",
  "outputMode": "WRITE_PROPERTY",
  "linkMapping": {
    "ontologyLinkUniqIdentifier": "4ed7c4da646f4006bec301815b61debb"
  },
  "mappingIns": [
    {
      "functionParamId": 2287,
      "propertyUniqueIdentifier": "1d63fe1e5e794e449fb1ca514605c1f6",
      "parameterName": "name",
      "sourceType": "PROPERTY"
    },
    {
      "functionParamId": 2289,
      "propertyUniqueIdentifier": "7f7f85dc5c68422aba360ca89d7b6831",
      "parameterName": "max_mach",
      "sourceType": "PROPERTY"
    },
    {
      "functionParamId": 2288,
      "propertyUniqueIdentifier": "1d63fe1e5e794e449fb1ca514605c1f6",
      "parameterName": "newName",
      "sourceType": "PROPERTY",
      "functionParamExpression": "$.newName"
    },
    {
      "functionParamId": 2288,
      "propertyUniqueIdentifier": "7f7f85dc5c68422aba360ca89d7b6831",
      "parameterName": "speed",
      "sourceType": "PROPERTY",
      "functionParamExpression": "$.speed"
    }
  ]
}
```

---
