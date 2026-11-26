# 规则调度创建入参（前端对接）

- 创建：`POST /action/scheduling`，`type=RULE`
- 编辑：`PUT /action/scheduling`，结构完全一致，最外层多一个必填 `id`；处于 START 的调度不能编辑，需先暂停
- 启动：`POST /action/scheduling/start/RULE/{id}`（新建调度为 STOP，不启动不会触发）
- 详情回显：`GET /action/scheduling/detail?id={id}&type=RULE`，`ruleVO.judgeRules` 与提交结构一致，可直接用于编辑回填

两种写法：**旧传值**是纯属性比较（规则组不传 `monitorType`）；**新传值**是监测条件（规则组传 `monitorType`：`insert` / `update` / `delete`）。监测条件下的 `judgeParams` 与属性比较同构（左右操作数 + 比较符），仅多组级事件类型。同一个调度里不同规则组可以混用；**同一个规则组内**不要混用「有 / 无 `monitorType`」两种形态。

---

## 一、公共字段（两种写法一致）

| 字段                             | 必填 | 说明                                                               |
| -------------------------------- | ---- | ------------------------------------------------------------------ |
| `spaceId`                        | 是   | 行为所属空间 id                                                    |
| `type`                           | 是   | 固定 `RULE`                                                        |
| `actionApi`                      | 是   | 要调度的行为 api（行为必须绑定了算子）                             |
| `name`                           | 是   | 调度名称                                                           |
| `description`                    | 否   | 调度描述                                                           |
| `ontologyIdentifier`             | 否   | 行为挂载对象唯一标识；应用行为/多对象行为可不传                    |
| `rule.judgeRules`                | 是   | 规则组数组，每条 = 组合条件 + 命中后执行的行为参数                 |
| `rule.flowDocument`              | 否   | 前端画布文档字符串，后端只存不解析，详情原样返回用于回显           |
| `rule.judgeRules[i].condition`   | 否   | 组级取反：`true` 时整组条件不成立才执行（else 语义），默认 `false` |
| `rule.judgeRules[i].actionParam` | 是   | 命中后执行的行为参数，字段见下                                     |

`actionParam`：

| 字段                  | 必填 | 说明                                                                                                           |
| --------------------- | ---- | -------------------------------------------------------------------------------------------------------------- |
| `action_api`          | 是   | 行为 api，兼容 `actionApi`                                                                                     |
| `ontology_identifier` | 否   | 执行目标对象，兼容 `ontologyIdentifier`                                                                        |
| `entity_identifiler`  | 否   | 执行目标实例主键（注意后端字段名拼写为 `entity_identifiler`，也兼容 `entity_identifier` / `entityIdentifier`） |
| `entity_json`         | 否   | 完整执行参数 JSON 字符串（与行为测试 ActionTestParam 同形式，支持数组批量）；不传按行为定义构造最小参数        |

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

## 三、新传值：监测条件（事件类型 + 属性比较同构）

**特点**：规则组上传 `monitorType` 表示触发事件；`judgeParams` 与第二节属性比较**同构**——每项仍是 `leftOperate` + `rightOperate` + `condition`（及 `isLeft` / `isRight` / `linkFlag`）。

| 字段                                         | 位置                   | 必填         | 说明                                                                                                                |
| -------------------------------------------- | ---------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| `monitorType`                                | 规则组 `judgeRules[i]` | 是（新写法） | `insert` 新增 / `update` 更新 / `delete` 删除。`insert` / `delete` 与 `update` 的其余结构完全一致，仅该字段取值不同 |
| `leftOperate` / `rightOperate` / `condition` | 条件项                 | 是           | 字段含义与第二节属性比较相同                                                                                        |
| `leftOperate.type`                           | 条件项                 | 是           | 可为 `dynamic` 或 `fixed`（`fixed` 时用 `fixValue`）                                                                |
| `rightOperate.type`                          | 条件项                 | 是           | 可为 `fixed` 或 `dynamic`                                                                                           |

说明：

- `insert`：组级 `monitorType` 为 `"insert"`，其余字段与下方 `update` 示例一致
- `delete`：组级 `monitorType` 为 `"delete"`，其余字段与下方 `update` 示例一致
- `update`：组级 `monitorType` 为 `"update"`，示例如下
- 条件项上一般不再重复写 `monitorType`；若逐条写，须与组级一致，否则可能 400
- 监测条件只决定何时结合属性比较结果触发；命中后执行哪条数据仍由 `actionParam.entity_json` 决定

**示例**（`monitorType=update`；改为新增/删除时只替换 `monitorType`）：`(battery LT 30) AND (status EQ 危险)`

```json
{
  "spaceId": 156,
  "type": "RULE",
  "actionApi": "shipLocation",
  "name": "新增危险船告警",
  "description": "船舶新增时 电池<30 且 状态=危险 触发",
  "ontologyIdentifier": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
  "rule": {
    "judgeRules": [
      {
        "monitorType": "update",
        "condition": false,
        "judgeParams": [
          {
            "leftOperate": {
              "type": "dynamic",
              "OntologyId": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
              "propertyName": "battery"
            },
            "rightOperate": { "type": "fixed", "fixValue": "30" },
            "condition": "LT",
            "isLeft": 1,
            "linkFlag": "AND"
          },
          {
            "leftOperate": {
              "type": "dynamic",
              "OntologyId": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
              "propertyName": "status"
            },
            "rightOperate": { "type": "fixed", "fixValue": "危险" },
            "condition": "EQ",
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

生成的括号序列：`( A AND B )`。

---

## 四、编辑（PUT）差异

`POST` 的 body 原样提交，外层加 `id`：

```json
{
  "id": 123,
  "spaceId": 156,
  "type": "RULE",
  "actionApi": "shipLocation",
  "name": "新增危险船告警",
  "description": "...",
  "ontologyIdentifier": "0b6f1f2e-8f0e-4f43-9e5b-2a0f3f5c9d11",
  "rule": {
    "judgeRules": ["……与创建一致，整体覆盖……"],
    "flowDocument": "..."
  }
}
```

- 整体覆盖：未传的可选字段（`description`、`entity_json`、`flowDocument` 等）会被清空，建议先查详情再改后提交
- `spaceId` 编辑时可不传，空间归属按原调度记录校验

---

## 五、前端校验建议（与后端口径一致）

1. 有组级 `monitorType`（`insert` / `update` / `delete`）时，`judgeParams` 仍须给完整的 `leftOperate`、`rightOperate`、`condition`；无 `monitorType` 时同样如此（纯属性比较）
2. `leftOperate.type` / `rightOperate.type` 均可为 `dynamic` 或 `fixed`；`fixed` 必须带 `fixValue`
3. 非最后一条条件必须有 `linkFlag`；括号左右数量分别累加后必须配平
4. 组级 `monitorType` 与条件项逐条 `monitorType` 不要同时出现且不一致（会 400）
5. `insert` / `delete` / `update` 仅 `monitorType` 取值不同，其余 JSON 结构保持一致
6. 前端绑定口径：`insert` / `delete` 时主表 dynamic 不传 `entityId` 与 `dataPrimaryKey`；子表只传 `entityId`、不传 `dataPrimaryKey`。`update` 与无 `monitorType` 的比较仍按主表实例、子表实例+数据行绑定
