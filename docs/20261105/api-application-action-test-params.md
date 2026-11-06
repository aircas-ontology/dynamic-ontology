# 应用行为测试传参说明（全类型）

**接口**：`POST /ontology/action/test`
**鉴权**：`access-token: Bearer <token>`
**Content-Type**：`application/json`

本文只讲「测试应用行为」时请求体怎么传：每个字段的作用、什么时候必须传、各种取值类型和实例选择方式。
应用行为从创建到发布的完整流程见 [api-application-action.md](./api-application-action.md)。

---

## 1. 请求体（`ActionTestParam`）

| 字段名 | 类型 | 必填 | 一句话作用 |
|--------|------|------|-----------|
| `ontologySpaceId` | Integer | 是 | 定位行为所在空间 |
| `actionApi` | String | 是 | 要测试的行为 api |
| `entityPrimaryKey` | Object | 否 | 单个实例主键；仅行为带顶层对象时生效 |
| `entityPrimaryKeys` | Map\<String, Object\> | 否 | 对象 id → 实例主键，映射涉及几个对象就配几个 |
| `linkEntityPrimaryKey` | Object | 否 | 关系对端实例主键；传了只跑这一对 |
| `params` | Map\<String, Object\> | 否 | `EXTERNAL` 入参的取值 |
| `dataPrimaryKey` | Object | 否 | 应用行为不使用 |

### 1.1 每个字段的详细作用

**`ontologySpaceId`**

- 作用：行为按「空间 id + api」唯一。后端先用它限定空间，再按 `actionApi` 找行为定义，同时也用这个空间去找绑定的算子。
- 什么时候传：永远必传。
- 传错的后果：与 `actionApi` 组合查不到行为，返回 `无效的 action api`。

**`actionApi`**

- 作用：指定要测试的行为。后端据它加载行为的 `mappingIns`、`linkMapping`、算子参数定义，请求里的其他参数都围绕这份定义生效。
- 什么时候传：永远必传。

**`entityPrimaryKey`**

- 作用：「行为挂载对象」的单个实例主键的简写，后端把它归属到行为的顶层 `ontologyIdentifier`。
- 生效条件：**行为创建时传了顶层 `ontologyIdentifier`**。
- 不生效的情况：行为没有顶层对象时（新建应用行为通常不传对象），该字段会被忽略，不会报错，但实例也选不上，需要改用 `entityPrimaryKeys`。
- 类型：与图库节点主键一致，图库存数字就传 `1`，不要传 `"1"`。

**`entityPrimaryKeys`**

- 作用：给映射涉及的每个对象指定本次使用的实例，格式是「对象唯一标识（`ontology_meta.unique_identifier`）→ 实例主键」。
- 必须用的场景：
  - 行为没有顶层 `ontologyIdentifier`：没有别的途径把实例归属到对象；
  - `PROPERTY`/`OBJECT`/`LIST` 入参对应的属性属于本端或第三方对象；
  - `WRITE_PROPERTY` 出参要写回哪个对象，就要给哪个对象的实例。
- 关系对端对象不用放进来：它由 `linkEntityPrimaryKey` 或全量遍历提供。
- 与 `linkEntityPrimaryKey` 同时给对端实例时，以 `linkEntityPrimaryKey` 为准。

**`linkEntityPrimaryKey`**

- 作用：指定关系对端的实例，**收窄执行范围**。
- 传了：只跑「本端实例 + 这一个对端实例」一对。
- 不传：对端对象下的**全部实例**逐个跑一遍，`result` 数组里会有多条。
- 取值来源：对端实例按主键直接查询，不校验它与本端当前是否已经有边。
- 场景：行为绑定了 `linkMapping`，且本次只想验证某一个对端数据。

**`params`**

- 作用：给 `sourceType=EXTERNAL` 的入参行提供值。
- key：该行的 `parameterName`；创建时没填 `parameterName` 就取算子参数名。
- 不放这里：`FIXED` 的值在定义 `sourceConfig` 里；`PROPERTY`/`OBJECT`/`LIST` 从实例数据读。
- 缺 key：该入参为空值，算子可能因此执行失败或返回空。
- 类型：后端原样透传，不做类型转换，见第 2 节。

**`dataPrimaryKey`**

- 应用行为的执行链路完全不使用。
- 只有基础行为「属性值-修改/删除」用它定位分组表里的行；应用行为传了也不生效。

---

## 2. `params` 支持的值类型

| 算子 `paramType` | `params` 里传的 JSON | 示例 |
|---|---|---|
| `STRING` | 字符串 | `"F-22"` |
| `INTEGER` | 数字 | `10` |
| `LONG` | 数字（大整数） | `9007199254740993` |
| `DOUBLE` | 数字 | `2.25` |
| `BOOLEAN` | 布尔 | `true` |
| `LIST` | 数组 | `["fighter","stealth"]` |
| `OBJECT` | 嵌套对象 | `{"status":"OK","range":{"start":"2026-01-01"}}` |
| 空值 | `null` | `"remark": null` |

注意：

- 脚本要求数字时不要传 `"2.25"`，后端不做隐式转换。
- 对象入参按子字段绑 `EXTERNAL` 时，创建定义里每条子字段必须显式填**不同的** `parameterName`，否则会共用算子参数名这一个 key。
- `LIST` 类型走实例属性来源时，返回值是该属性的全部值；走 `EXTERNAL` 时直接传数组。

---

## 3. 实例选择规则

判断标准：**映射行是否用到实例数据**。

以下映射行需要实例：

- 入参 `sourceType` 为 `PROPERTY`、`OBJECT`、`LIST`；
- 出参 `outputMode=WRITE_PROPERTY`。

实例来源按顺序判断：

1. 该对象是关系对端 → 由 `linkEntityPrimaryKey` 提供，或让它全量遍历；
2. 该对象是行为顶层对象，且行为带 `ontologyIdentifier` → 可用 `entityPrimaryKey`；
3. 其他情况 → 必须出现在 `entityPrimaryKeys` 里。

特殊情况：

- 入参全是 `FIXED`/`EXTERNAL`、出参全是 `RESULT_ONLY` 时，可以一个实例都不传。
- 缺实例时执行报：`对象[X]未选择实例数据，无法执行行为：<actionApi>`。

---

## 4. 场景与完整请求示例

### 4.1 不需要任何实例（全 FIXED / EXTERNAL + RESULT_ONLY）

行为定义前提：入参全为 `FIXED`/`EXTERNAL`，出参全为 `RESULT_ONLY`，可不绑关系。

```json
{
  "ontologySpaceId": 156,
  "actionApi": "act.ap.aircraft.greeting.noinstance",
  "params": {
    "name": "F-22",
    "max_mach": 2.25
  }
}
```

### 4.2 EXTERNAL 覆盖所有 JSON 类型

```json
{
  "ontologySpaceId": 156,
  "actionApi": "act.ap.aircraft.typed-params",
  "params": {
    "name": "F-22",
    "sort_no": 10,
    "aircraft_id": 9007199254740993,
    "max_mach": 2.25,
    "enabled": true,
    "remark": null,
    "tags": ["fighter", "stealth"],
    "filter": {
      "status": "OK",
      "range": { "start": "2026-01-01", "end": "2026-11-06" }
    }
  }
}
```

### 4.3 单对象取属性（行为带顶层 `ontologyIdentifier`）

定义：`name`、`max_mach` 为 `PROPERTY`，指向行为所属对象。

```json
{
  "ontologySpaceId": 156,
  "actionApi": "act.ap.aircraft.greeting",
  "entityPrimaryKey": 1,
  "params": {}
}
```

### 4.4 跨多个对象取属性

定义：`name` 来自飞机对象，`env_level` 来自环境场对象。

```json
{
  "ontologySpaceId": 156,
  "actionApi": "act.ap.aircraft.cross-object",
  "entityPrimaryKeys": {
    "ea512d439cd34c6ebbcde6b692261ab5": 1,
    "3f9c2a7d1b8e4c6fa0d0e2b7c1a94360": 100
  },
  "params": {}
}
```

### 4.5 行为没有顶层对象 → 必须用 `entityPrimaryKeys`

创建时不传 `ontologyIdentifier` 的应用行为，执行参数里的对象 id 为空，`entityPrimaryKey` 不会被采纳。
**只涉及一个对象也要写进 `entityPrimaryKeys`。**

```json
{
  "ontologySpaceId": 156,
  "actionApi": "act.ap.aircraft.greeting.nobind",
  "entityPrimaryKeys": {
    "ea512d439cd34c6ebbcde6b692261ab5": 1
  },
  "params": {
    "max_mach": 2.25
  }
}
```

### 4.6 关系对端只跑一个实例

传 `linkEntityPrimaryKey`：只计算「本端实例 + 该对端实例」这一对。

```json
{
  "ontologySpaceId": 156,
  "actionApi": "act.ap.aircraft.with-link",
  "entityPrimaryKeys": {
    "ea512d439cd34c6ebbcde6b692261ab5": 1
  },
  "linkEntityPrimaryKey": 20,
  "params": { "max_mach": 2.25 }
}
```

对端对象的属性入参（`PROPERTY` 且对象是关系另一端）由这个对端实例提供，不需要再写进 `entityPrimaryKeys`。

### 4.7 关系对端全量遍历

不传 `linkEntityPrimaryKey`：对端对象的所有实例各跑一次，`result` 是多次结果组成的 JSON 数组字符串。

```json
{
  "ontologySpaceId": 156,
  "actionApi": "act.ap.aircraft.with-link",
  "entityPrimaryKeys": {
    "ea512d439cd34c6ebbcde6b692261ab5": 1
  },
  "params": {}
}
```

### 4.8 出参写属性（WRITE_PROPERTY）

定义：输出 `greeting` 写回飞机对象属性，输出 `env_remark` 写回环境场对象属性。

```json
{
  "ontologySpaceId": 156,
  "actionApi": "act.ap.aircraft.write-property",
  "entityPrimaryKeys": {
    "ea512d439cd34c6ebbcde6b692261ab5": 1,
    "3f9c2a7d1b8e4c6fa0d0e2b7c1a94360": 100
  },
  "params": {}
}
```

少任何一个写回目标对象的实例都会报：

```
对象[xxx]未选择实例数据，无法执行行为：<actionApi>
```

### 4.9 对象入参按子字段绑定（PROPERTY + FIXED + EXTERNAL 混用）

定义：算子 `filter` 是 OBJECT，`filter.status` 绑属性、`filter.range.start` 固定值、`filter.keyword` 外部输入。

```json
{
  "ontologySpaceId": 156,
  "actionApi": "act.ap.aircraft.nested-bind",
  "entityPrimaryKeys": {
    "ea512d439cd34c6ebbcde6b692261ab5": 1
  },
  "params": {
    "keyword": "fighter"
  }
}
```

这里只传 `EXTERNAL` 的 `keyword`；`FIXED` 的值在行为定义 `sourceConfig` 里，`PROPERTY` 的值从实例读。

### 4.10 LIST 入参的两种来源

**① `sourceType=LIST`（绑对象多值属性）**：测试时不用在 `params` 传，实例里该属性的全部值组成数组。

```json
{
  "ontologySpaceId": 156,
  "actionApi": "act.ap.aircraft.list-from-property",
  "entityPrimaryKeys": {
    "ea512d439cd34c6ebbcde6b692261ab5": 1
  }
}
```

**② `sourceType=EXTERNAL`（数组由调用方给）**：

```json
{
  "ontologySpaceId": 156,
  "actionApi": "act.ap.aircraft.list-from-external",
  "params": {
    "tags": ["fighter", "stealth"]
  }
}
```

---

## 5. 创建侧 `mappingIns` 每行字段的作用

测试传参依赖行为定义，`mappingIns` 每行的字段含义如下：

| 字段 | 作用 |
|------|------|
| `functionParamId` | 这行绑定算子的哪个参数（`GET /function/detail` 的 `paramId`）。对象参数的子字段绑定填**顶层参数 id** |
| `parameterName` | `EXTERNAL` 的取值键，对应测试请求 `params` 的 key；不填默认算子参数名 |
| `sourceType` | 值从哪里来：`PROPERTY` 实例属性（默认）/ `OBJECT` 对象 / `LIST` List / `FIXED` 固定值 / `EXTERNAL` 外部输入 |
| `sourceConfig` | `FIXED` 的固定值字面量；合法 JSON 按 JSON 解析，否则按原文本 |
| `propertyUniqueIdentifier` | 取值/回写的具体属性；`PROPERTY`/`OBJECT`/`LIST` 入参和 `WRITE_PROPERTY` 出参必填 |
| `ontologyUniqueIdentifier` | 这行属于哪个对象，决定测试时要给哪个对象实例；`WRITE_PROPERTY` 出参必填 |
| `paramPath` | 对象入参的子字段路径，如 `position.longitude`；同一 `functionParamId` 的多行靠它区分 |
| `functionParamExpression` | 只对出参有效，算子结果的 JsonPath，如 `data.greeting` |
| `outputMode` | 只对出参有效：`RESULT_ONLY` 仅返回 / `WRITE_PROPERTY` 写回属性 |

---

## 6. 响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "actionApi": "act.ap.aircraft.greeting",
    "message": "行为执行成功",
    "result": "[{\"data\":{\"greeting\":\"飞机 F-22 的最大速度是 2.25 马赫\"},\"description\":\"aircraft greeting\"}]"
  }
}
```

| 字段 | 作用 |
|------|------|
| `code` / `message` | 接口层结果。`200` 表示测试流程未抛错 |
| `data.actionApi` | 回显本次测试的行为 api |
| `data.message` | 本次执行的动作说明（成功为 `行为执行成功`） |
| `data.result` | 字符串形式的 JSON 数组，每个元素是一次算子调用的 `FunctionResultVO`（含 `data`、`description`）。无关系时通常 1 个元素，对端全量遍历时有 N 个 |

---

## 7. 错误码与排查

| 错误信息 | 原因与处理 |
|----------|-----------|
| `无效的 action api` | `ontologySpaceId` + `actionApi` 查不到行为，检查空间 id 和行为 api |
| `行为树不支持按单个行为测试` | 传的是 `actionKind=TREE` 的 api |
| `对象[X]未选择实例数据，无法执行行为` | 映射用到该对象但没给实例：补 `entityPrimaryKeys`；无顶层对象的应用行为不能只传 `entityPrimaryKey` |
| `对象[X]未配置主键属性，无法写回` | `WRITE_PROPERTY` 的目标对象没有主键属性，属于定义问题 |
| 外部参数取到 `null` | `params` 的 key 与 `parameterName` 不一致；不填 `parameterName` 时默认取算子参数名 |

---

## 8. 速查

| 情况 | 要传什么 |
|------|----------|
| 只用外部输入/固定值，出参仅返回 | `ontologySpaceId` + `actionApi` + `params` |
| 属性来自行为顶层对象 | 老行为可用 `entityPrimaryKey` |
| 新建应用行为（无顶层对象） | `entityPrimaryKeys` |
| 属性来自多个对象 | `entityPrimaryKeys` 每个对象一项 |
| 关系对端只测一个 | `linkEntityPrimaryKey` |
| 关系对端全测 | 不传 `linkEntityPrimaryKey` |
| 出参写属性 | 写回目标对象必须有实例 |
| 外部输入 | `params`，key 与 `parameterName` 一致 |
