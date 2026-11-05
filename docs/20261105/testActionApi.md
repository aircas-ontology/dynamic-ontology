## 5. 行为测试传值

**接口**：`POST /ontology/action/test`

**用途**：测试行为定义是否可用。**草稿状态的行为可以测试**（发布前正是要拿它验证定义）。测试会真实落库（写数据湖 / 写图库 / 执行算子）。

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

### 5.1 请求体（`ActionTestParam`）

| 字段名                 | 类型                  | 必填 | 说明                                                                                                                                                         |
| ---------------------- | --------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ontologySpaceId`      | String                | 是   | 对象空间id                                                                                                                                                   |
| `actionApi`            | String                | 是   | 行为 api                                                                                                                                                     |
| `entityPrimaryKey`     | Object                | 是   | **行为挂载侧的实体主键**：你当前在哪个对象下操作行为，就传那个对象的实例主键。属性值行为用它定位实体、算子类行为用它取属性值、实例关系行为用它作为关系的一端 |
| `dataPrimaryKey`       | Object                | 否   | 分组表行的主键：**属性值-修改/删除必填**（定位到具体一行数据）                                                                                               |
| `linkEntityPrimaryKey` | Object                | 否   | **关系对端的实体主键**：**实例关系行为必填**。与 `entityPrimaryKey` 一起确定关系的两端                                                                       |
| `params`               | Map\<String, Object\> | 否   | 来源为外部输入的参数取值（参数名 -> 值），固定值不在此传                                                                                                     |

### 5.2 响应体（`ActionTestResultVO`）

| 字段名      | 类型   | 说明                                     |
| ----------- | ------ | ---------------------------------------- |
| `actionApi` | String | 行为 api                                 |
| `message`   | String | 本次落库动作说明                         |
| `result`    | String | 算子返回结果（JSON）；不绑算子的行为为空 |

### 5.3 各类型行为的测试传值

#### 5.3.1 属性值行为（`actionKind=BASE`、`subjectType=PROPERTY_VALUE`）

**场景 A：新增一行属性数据**

```json
{
  "actionApi": "act.pv.weapon.add",
  "entityPrimaryKey": "1",
  "params": {
    "weaponName": "AK47",
    "damage": 50
  }
}
```

> `dataPrimaryKey` 不传（新增不需要定位已有行）。

**场景 B：修改一行属性数据**

```json
{
  "actionApi": "act.pv.weapon.update",
  "entityPrimaryKey": "1",
  "dataPrimaryKey": "100",
  "params": {
    "damage": 60
  }
}
```

> `dataPrimaryKey` 必填，定位到具体一行。

**场景 C：删除一行属性数据**

```json
{
  "actionApi": "act.pv.weapon.delete",
  "entityPrimaryKey": "1",
  "dataPrimaryKey": "100"
}
```

> `dataPrimaryKey` 必填，`params` 不传。

---

#### 5.3.2 实例关系行为（`actionKind=BASE`、`subjectType=LINK`）

> **关键概念**：实例关系行为需要指定**两个实例**——行为挂载侧的实例和对端的实例。
>
> - `entityPrimaryKey` = **行为挂载侧的实例主键**（你当前在哪个对象下操作行为，就传那个对象的实例主键）
> - `linkedEntityPrimaryKey` = **关系对端的实例主键**（另一个对象的实例主键）
>
> 后端会根据行为挂载的对象是关系的 From 侧还是 To 侧，自动决定哪端是 from、哪端是 to。前端不需要关心 from/to 的方向，只需要知道「当前操作的实例」和「对端的实例」。

**场景 A：新增一条关系边**

假设关系定义是「飞机 → 导弹」（飞机是 From，导弹是 To），行为挂载在「飞机」对象上：

```json
{
  "actionApi": "act.link.own.add",
  "entityPrimaryKey": "1",
  "linkEntityPrimaryKey": "2"
}
```

> - `entityPrimaryKey = "1"`：飞机实例的主键（行为挂载侧）
> - `linkEntityPrimaryKey = "2"`：导弹实例的主键（对端）
> - 后端判断：行为挂载的「飞机」= 关系的 From 侧 → `primaryKeyFrom = 1`, `primaryKeyTo = 2`

如果行为挂载在「导弹」对象上（关系仍是「飞机 → 导弹」）：

```json
{
  "actionApi": "act.link.missile.add",
  "entityPrimaryKey": "2",
  "linkEntityPrimaryKey": "1"
}
```

> - `entityPrimaryKey = "2"`：导弹实例的主键（行为挂载侧）
> - `linkEntityPrimaryKey = "1"`：飞机实例的主键（对端）
> - 后端判断：行为挂载的「导弹」= 关系的 To 侧 → `primaryKeyFrom = 1`, `primaryKeyTo = 2`（结果相同）

**场景 B：修改关系边的状态或时段**

```json
{
  "actionApi": "act.link.own.update",
  "entityPrimaryKey": "1",
  "linkEntityPrimaryKey": "2"
}
```

> 修改时 `dataPrimaryKey` 不传（关系边由两端实体主键唯一定位）。

**场景 C：删除一条关系边**

```json
{
  "actionApi": "act.link.own.delete",
  "entityPrimaryKey": "1",
  "linkEntityPrimaryKey": "2"
}
```

---

#### 5.3.3 基础算子行为（`actionKind=BASE`、`subjectType=BASIC_OPERATOR`）

```json
{
  "actionApi": "act.fn.rename",
  "entityPrimaryKey": "1",
  "params": {
    "newName": "新名称"
  }
}
```

> 算子类行为会执行绑定的算子，算子输出按 `outputMode` 回写（`RESULT_ONLY` 只返回结果，`WRITE_PROPERTY` 写入对象属性）。

如果算子行为还关联了实例关系（`linkMapping != null`），可以传 `linkEntityPrimaryKey` 指定对端实体：

```json
{
  "actionApi": "act.fn.link.compute",
  "entityPrimaryKey": "1",
  "linkEntityPrimaryKey": "2",
  "params": {
    "param1": "value1"
  }
}
```

> 不传 `linkEntityPrimaryKey` 时，会遍历关系下的全部实体执行。

---

#### 5.3.4 应用行为（`actionKind=APPLICATION`）

应用行为的测试传值与基础算子行为相同，区别在于应用行为必须绑定算子（`functionApi` 必填），且 `outputMode` 必填。

```json
{
  "actionApi": "act.app.custom",
  "entityPrimaryKey": "1",
  "params": {
    "input1": "value1",
    "input2": 100
  }
}
```

---

### 5.4 错误码

| HTTP 状态码 | 场景                                    | 错误信息                                          |
| ----------- | --------------------------------------- | ------------------------------------------------- |
| 400         | 行为 api 无效                           | `无效的action api`                                |
| 400         | 未传实体主键                            | `行为测试必须提供实体主键`                        |
| 400         | 属性值-删除未传 `dataPrimaryKey`        | `属性值-删除必须提供分组数据主键`                 |
| 400         | 实例关系行为未传 `linkEntityPrimaryKey` | `实例关系行为必须提供对端实体主键`                |
| 400         | 存储分组有必填属性未绑定                | `存储分组[<group>]的必填属性未绑定取值：<属性名>` |

---
