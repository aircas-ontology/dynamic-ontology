# 接口名称

- 主题新建：按对象编号和函数编号查询已发布行为（同编号去重）

## 编译位置

apis 与 types 文件名自行语义化命名

- apis：`src/apis/`
- types：`src/types/apis/`
- mocks：`src/mocks/`（如需）

## 接口描述

- 按对象空间、对象编号与函数 api 查询**已发布**行为，供主题/子空间创建时勾选。
- 同编号去重。
- 在线文档相关模型：`RestResultListOntologyActionInfoVO`、`OntologyActionInfoVO`。
- OpenAPI 路径为 `/action/selectable`，服务前缀为 `/ontology`。项目请求路径使用加前缀后的完整路径。
- 请求参数通过 `query` 传递。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/action/selectable`

## 请求方式

- GET

## 输入参数

- 请求通过 `query` 传递参数。

| 参数名                | 位置  | 类型            | 必填 | 说明                                       |
| --------------------- | ----- | --------------- | ---- | ------------------------------------------ |
| `ontologySpaceId`     | query | integer / int32 | 是   | 对象空间 id                                |
| `ontologyIdentifiers` | query | string[]        | 否   | 对象编号；可重复传参或逗号分隔             |
| `functionApis`        | query | string[]        | 否   | 函数编号（函数 api）；可重复传参或逗号分隔 |

请求示例：

```http
GET /ontology/action/selectable?ontologySpaceId=120&ontologyIdentifiers=obj.a,obj.b&functionApis=switch_test,fn.demo
```

```http
GET /ontology/action/selectable?ontologySpaceId=120&ontologyIdentifiers=obj.a&ontologyIdentifiers=obj.b&functionApis=switch_test&functionApis=fn.demo
```

## 输出参数

在线文档响应模型为 `RestResultListOntologyActionInfoVO`。该操作声明 HTTP `200`。`code`、`message`、`data` 及 `OntologyActionInfoVO` 属性均未标记 required。下面取值仅说明字段结构。

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": [
    {
      "id": 135,
      "icon": "",
      "ontologyUniqIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
      "actionApi": "act.ap.demo",
      "description": "行为描述",
      "displayName": "演示行为",
      "functionApi": "switch_test",
      "functionName": "切换测试",
      "functionDescription": "函数描述",
      "categoryId": 14,
      "status": 1,
      "actionKind": "APPLICATION",
      "subjectType": null,
      "operation": null,
      "storageGroup": null,
      "outputMode": "RESULT_ONLY",
      "createTime": "2026-11-06T15:23:36.000+00:00",
      "updateTime": "2026-11-06T15:23:36.000+00:00"
    }
  ]
}
```

顶层字段（`RestResultListOntologyActionInfoVO`）：

| 字段名    | 类型                   | 必填 | 说明           |
| --------- | ---------------------- | ---- | -------------- |
| `code`    | integer / int32        | 否   | 响应码         |
| `message` | string                 | 否   | 消息描述       |
| `data`    | OntologyActionInfoVO[] | 否   | 已发布行为列表 |

`data[]` 项（`OntologyActionInfoVO`）：

| 字段名                   | 类型               | 必填 | 说明                                                                                                                                          |
| ------------------------ | ------------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | integer / int64    | 否   | 行为 id                                                                                                                                       |
| `icon`                   | string             | 否   | 对象 icon                                                                                                                                     |
| `ontologyUniqIdentifier` | string             | 否   | 创建时选的对象 id；关系行为只回显创建时选的那一端，其余不参与回填                                                                             |
| `actionApi`              | string             | 否   | api 名称                                                                                                                                      |
| `description`            | string             | 否   | 行为描述                                                                                                                                      |
| `displayName`            | string             | 否   | 行为显示名称                                                                                                                                  |
| `functionApi`            | string             | 否   | 对象下函数 api                                                                                                                                |
| `functionName`           | string             | 否   | 函数名称；同一 api 多版本时取版本号最大的一条；不绑算子的行为或查不到函数时为空                                                               |
| `functionDescription`    | string             | 否   | 函数描述                                                                                                                                      |
| `categoryId`             | integer / int32    | 否   | 所属行为分类 id                                                                                                                               |
| `status`                 | integer / int32    | 否   | 状态：`2` 草稿（未发布，智能体和调度不可用）/ `1` 已发布                                                                                      |
| `actionKind`             | string             | 否   | 行为类别。枚举：`BASE`（基础行为）、`APPLICATION`（应用行为）、`TREE`（行为树）                                                               |
| `subjectType`            | string             | 否   | 基础行为类型。枚举：`PROPERTY_VALUE`（属性值）、`LINK`（实例关系）、`BASIC_FUNCTION`（基础函数）；`BASIC_OPERATOR` 为基础算子，仅存量行为     |
| `operation`              | string             | 否   | 基础操作。枚举：`CREATE`（新增）、`UPDATE`（修改）、`DELETE`（删除）                                                                          |
| `storageGroup`           | string             | 否   | 属性值操作的目标存储分组                                                                                                                      |
| `outputMode`             | string             | 否   | 输出方式（只读的基础函数和基础算子行为有值 `RESULT_ONLY`）；应用行为已下沉到 `mappingIns` 每行独立选择。枚举：`RESULT_ONLY`、`WRITE_PROPERTY` |
| `createTime`             | string / date-time | 否   | 创建时间                                                                                                                                      |
| `updateTime`             | string / date-time | 否   | 修改时间                                                                                                                                      |

## code

- 该操作在文档中声明的响应为 `200`。
- `code`、`message` 来自 `RestResult`，文档没有列出具体枚举值。

## message

- 文档只声明 `message` 为 string，没有给出固定文案。

## types 示例

文件：`src/types/apis/getOntologyActionSelectableType.ts`（文件名可按语义调整）

```ts
/** 查询可选已发布行为请求参数（扁平 query）。 */
export interface GetOntologyActionSelectableParams {
  /** 对象空间 id，必填。 */
  ontologySpaceId: number;
  /** 对象编号；可重复传参或逗号分隔。 */
  ontologyIdentifiers?: string | string[];
  /** 函数 api；可重复传参或逗号分隔。 */
  functionApis?: string | string[];
}

/** 行为类别。 */
export type OntologyActionSelectableActionKind = "BASE" | "APPLICATION" | "TREE";

/** 基础行为类型。 */
export type OntologyActionSelectableSubjectType = "PROPERTY_VALUE" | "LINK" | "BASIC_OPERATOR" | "BASIC_FUNCTION";

/** 基础操作。 */
export type OntologyActionSelectableOperation = "CREATE" | "UPDATE" | "DELETE";

/** 输出方式。 */
export type OntologyActionSelectableOutputMode = "RESULT_ONLY" | "WRITE_PROPERTY";

/** 可选已发布行为条目（OntologyActionInfoVO）。 */
export interface GetOntologyActionSelectableItem {
  /** 行为 id。 */
  id?: number;
  /** 对象 icon。 */
  icon?: string | null;
  /** 创建时选的对象 id。 */
  ontologyUniqIdentifier?: string | null;
  /** api 名称。 */
  actionApi?: string | null;
  /** 行为描述。 */
  description?: string | null;
  /** 行为显示名称。 */
  displayName?: string | null;
  /** 对象下函数 api。 */
  functionApi?: string | null;
  /** 函数名称。 */
  functionName?: string | null;
  /** 函数描述。 */
  functionDescription?: string | null;
  /** 所属行为分类 id。 */
  categoryId?: number | null;
  /** 状态：1 已发布，2 草稿。 */
  status?: number | null;
  /** 行为类别。 */
  actionKind?: OntologyActionSelectableActionKind | string | null;
  /** 基础行为类型。 */
  subjectType?: OntologyActionSelectableSubjectType | string | null;
  /** 基础操作。 */
  operation?: OntologyActionSelectableOperation | string | null;
  /** 属性值操作的目标存储分组。 */
  storageGroup?: string | null;
  /** 输出方式。 */
  outputMode?: OntologyActionSelectableOutputMode | string | null;
  /** 创建时间。 */
  createTime?: string | null;
  /** 修改时间。 */
  updateTime?: string | null;
}

/** 查询可选已发布行为响应 data。 */
export type GetOntologyActionSelectableData = GetOntologyActionSelectableItem[];
```

并在 `src/types/index.ts` 中按字典序统一导出对应类型。

## apis 示例

文件：`src/apis/`（如 `ontologyActionApi.ts`）

```ts
import type { ApiResponse, GetOntologyActionSelectableData, GetOntologyActionSelectableParams } from "@/types";
import { request } from "@/utils/request";

/**
 * @description 主题新建：按对象编号和函数编号查询已发布行为（同编号去重）。
 *
 * 请求方式：GET `/ontology/action/selectable`
 *
 * @param params 查询参数。
 * @param params.ontologySpaceId 对象空间 id，必填。
 * @param params.ontologyIdentifiers 对象编号，可选。
 * @param params.functionApis 函数 api，可选。
 * @returns 标准 API 响应，data 为已发布行为列表。
 */
export function getOntologyActionSelectableInterface(params: GetOntologyActionSelectableParams): Promise<ApiResponse<GetOntologyActionSelectableData>> {
  return request<GetOntologyActionSelectableData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action/selectable",
    method: "get",
    params,
  });
}
```

并在 `src/apis/index.ts` 中导出。

## mocks 示例

在线 `RestResult` 未声明 `success`。项目统一响应类型包含该字段，Mock 按项目响应结构补上。`data` 取值仅用于说明结构。

```ts
import type { ApiResponse, GetOntologyActionSelectableData } from "@/types";

export const getOntologyActionSelectableMock: ApiResponse<GetOntologyActionSelectableData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: [
    {
      id: 135,
      actionApi: "act.ap.demo",
      displayName: "演示行为",
      description: "行为描述",
      ontologyUniqIdentifier: "ea512d439cd34c6ebbcde6b692261ab5",
      functionApi: "switch_test",
      functionName: "切换测试",
      functionDescription: "函数描述",
      categoryId: 14,
      status: 1,
      actionKind: "APPLICATION",
      outputMode: "RESULT_ONLY",
    },
  ],
};
```
