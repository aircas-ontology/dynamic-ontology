# 接口名称

- 画布一键建空间：创建空间并批量创建对象、属性、关系

## 接口描述

- 根据画布内容创建本体空间，并批量写入画布中的本体对象、对象属性和对象关系。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/space/canvas`

## 请求方式

- POST

## 输入参数

- 请求体：JSON 对象。

```json
{
  "displayName": "海军本体空间",
  "apiName": "navy_space",
  "description": "通过概念模型画布创建的本体空间",
  "ontologies": [
    {
      "displayName": "驱逐舰",
      "apiName": "destroyer",
      "description": "驱逐舰本体对象",
      "properties": [
        {
          "displayName": "舰名",
          "apiName": "name",
          "dataType": "String",
          "description": "驱逐舰名称",
          "isPrimaryKey": false,
          "isTitleKey": true,
          "defaultValue": ""
        }
      ]
    },
    {
      "displayName": "驱逐舰队",
      "apiName": "destroyer1",
      "description": "驱逐舰队本体对象",
      "properties": [
        {
          "displayName": "舰名",
          "apiName": "name",
          "dataType": "String",
          "description": "驱逐舰名称",
          "isPrimaryKey": false,
          "isTitleKey": true,
          "defaultValue": ""
        }
      ]
    }
  ],
  "links": [
    {
      "name": "隶属于",
      "apiName": "belongs_to",
      "description": "对象所属关系",
      "fromOntologyApiName": "destroyer",
      "toOntologyApiName": "destroyer1"
    }
  ]
}
```

| 字段                                   | 类型             | 必填 | 说明                                  |
| -------------------------------------- | ---------------- | ---- | ------------------------------------- |
| displayName                            | string           | 是   | 空间名称                              |
| apiName                                | string           | 是   | 空间 API 名称                         |     |
| description                            | string           | 否   | 空间描述                              |
| ontologies                             | CanvasOntology[] | 否   | 画布中的本体对象列表                  |
| ontologies[].displayName               | string           | 是   | 本体对象名称                          |
| ontologies[].apiName                   | string           | 是   | 本体对象 API 名称                     |
| ontologies[].description               | string           | 否   | 本体对象描述                          |     |
| ontologies[].properties                | CanvasProperty[] | 否   | 本体对象属性列表                      |
| ontologies[].properties[].displayName  | string           | 是   | 属性展示名称                          |
| ontologies[].properties[].apiName      | string           | 是   | 属性 API 名称                         |
| ontologies[].properties[].dataType     | string           | 否   | 数据类型枚举名称，不传默认 `String`   |
| ontologies[].properties[].description  | string           | 否   | 属性描述                              |
| ontologies[].properties[].isPrimaryKey | boolean          | 否   | 是否主键，不传默认 `false`            |
| ontologies[].properties[].isTitleKey   | boolean          | 否   | 是否名称键，不传默认 `false`          |
| ontologies[].properties[].defaultValue | string           | 否   | 属性默认值                            |
| links                                  | CanvasLink[]     | 否   | 画布中的对象关系列表                  |
| links[].name                           | string           | 是   | 关系名称                              |
| links[].apiName                        | string           | 否   | 关系 API 名称，当前预留               |
| links[].description                    | string           | 否   | 关系描述，当前预留                    |
| links[].fromOntologyApiName            | string           | 是   | 源对象 API 名称，也兼容对象显示名称   |
| links[].toOntologyApiName              | string           | 是   | 目标对象 API 名称，也兼容对象显示名称 |

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "spaceId": 8
  }
}
```

| 字段         | 类型                        | 说明               |
| ------------ | --------------------------- | ------------------ |
| code         | integer / int32             | 响应码             |
| message      | string                      | 消息描述           |
| data         | OntologySpaceCanvasCreateVO | 画布一键建空间返回 |
| data.spaceId | integer / int32             | 新建空间 id        |

## code

- `200`：请求成功。
- `400`：请求参数错误。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/createOntologySpaceWithCanvasContentType.ts`

```ts
export interface CanvasProperty {
  displayName: string;
  apiName: string;
  dataType?: string;
  description?: string;
  isPrimaryKey?: boolean;
  isTitleKey?: boolean;
  defaultValue?: string;
}

export interface CanvasOntology {
  displayName: string;
  apiName: string;
  description?: string;
  properties?: CanvasProperty[];
}

export interface CanvasLink {
  name: string;
  apiName?: string;
  description?: string;
  fromOntologyApiName: string;
  toOntologyApiName: string;
}

export interface CreateOntologySpaceWithCanvasContentParams {
  displayName: string;
  apiName: string;
  description?: string;
  ontologies?: CanvasOntology[];
  links?: CanvasLink[];
}

export interface CreateOntologySpaceWithCanvasContentData {
  spaceId?: number;
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type {
  CanvasLink,
  CanvasOntology,
  CanvasProperty,
  CreateOntologySpaceWithCanvasContentData,
  CreateOntologySpaceWithCanvasContentParams,
} from "./apis/createOntologySpaceWithCanvasContentType";
```

## apis 示例

文件：`src/apis/ontologyManageApi.ts`

```ts
import type { ApiResponse, CreateOntologySpaceWithCanvasContentData, CreateOntologySpaceWithCanvasContentParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 通过概念模型画布创建本体空间及其对象、属性、关系。
 *
 * 请求方式：POST `/ontology/space/canvas`
 *
 * @param params 画布空间、对象、属性和关系内容。
 * @returns 标准 API 响应，data 包含新建空间 id。
 */
export function createOntologySpaceWithCanvasContentInterface(
  params: CreateOntologySpaceWithCanvasContentParams,
): Promise<ApiResponse<CreateOntologySpaceWithCanvasContentData>> {
  return request<CreateOntologySpaceWithCanvasContentData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space/canvas",
    method: "post",
    data: params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { createOntologySpaceWithCanvasContentInterface } from "./ontologyManageApi";

export { createOntologySpaceWithCanvasContentInterface };
```

## mocks 示例

文件：`src/mocks/createOntologySpaceWithCanvasContentMock/createOntologySpaceWithCanvasContentMock.ts`

```ts
import type { ApiResponse, CreateOntologySpaceWithCanvasContentData } from "@/types";

export const createOntologySpaceWithCanvasContentMock: ApiResponse<CreateOntologySpaceWithCanvasContentData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: { spaceId: 8 },
};
```
