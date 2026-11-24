# 规则调度创建入参（前端对接）

- 创建：`POST /action/scheduling`，`type=RULE`
- 编辑：`PUT /action/scheduling`，结构完全一致，最外层多一个必填 `id`；处于 START 的调度不能编辑，需先暂停
- 启动：`POST /action/scheduling/start/RULE/{id}`（新建调度为 STOP，不启动不会触发）
- 详情回显：`GET /action/scheduling/detail?id={id}&type=RULE`，`ruleVO.judgeRules` 与提交结构一致，可直接用于编辑回填

两种写法：**旧传值**是属性比较条件（原有能力）；**新传值**是监测条件（本次新增，先选事件类型再加条件）。同一个调度里不同规则组可以混用，但**同一个规则组内**只能二选一。

---

## 一、公共字段（两种写法一致）

| 字段 | 必填 | 说明 |
|---|---|---|
| `spaceId` | 是 | 行为所属空间 id |
| `type` | 是 | 固定 `RULE` |
| `actionApi` | 是 | 要调度的行为 api（行为必须绑定了算子） |
| `name` | 是 | 调度名称 |
| `description` | 否 | 调度描述 |
| `ontologyIdentifier` | 否 | 行为挂载对象唯一标识；应用行为/多对象行为可不传 |
| `rule.judgeRules` | 是 | 规则组数组，每条 = 组合条件 + 命中后执行的行为参数 |
| `rule.flowDocument` | 否 | 前端画布文档字符串，后端只存不解析，详情原样返回用于回显 |
| `rule.judgeRules[i].condition` | 否 | 组级取反：`true` 时整组条件不成立才执行（else 语义），默认 `false` |
| `rule.judgeRules[i].actionParam` | 是 | 命中后执行的行为参数，字段见下 |

`actionParam`：

| 字段 | 必填 | 说明 |
|---|---|---|
| `action_api` | 是 | 行为 api，兼容 `actionApi` |
| `ontology_identifier` | 否 | 执行目标对象，兼容 `ontologyIdentifier` |
| `entity_identifiler` | 否 | 执行目标实例主键（注意后端字段名拼写为 `entity_identifiler`，也兼容 `entity_identifier` / `entityIdentifier`） |
| `entity_json` | 否 | 完整执行参数 JSON 字符串（与行为测试 ActionTestParam 同形式，支持数组批量）；不传按行为定义构造最小参数 |

条件项的括号/连接符（两种写法共用）：

- `isLeft` / `isRight`：本条件前左括号 / 后右括号个数，`((` 传 2；兼容旧布尔传法 `true`=1、`false`=0
- `linkFlag`：与下一条的连接符 `AND` / `OR`，非最后一条必填
- 求值规则：`AND` 优先于 `OR`，括号可改变优先级

---

## 二、旧传值：属性比较条件（原有能力）

**特点**：不传 `monitorType`、不传 `storageGroup`；条件项 = 左操作数与右操作数比较。

- `leftOperate`：`dynamic` 取实例属性当前值，需 `OntologyId`、`entityId`、`propertyId` 或 `propertyName`（`propertyId` 优先）
- `rightOperate`：`fixed` 用 `fixValue`；也可以 `dynamic` 用另一个实例属性
- `dataPrimaryKey`：可选，属性在扩展存储分组时指定取哪一行，不传按主键倒序取最新行；主表属性忽略
- `condition`：数字 `LT` / `LE` / `EQ` / `NE` / `GT` / `GE`；字符串 `CONTAINS` / `NOT_CONTAINS` / `EQ` / `NE`（大小比较仅限数字，不支持 `CH`）
- 触发时机：主表实例发生变更，且变更字段命中操作数引用的属性时才评估
- 启动调度时会对条件绑定的实例评估一遍存量数据

**复杂示例**：`(longitude GT 20 OR speed GE 10) AND (status EQ run OR battery LT 30)`

```json
{
  "spaceId": 156,
  "type": "RULE",
  "actionApi": "shipLocation",
  "name": "属性条件复杂组合",
  "description": "(经度>20 或 速度>=10) 且 (状态为run 或 电量<30) 时执行",
  "ontologyIdentifier": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
  "rule": {
    "judgeRules": [
      {
        "condition": false,
        "judgeParams": [
          {
            "leftOperate": {
              "type": "dynamic",
              "OntologyId": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
              "entityId": "3",
              "propertyName": "longitude"
            },
            "rightOperate": {
              "type": "fixed",
              "fixValue": "20.0"
            },
            "condition": "GT",
            "isLeft": 1,
            "linkFlag": "OR"
          },
          {
            "leftOperate": {
              "type": "dynamic",
              "OntologyId": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
              "entityId": "3",
              "propertyName": "speed"
            },
            "rightOperate": {
              "type": "fixed",
              "fixValue": "10"
            },
            "condition": "GE",
            "isRight": 1,
            "linkFlag": "AND"
          },
          {
            "leftOperate": {
              "type": "dynamic",
              "OntologyId": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
              "entityId": "3",
              "propertyName": "status"
            },
            "rightOperate": {
              "type": "fixed",
              "fixValue": "run"
            },
            "condition": "EQ",
            "isLeft": 1,
            "linkFlag": "OR"
          },
          {
            "leftOperate": {
              "type": "dynamic",
              "OntologyId": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
              "entityId": "3",
              "propertyName": "battery"
            },
            "rightOperate": {
              "type": "fixed",
              "fixValue": "30"
            },
            "condition": "LT",
            "isRight": 1
          }
        ],
        "actionParam": {
          "action_api": "shipLocation",
          "ontology_identifier": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
          "entity_json": "{\"ontologySpaceId\":156,\"actionApi\":\"shipLocation\",\"inputParams\":{}}"
        }
      }
    ],
    "flowDocument": "{\"nodes\":[],\"edges\":[]}"
  }
}
```

生成的括号序列：`( A OR B ) AND ( C OR D )`。

---

## 三、新传值：监测条件（按事件触发）

**特点**：先在规则组上选事件类型，再添加条件项；条件项只需选对象 + 分组。

| 字段 | 位置 | 必填 | 说明 |
|---|---|---|---|
| `monitorType` | 规则组 `judgeRules[i]` | 是（新写法） | `insert` 新增 / `update` 更新 / `delete` 删除。组内条件项不再重复写 |
| `leftOperate.type` | 条件项 | 是 | 固定 `dynamic` |
| `leftOperate.OntologyId` | 条件项 | 是 | 监测对象唯一标识（小写 `ontologyId` 也兼容） |
| `leftOperate.storageGroup` | 条件项 | 是 | 存储分组：主表填 `main`，子表填属性存储分组名 |
| `leftOperate.entityId` | 条件项 | 否 | 只监测某个实例；不传 = 该对象该分组任意实例 |
| `leftOperate.propertyId/propertyName/dataPrimaryKey` | 条件项 | 不传 | 监测条件下不参与 |
| `rightOperate` / `condition` | 条件项 | 不传 | 监测条件下不参与求值 |

语义：

- **OR**：任一分组发生该事件即执行
- **AND**：**跨事件累计**——同一实例的多个分组事件在 **5 分钟窗口**内先后凑齐才执行，执行一次后清空累计重新开始；不要求先后顺序
- 子表事件按与主表的外键折算到主表实例，所以"子表新增一行"等价于"该实例命中了这个分组"
- 监测条件**不做启用时存量评估**，只对启用之后发生的事件生效
- 监测条件只决定何时触发，**不会自动把刚变化的实例带给行为**；要写哪条数据仍由 `actionParam.entity_json` 决定
- 兼容写法：`monitorType` 也可以逐条写在条件项上（支持同组内混合不同事件类型，如"新增或删除"）；同一组内与组级类型不一致会返回 400

**复杂示例（组级类型 + AND/OR 嵌套）**：`monitorType=insert`，`(orbit 新增 AND sensor 新增) OR cargo 新增`

```json
{
  "spaceId": 156,
  "type": "RULE",
  "actionApi": "shipLocation",
  "name": "监测分组新增组合",
  "description": "orbit 与 sensor 都新增，或 cargo 新增时执行",
  "ontologyIdentifier": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
  "rule": {
    "judgeRules": [
      {
        "monitorType": "insert",
        "condition": false,
        "judgeParams": [
          {
            "leftOperate": {
              "type": "dynamic",
              "OntologyId": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
              "storageGroup": "orbit"
            },
            "isLeft": 1,
            "linkFlag": "AND"
          },
          {
            "leftOperate": {
              "type": "dynamic",
              "OntologyId": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
              "storageGroup": "sensor"
            },
            "isRight": 1,
            "linkFlag": "OR"
          },
          {
            "leftOperate": {
              "type": "dynamic",
              "OntologyId": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
              "storageGroup": "cargo"
            }
          }
        ],
        "actionParam": {
          "action_api": "shipLocation",
          "ontology_identifier": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
          "entity_json": "{\"ontologySpaceId\":156,\"actionApi\":\"shipLocation\",\"inputParams\":{}}"
        }
      }
    ],
    "flowDocument": "{\"nodes\":[],\"edges\":[]}"
  }
}
```

生成的括号序列：`( A AND B ) OR C`。执行逻辑：`cargo` 新增直接触发；或者 `orbit` 与 `sensor` 在 5 分钟窗口内都新增后才触发。

删除类比：`monitorType` 改为 `delete`，条件项不变（子表 `/` 主表都可用）。

---

## 四、编辑（PUT）差异

`POST` 的 body 原样提交，外层加 `id`：

```json
{
  "id": 123,
  "spaceId": 156,
  "type": "RULE",
  "actionApi": "shipLocation",
  "name": "监测分组新增组合",
  "description": "...",
  "ontologyIdentifier": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
  "rule": {
    "judgeRules": [ "……与创建一致，整体覆盖……" ],
    "flowDocument": "..."
  }
}
```

- 整体覆盖：未传的可选字段（`description`、`entity_json`、`flowDocument` 等）会被清空，建议先查详情再改后提交
- `spaceId` 编辑时可不传，空间归属按原调度记录校验

---

## 五、前端校验建议（与后端口径一致）

1. 事件类型与条件形态互斥：选了 `monitorType` 就隐藏 `rightOperate`/`condition`；没选就必须给完整的左右操作数和比较符
2. `storageGroup` 只能在监测形态下出现；属性形态传了会被忽略，但建议不传
3. 非最后一条条件必须有 `linkFlag`；括号左右数量分别累加后必须配平
4. 组级 `monitorType` 与条件项逐条 `monitorType` 不要同时出现且不一致（会 400）