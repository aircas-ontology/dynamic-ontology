# 接口名称

- 对象属性分类树查询

## 编译位置

- apis：`src/apis/ontologyObjectArrManageApi.ts`
- mocks：`src/mocks/getOntologyObjectArrTypeTreeMock/`
- types：`src/types/apis/getOntologyObjectArrTypeTreeType.ts`

## 接口描述

- 查询对象属性分类

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology/property/category`

## 请求方式

- GET

## 输入参数

- ```JSON
  {
    "ontologyUniqueIdentifier":"ae6cca59ced9432189da4af315554957",
  }
  ```
- 请求体：GET 请求使用 `query` 传递参数。
- `ontologyUniqueIdentifier`：【string，必填】 对象标识

## 输出参数

```JSON
{
    "code": 200,
    "message": "SUCCESS",
    "data": {
        "categoryId": 1,
        "name": "全部属性",
        "children": [
            {
                "categoryId": 3,
                "name": "标识信息",
                "propertyInfos": [
                    {
                        "displayName": "飞机名称",
                        "description": "飞机名称",
                        "isPrimaryKey": false,
                        "isTitleKey": true,
                        "uniqueIdentifier": "602cc68cc3cb46daa47626516848ffad",
                        "ontologyUniqueIdentifier": "d58eecff239c4c7f908d9c640a95d68e",
                        "defaultValue": "ceshi",
                        "storageGroup": "main",
                        "categoryId": 3,
                        "propertyType": "String",
                        "apiName": "name"
                    },
                    {
                        "displayName": "飞机id",
                        "description": "飞机id",
                        "isPrimaryKey": false,
                        "isTitleKey": false,
                        "uniqueIdentifier": "f793530eba5e4feb8ac9545d5a899f6d",
                        "ontologyUniqueIdentifier": "d58eecff239c4c7f908d9c640a95d68e",
                        "defaultValue": "ceshi",
                        "storageGroup": "main",
                        "categoryId": 3,
                        "propertyType": "String",
                        "apiName": "planeid"
                    },
                    {
                        "displayName": "id",
                        "description": "主键id",
                        "isPrimaryKey": true,
                        "isTitleKey": false,
                        "uniqueIdentifier": "d00474647dfd4e6ca402bea7638c053f",
                        "ontologyUniqueIdentifier": "d58eecff239c4c7f908d9c640a95d68e",
                        "storageGroup": "main",
                        "categoryId": 3,
                        "propertyType": "String",
                        "apiName": "id"
                    },
                    {
                        "displayName": "飞机制造商",
                        "description": "飞机制造商名称",
                        "isPrimaryKey": false,
                        "isTitleKey": false,
                        "uniqueIdentifier": "5d54a3cd2c5b43479ada9f75f89e8a1a",
                        "ontologyUniqueIdentifier": "d58eecff239c4c7f908d9c640a95d68e",
                        "defaultValue": "",
                        "storageGroup": "main",
                        "categoryId": 3,
                        "propertyType": "String",
                        "apiName": "fjzzs"
                    }
                ]
            },
            {
                "categoryId": 2,
                "name": "物理特征",
                "propertyInfos": [
                    {
                        "displayName": "舰船123456",
                        "description": "舰船重量",
                        "isPrimaryKey": false,
                        "isTitleKey": false,
                        "uniqueIdentifier": "dbe01dbc49cd461d8b5a8b10f847e482",
                        "ontologyUniqueIdentifier": "d58eecff239c4c7f908d9c640a95d68e",
                        "defaultValue": "",
                        "storageGroup": "main",
                        "categoryId": 2,
                        "propertyType": "Double",
                        "apiName": "zhongliang"
                    },
                    {
                        "displayName": "发动机编号",
                        "description": "发动机的出厂编号",
                        "isPrimaryKey": false,
                        "isTitleKey": false,
                        "uniqueIdentifier": "c49f6a7b22a24b45976ddb3707434348",
                        "ontologyUniqueIdentifier": "d58eecff239c4c7f908d9c640a95d68e",
                        "storageGroup": "main",
                        "categoryId": 2,
                        "propertyType": "String",
                        "apiName": "engineNumber"
                    },
                    {
                        "displayName": "发动机名称",
                        "description": "发动机的名称",
                        "isPrimaryKey": false,
                        "isTitleKey": false,
                        "uniqueIdentifier": "51ef71aa4938489e9e22531462d59a57",
                        "ontologyUniqueIdentifier": "d58eecff239c4c7f908d9c640a95d68e",
                        "storageGroup": "main",
                        "categoryId": 2,
                        "propertyType": "String",
                        "apiName": "enginename"
                    }
                ],
                "children": [
                    {
                        "categoryId": 5,
                        "name": "重量排水"
                    },
                    {
                        "categoryId": 4,
                        "name": "尺度"
                    }
                ]
            }
        ]
    }
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `data`：【object】响应体
  - `categoryId`:【number】分类id
  - `name`:【string】分类name
  - `children`:【array】子级数组
    - `categoryId`:【number】分类id
    - `name`:【string】分类name
    - `children`:【array】子级数组
      ...

  前端以 `code === 200` 判定查询成功，不依赖 `success` 字段。

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`SUCCESS`
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/getOntologyObjectArrTypeTreeType.ts`

```ts
export interface GetOntologyObjectArrTypeTreeParams {
  ontologyUniqueIdentifier: string;
}
export interface GetOntologyObjectArrTypeTreeData {
  categoryId: number;
  name: string;
  children?: GetOntologyObjectArrTypeTreeData[];
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { GetOntologyObjectArrTypeTreeParams, GetOntologyObjectArrTypeTreeData } from "./apis/getOntologyObjectArrTypeTreeType";
```

## apis 示例

文件：`src/apis/ontologyObjectArrManageApi.ts`

```ts
import type { ApiResponse, GetOntologyObjectArrTypeTreeParams, GetOntologyObjectArrTypeTreeData } from "@/types";
import { request } from "@/utils/request";

/**
 * 查询对象属性分类树。
 *
 * 请求方式：GET `/ontology/property/category`
 *
 * @param params 查询对象属性分类参数。
 * @param params.ontologyUniqueIdentifier 对象唯一标识
 * @returns 标准 API 响应，返回对象属性分类树。
 */
export function getOntologyObjectArrTypeTreeInterface(params: GetOntologyObjectArrTypeTreeParams): Promise<ApiResponse<GetOntologyObjectArrTypeTreeData>> {
  return request<GetOntologyObjectArrTypeTreeData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/category",
    method: "get",
    params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { getOntologyObjectArrTypeTreeInterface } from "./ontologyObjectArrManageApi";

export { getOntologyObjectArrTypeTreeInterface };
```

## mocks 示例

文件：`src/mocks/getOntologyObjectArrTypeTreeMock/getOntologyObjectArrTypeTreeMock.ts`

```ts
import type { ApiResponse, GetOntologyObjectArrTypeTreeData } from "@/types";

export const getOntologyObjectArrTypeTreeMock: ApiResponse<GetOntologyObjectArrTypeTreeData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    categoryId: 6,
    name: "全部",
    children: [
      {
        categoryId: 7,
        name: "qwe123",
      },
    ],
  },
};
```
