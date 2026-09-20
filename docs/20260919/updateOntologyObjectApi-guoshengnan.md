# 接口名称

- 修改本体对象

## 编译位置

- apis：`src/apis/ontologyObjectManageApi.ts`
- mocks：`src/mocks/updateOntologyObjectMock/`
- types：`src/types/apis/updateOntologyObjectType.ts`

## 接口描述

- 修改本体对象元数据。
- 在线接口文档：[OntologyMetaController_updateMeta](http://172.16.18.58:37002/ontology/doc.html#/ontology/%E6%9C%AC%E4%BD%93%E5%AF%B9%E8%B1%A1%E7%AE%A1%E7%90%86/OntologyMetaController_updateMeta/doc)。

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/meta`

## 请求方式

- put

## 输入参数

- 请求体：PUT 请求使用 `data` 传递 JSON 对象。
- 请求体字段：

```JSON
{
  "ontologyIdentifier": "ae6cca59ced9432189da4af315554957",
  "icon": "",
  "displayName": "测试本体对象-修改",
  "description": "这是修改后的本体描述",
  "groupIds": [null],
  "categoryId": 29
}
```

- `ontologyIdentifier`：【string，必填】本体 id。
- `icon`：【string，可选】本体图标。
- `displayName`：【string，必填】本体名称。
- `description`：【string，可选】本体描述。
- `groupIds`：【(string|null)[]，必填】分组 ids，当前编辑场景固定传 `[null]`。
- `categoryId`：【number，可选】分类 id。

## 输出参数

在线文档的 200 响应包含 `code`、`message` 和 `data`，其中 `data` 类型未进一步定义；在线契约没有 `success` 字段，前端以 `code === 200` 判定修改成功，`data` 使用空对象表示无业务返回数据。

```JSON
{
  "code": 200,
  "message": "SUCCESS",
  "data": {}
}
```

- `code`：【number】响应码。
- `message`：【string】消息描述。
- `data`：【object】接口未定义具体业务字段，按空对象承载。

## code

- `200`：请求成功。
- `400`：请求参数错误。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/updateOntologyObjectType.ts`

```ts
export interface UpdateOntologyObjectParams {
  ontologyIdentifier: string;
  displayName: string;
  groupIds: Array<string | null>;
  icon?: string;
  description?: string;
  categoryId?: number;
}

export type UpdateOntologyObjectData = Record<string, unknown>;
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { UpdateOntologyObjectData, UpdateOntologyObjectParams } from "./apis/updateOntologyObjectType";
```

## apis 示例

文件：`src/apis/ontologyObjectManageApi.ts`

```ts
import type { ApiResponse, UpdateOntologyObjectData, UpdateOntologyObjectParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 修改本体对象。
 *
 * 请求方式：PUT `/meta`
 *
 * @param params 修改本体对象参数。
 * @param params.ontologyIdentifier 本体 id。
 * @param params.displayName 本体名称。
 * @param params.groupIds 本体分组 ids。
 * @param params.icon 本体图标。
 * @param params.description 本体描述。
 * @param params.categoryId 本体分类 id。
 * @returns 标准 API 响应。
 */
export function updateOntologyObjectInterface(params: UpdateOntologyObjectParams): Promise<ApiResponse<UpdateOntologyObjectData>> {
  return request<UpdateOntologyObjectData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/meta",
    method: "put",
    data: params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { updateOntologyObjectInterface } from "./ontologyObjectManageApi";

export { updateOntologyObjectInterface };
```

## mocks 示例

文件：`src/mocks/updateOntologyObjectMock/updateOntologyObjectMock.ts`

```ts
import type { ApiResponse, UpdateOntologyObjectData } from "@/types";

export const updateOntologyObjectMock: ApiResponse<UpdateOntologyObjectData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {},
};
```

> 在线文档未提供可验证的请求或响应示例。Mock 为适配项目现有 `ApiResponse` 类型而保留 `success` 字段，但真实接口成功判断只依据 `code === 200`。
