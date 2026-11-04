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

| 字段                       | 类型   | 必填   | 说明                           |
| -------------------------- | ------ | ------ | ------------------------------ |
| `propertyUniqueIdentifier` | String | **是** | 属性唯一标识                   |
| `ontologyUniqueIdentifier` | String | **是** | 本体标识（同外层）             |
| `parameterName`            | String | 否     | 参数名（不传则用属性 apiName） |
| `sourceType`               | String | 否     | `"EXTERNAL"`（外部输入）       |
| ）                         |

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
| `targetStatus`               | String | **新增/修改必填** | `"ENABLE"` / `"DELETE"`/`" DISABLE "`                                     |
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
    "targetStatus": "DELETE"
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

---

## 请求体（`ActionCreateOrUpdateParam`）

| 字段名               | 类型                                  | 必填 | 说明                                                                    |
| -------------------- | ------------------------------------- | ---- | ----------------------------------------------------------------------- |
| `actionApi`          | String                                | 是   | 行为 api（空间内唯一，建议用 `act.ap.` 前缀）                           |
| `displayName`        | String                                | 是   | 行为显示名称                                                            |
| `description`        | String                                | 否   | 行为描述                                                                |
| `icon`               | String                                | 否   | 图标 URL                                                                |
| `categoryId`         | Integer                               | 是   | 所属行为分类 id                                                         |
| `ontologyIdentifier` | String                                | 否   | 对象唯一标识（行为挂载的对象；**应用行为可不传**，空间 id 从分类推导）  |
| `actionKind`         | ActionKindEnum                        | 是   | **固定为 `APPLICATION`**                                                |
| `functionApi`        | String                                | 是   | 绑定的算子 api（必须已发布，`publishStatus=1`）                         |
| `outputMode`         | ActionOutputModeEnum                  | 是   | 输出方式：`RESULT_ONLY`（仅返回结果）/ `WRITE_PROPERTY`（写入对象属性） |
| `linkMapping`        | ActionLinkMappingParam                | 是   | **应用行为必须绑定一条对象关系**                                        |
| `mappingIns`         | List\<ActionParamMappingCreateParam\> | 是   | 参数绑定列表（绑定算子入参的取值来源）                                  |

---

## 子对象字段说明

### ActionLinkMappingParam（关系映射）

| 字段名                       | 类型   | 必填 | 说明                                       |
| ---------------------------- | ------ | ---- | ------------------------------------------ |
| `ontologyLinkUniqIdentifier` | String | 是   | 关系唯一标识（通过 `GET /link/list` 获取） |

> **重要**：应用行为必须绑定一条对象关系，否则创建时报「该行为必须绑定一条对象关系」。

### ActionParamMappingCreateParam（参数绑定）

| 字段名                     | 类型                  | 必填     | 说明                                                                              |
| -------------------------- | --------------------- | -------- | --------------------------------------------------------------------------------- |
| `parameterName`            | String                | 是       | 算子入参名（与函数 `parameters` 里的 `paramName` 对应）                           |
| `functionParamId`          | Long                  | 是       | 函数参数 id（从 `GET /function/detail` 的 `data.parameters[].id` 获取）           |
| `functionParamExpression`  | String                | 是       | 属性 apiName（`sourceType=PROPERTY` 时填写，从实体属性取值）                      |
| `propertyUniqueIdentifier` | String                | 是       | 属性唯一标识                                                                      |
| `ontologyUniqueIdentifier` | String                | 是       | 属性所属对象唯一标识                                                              |
| `sourceType`               | ActionParamSourceEnum | 是       | 取值来源：`PROPERTY`（从实体属性取值）/ `EXTERNAL`（外部输入）/ `FIXED`（固定值） |
| `sourceConfig`             | String                | 条件必填 | 固定值内容。**`sourceType=FIXED` 时必填**                                         |
| `paramPath`                | String                | 否       | 对象入参的子字段路径（算子入参类型为 `OBJECT` 时使用，如 `address.city`）         |

---

## 创建约束

1. **`actionKind` 必须为 `APPLICATION`**
2. **`functionApi` 必填**：应用行为必须绑定算子
3. **`outputMode` 必填**：`RESULT_ONLY` 或 `WRITE_PROPERTY`
4. **`linkMapping` 必填**：必须绑定一条对象关系（`ontologyLinkUniqIdentifier` 不能为空）
5. **`mappingIns` 必填**：必须覆盖算子的所有 INPUT 参数
6. **绑定的算子必须已发布**：发布行为时会校验 `function.publishStatus == 1`，但创建时不校验

---

## 示例

### 示例 1：参数从实体属性取值（`sourceType=PROPERTY`）

```json
{
  "actionApi": "act.ap.aircraft.greeting",
  "displayName": "飞机问候语行为",
  "description": "调用脚本函数生成飞机问候语",
  "categoryId": 14,
  "actionKind": "APPLICATION",
  "functionApi": "act.fn.aircraft.greeting",
  "outputMode": "RESULT_ONLY",
  "linkMapping": {
    "ontologyLinkUniqIdentifier": "4ed7c4da646f4006bec301815b61debb"
  },
  "mappingIns": [
    {
      "functionParamId": 3001,
      "functionParamExpression": "name",
      "parameterName": "name",
      "propertyUniqueIdentifier": "1d63fe1e5e794e449fb1ca514605c1f6",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "sourceType": "PROPERTY"
    },
    {
      "functionParamId": 3002,
      "functionParamExpression": "max_mach",
      "parameterName": "max_mach",
      "propertyUniqueIdentifier": "7f7f85dc5c68422aba360ca89d7b6831",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "sourceType": "PROPERTY"
    }
  ]
}
```

> **说明**：
>
> - `functionParamId` 从 `GET /function/detail?functionApi=act.fn.aircraft.greeting&version=1.0.0&spaceId=156` 获取
> - `propertyUniqueIdentifier` 从对象属性列表获取
> - `sourceType=PROPERTY`：参数值从实体属性自动读取，测试/执行时不需要传 `params`

### 示例 2：参数从外部输入取值（`sourceType=EXTERNAL`）

```json
{
  "actionApi": "act.ap.aircraft.greeting.external",
  "displayName": "飞机问候语行为（外部输入）",
  "description": "参数来自外部输入",
  "categoryId": 14,
  "actionKind": "APPLICATION",
  "functionApi": "act.fn.aircraft.greeting",
  "outputMode": "RESULT_ONLY",
  "linkMapping": {
    "ontologyLinkUniqIdentifier": "4ed7c4da646f4006bec301815b61debb"
  },
  "mappingIns": [
    {
      "functionParamId": 3001,
      "functionParamExpression": "name",
      "parameterName": "name",
      "propertyUniqueIdentifier": "1d63fe1e5e794e449fb1ca514605c1f6",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "sourceType": "EXTERNAL"
    },
    {
      "functionParamId": 3002,
      "functionParamExpression": "max_mach",
      "parameterName": "max_mach",
      "propertyUniqueIdentifier": "7f7f85dc5c68422aba360ca89d7b6831",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "sourceType": "EXTERNAL"
    }
  ]
}
```

> **说明**：
>
> - `sourceType=EXTERNAL`：参数值来自测试/执行时的 `params` 参数
> - 测试时传：`{"params": {"name": "F-22", "max_mach": 2.25}}`

### 示例 3：参数使用固定值（`sourceType=FIXED`）

```json
{
  "actionApi": "act.ap.aircraft.greeting.fixed",
  "displayName": "飞机问候语行为（固定值）",
  "description": "参数使用固定值",
  "categoryId": 14,
  "actionKind": "APPLICATION",
  "functionApi": "act.fn.aircraft.greeting",
  "outputMode": "RESULT_ONLY",
  "linkMapping": {
    "ontologyLinkUniqIdentifier": "4ed7c4da646f4006bec301815b61debb"
  },
  "mappingIns": [
    {
      "functionParamId": 3001,
      "functionParamExpression": "name",
      "parameterName": "name",
      "propertyUniqueIdentifier": "1d63fe1e5e794e449fb1ca514605c1f6",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "sourceType": "FIXED",
      "sourceConfig": "F-22"
    },
    {
      "functionParamId": 3002,
      "functionParamExpression": "max_mach",
      "parameterName": "max_mach",
      "propertyUniqueIdentifier": "7f7f85dc5c68422aba360ca89d7b6831",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "sourceType": "FIXED",
      "sourceConfig": "2.25"
    }
  ]
}
```

> **说明**：
>
> - `sourceType=FIXED`：参数值固定，`sourceConfig` 填写固定值（字符串格式）
> - 测试/执行时不需要传 `params`

### 示例 4：输出方式写入对象属性（`outputMode=WRITE_PROPERTY`）

```json
{
  "actionApi": "act.ap.aircraft.update.speed",
  "displayName": "更新飞机最大速度",
  "description": "计算并更新飞机最大速度",
  "categoryId": 14,
  "actionKind": "APPLICATION",
  "functionApi": "act.fn.calculate.speed",
  "outputMode": "WRITE_PROPERTY",
  "linkMapping": {
    "ontologyLinkUniqIdentifier": "4ed7c4da646f4006bec301815b61debb"
  },
  "mappingIns": [
    {
      "functionParamId": 4001,
      "functionParamExpression": "current_speed",
      "parameterName": "current_speed",
      "propertyUniqueIdentifier": "7f7f85dc5c68422aba360ca89d7b6831",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "sourceType": "PROPERTY"
    },
    {
      "functionParamId": 4002,
      "functionParamExpression": "max_mach",
      "parameterName": "max_mach",
      "propertyUniqueIdentifier": "7f7f85dc5c68422aba360ca89d7b6831",
      "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "sourceType": "PROPERTY",
      "paramPath": "value"
    }
  ]
}
```

> **说明**：
>
> - `outputMode=WRITE_PROPERTY`：算子输出按 `mappingIns` 的出参绑定写回对象属性
> - `paramPath`：对象入参的子字段路径（算子入参类型为 `OBJECT` 时使用）

---

## 响应

**成功响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```
