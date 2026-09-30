# 接口名称

- 查询本体空间列表

## 编译位置

- apis：`src/apis/ontologyManageApi.ts`
- mocks：`src/mocks/ontologyManageMock/`
- types：`src/types/apis/ontologyManageType.ts`

## 接口描述

- 查询本体空间列表。

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology/space`

## 请求方式

- get

## 输入参数

无

## 输出结果

```JSON
{
  "code": 200,
  "message": "SUCCESS",
  "data": [
    {
      "iconUrl": "",
      "displayName": "xxx战场",
      "apiName": "space_a",
      "description": "这是空间描述",
      "spaceId": 1,
      "ontologyCount": 2,
      "actionCount": 0,
      "propertyCount": 7,
      "linkCount": 0,
      "createTime": "2026-09-21 10:47:32",
      "updateTime": "2026-09-21 10:47:32"
    }
  ]
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `success`：【boolean】请求是否成功
- `data`：【object】响应数据
- `createTime`：【string】创建时间
- `updateTime`：【string】更新时间

## code

- `200`：OK
- `201`：Created
- `401`：Unauthorized
- `403`：Forbidden
- `404`：Not Found

## message

- 成功时返回：`登录成功`，跳转进路由：`layout/ontology-space-management`
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/ontologyManageType.ts`

```ts
export interface OntologySpaceListData {
  data: object;
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { OntologySpaceListData } from "./apis/ontologyManageType";
```

## apis 示例

文件：`src/apis/ontologyManageApi.ts`

```ts
import type { ApiResponse, OntologySpaceListData } from "@/types";
import { request } from "@/utils/request";

/**
 * 查询本体空间列表。
 *
 * 请求方式：get `/ontology/space`
 *
 * 无参数
 * @returns 标准 API 响应。
 */
export function getOntologySpaceListInterface(): Promise<ApiResponse<OntologySpaceListData>> {
  return request<OntologySpaceListData>({
    url: "/ontology/user/login",
    method: "get",
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { getOntologySpaceListInterface } from "./ontologyManageApi";

export { getOntologySpaceListInterface };
```

## mocks 示例

文件：`src/mocks/ontologySpaceListMock/ontologySpaceListMock.ts`

```ts
import type { ApiResponse, OntologySpaceListData } from "@/types";

export const ontologySpaceListMock: ApiResponse<OntologySpaceListData> = {
  code: 200,
  message: "列表查询成功",
  data: {},
};
```
