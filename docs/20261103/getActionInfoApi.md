## 二、行为详情

```
GET /ontology/action?actionApi=<actionApi>
```

**响应示例**（应用行为 - 对象入参子字段绑定）：

```json
{
  "code": 200,
  "data": {
    "id": 8,
    "actionApi": "act.ap.obj.nested",
    "displayName": "应用行为-对象子字段绑定",
    "description": "验证 OBJECT 入参按子字段绑定：lng 取属性，lat 外部输入",
    "ontologyUniqIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
    "categoryId": 14,
    "status": 1,
    "actionKind": "APPLICATION",
    "subjectType": null,
    "operation": null,
    "storageGroup": null,
    "functionApi": "act.fn.obj",
    "functionDescription": "OBJECT 入参演示算子",
    "outputMode": "RESULT_ONLY",
    "linkMapping": {
      "ontologyLinkUniqIdentifier": "4ed7c4da646f4006bec301815b61debb",
      "ontologyLinkFunctionParamExpression": null,
      "targetStatus": null,
      "visibilityWindows": []
    },
    "mappingIns": [
      {
        "functionParamId": 2298,
        "parameterName": "lng",
        "sourceType": "PROPERTY",
        "sourceConfig": null,
        "paramPath": "lng",
        "propertyUniqueIdentifier": "7f7f85dc5c68422aba360ca89d7b6831",
        "ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
        "functionParamExpression": null
      },
      {
        "functionParamId": 2298,
        "parameterName": "lat",
        "sourceType": "EXTERNAL",
        "sourceConfig": null,
        "paramPath": "lat",
        "propertyUniqueIdentifier": null,
        "ontologyUniqueIdentifier": null,
        "functionParamExpression": null
      }
    ],
    "functionParams": [
      {
        "paramId": 2298,
        "paramName": "pos",
        "paramType": "OBJECT",
        "category": "INPUT",
        "paramOrder": 1,
        "description": "坐标对象",
        "referenceType": "java.util.Map"
      },
      {
        "paramId": 2299,
        "paramName": "echo",
        "paramType": "OBJECT",
        "category": "OUTPUT",
        "paramOrder": 1,
        "description": "回显对象",
        "referenceType": "java.util.Map"
      },
      {
        "paramId": 2300,
        "paramName": "sum",
        "paramType": "DOUBLE",
        "category": "OUTPUT",
        "paramOrder": 2,
        "description": "lng+lat 之和",
        "referenceType": "java.lang.Double"
      }
    ]
  }
}
```

**字段说明**：

| 字段                                              | 说明                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `linkMapping`                                     | 关系绑定（属性值行为为 null）                                                                               |
| `linkMapping.ontologyLinkUniqIdentifier`          | 关系唯一标识                                                                                                |
| `linkMapping.ontologyLinkFunctionParamExpression` | **已废弃**，仅存储，执行时不再参与关系判定                                                                  |
| `linkMapping.targetStatus`                        | 目标状态（实例关系行为必填：新增允许 ENABLE/DISABLE/DELETE，修改只允许 ENABLE/DISABLE）                     |
| `linkMapping.visibilityWindows`                   | 持续时段列表（实例关系-新增必填，修改填了才改、不填保留边上原值，删除不传）                                 |
| `mappingIns`                                      | 参数绑定列表（入参 + 出参混排）                                                                             |
| `mappingIns[].functionParamId`                    | 函数参数 id（从 `functionParams` 里找对应定义；**对象入参的子字段没有独立 paramId，用顶层参数的 paramId**） |
| `mappingIns[].paramPath`                          | **对象入参的子字段路径**（相对参数名按点分层级，如 `position.longitude`；标量参数或整包取值时不传）         |
| `mappingIns[].parameterName`                      | 参数名（外部输入时作为取值 key，不传则用函数参数名）                                                        |
| `mappingIns[].sourceType`                         | 来源：PROPERTY/EXTERNAL/FIXED/OBJECT/LIST                                                                   |
| `mappingIns[].sourceConfig`                       | 固定值字面量（sourceType=FIXED 时有值）                                                                     |
| `mappingIns[].propertyUniqueIdentifier`           | 属性标识（sourceType=PROPERTY/OBJECT/LIST 时必填）                                                          |
| `mappingIns[].functionParamExpression`            | 出参 JsonPath（如 `$.newName`，仅 WRITE_PROPERTY 的出参绑定有值）                                           |
| `functionParams`                                  | 函数参数定义列表（前端绑定 UI 用）                                                                          |
| `functionParams[].paramId`                        | 函数参数 id（与 `mappingIns[].functionParamId` 匹配）                                                       |
| `functionParams[].category`                       | INPUT（入参）/ OUTPUT（出参）                                                                               |
| `functionParams[].paramType`                      | 参数类型：STRING/INTEGER/DOUBLE/BOOLEAN/OBJECT/LIST 等                                                      |
| `functionParams[].referenceType`                  | 全限定类名（如 `java.lang.Double`）                                                                         |

**重要**：`functionParams` 不包含 `fields` 子字段定义。要获取对象参数的子字段树，前端需调用 `GET /function/detail?functionApi=<api>&spaceId=<spaceId>`，从 `params[].fields` 读取嵌套结构。

---
