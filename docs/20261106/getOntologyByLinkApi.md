# 接口名称

- 根据 link uniqid 查询关系

## 编译位置

mocks 与 types 文件名自行语义化命名

- apis：`src/apis/ontologyManageApi.ts`
- mocks：`src/mocks/`
- types：`src/types/apis/`

## 接口描述

- 根据关系唯一标识（link uniqueIdentifier）查询单条对象关系详情。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/link`

## 请求方式

- GET

## 输入参数

- 传参方式：【必须】以 **query string parameters** 传递（非 request body）。

| 参数名             | 类型   | 必填 | 说明         |
| ------------------ | ------ | ---- | ------------ |
| `uniqueIdentifier` | String | 是   | 关系唯一标识 |

- 示例：

```http
GET /ontology/link?uniqueIdentifier=c91e24645b5a46019fc48060a2103ab0
```

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "uniqueIdentifier": "c91e24645b5a46019fc48060a2103ab0",
    "name": "打击",
    "ontologyUniqueIdentifierFrom": "ea512d439cd34c6ebbcde6b692261ab5",
    "ontologyNameFrom": "飞机",
    "ontologyUniqueIdentifierTo": "c8adbff823c54653adc11c8fa1fa7c14",
    "ontologyNameTo": "导弹",
    "categoryId": 204,
    "apiName": "act_strike",
    "description": "同一对端的第二条关系：验证一对对象可挂多条关系，也可用来测关系下无匹配边的情形"
  }
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `data`：【object】对象关系数据信息；未找到时可为 `null`

**响应字段（`data` / 关系详情）**：

| 字段名                         | 类型    | 说明                                            |
| ------------------------------ | ------- | ----------------------------------------------- |
| `uniqueIdentifier`             | String  | link 唯一标识                                   |
| `name`                         | String  | link 名称                                       |
| `ontologyUniqueIdentifierFrom` | String  | 开始对象 unique identifier                      |
| `ontologyNameFrom`             | String  | 开始对象名称                                    |
| `ontologyUniqueIdentifierTo`   | String  | 结束对象 unique identifier                      |
| `ontologyNameTo`               | String  | 结束对象名称                                    |
| `categoryId`                   | Integer | 关系分类 id（对应 `ontology_link_category.id`） |
| `apiName`                      | String  | 关系 api 名称                                   |
| `description`                  | String  | 关系备注 / 描述                                 |

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`SUCCESS`
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/getOntologyLinkByUniqueIdentifierType.ts`

```ts
/** 根据 link 唯一标识查询关系请求参数。 */
export interface GetOntologyLinkByUniqueIdentifierParams {
  /** 关系唯一标识。 */
  uniqueIdentifier: string;
}

/** 根据 link 唯一标识查询关系业务数据。 */
export interface GetOntologyLinkByUniqueIdentifierData {
  /** link 唯一标识。 */
  uniqueIdentifier: string;
  /** link 名称。 */
  name: string;
  /** 开始对象 unique identifier。 */
  ontologyUniqueIdentifierFrom: string;
  /** 开始对象名称。 */
  ontologyNameFrom: string;
  /** 结束对象 unique identifier。 */
  ontologyUniqueIdentifierTo: string;
  /** 结束对象名称。 */
  ontologyNameTo: string;
  /** 关系分类 id。 */
  categoryId: number;
  /** 关系 api 名称。 */
  apiName: string;
  /** 关系备注 / 描述。 */
  description: string;
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { GetOntologyLinkByUniqueIdentifierData, GetOntologyLinkByUniqueIdentifierParams } from "./apis/getOntologyLinkByUniqueIdentifierType";
```

## apis 示例

文件：`src/apis/ontologyManageApi.ts`

```ts
import type { ApiResponse, GetOntologyLinkByUniqueIdentifierData, GetOntologyLinkByUniqueIdentifierParams } from "@/types";
import { request } from "@/utils/request";

/**
 * @description 根据 link 唯一标识查询关系详情。
 *
 * 请求方式：GET `/ontology/link`
 *
 * @param params 查询参数。
 * @param params.uniqueIdentifier 关系唯一标识。
 * @returns 标准 API 响应；data 为关系详情。
 */
export function getOntologyLinkByUniqueIdentifierInterface(
  params: GetOntologyLinkByUniqueIdentifierParams,
): Promise<ApiResponse<GetOntologyLinkByUniqueIdentifierData>> {
  return request<GetOntologyLinkByUniqueIdentifierData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/link",
    method: "get",
    params,
  });
}
```
