# 接口名称

- 本体属性自动关联数据源

## 接口描述

- 根据本体标识自动为本体属性关联匹配的数据源字段。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/property/auto_bind_datasource`

## 请求方式

- POST

## 输入参数

- 请求体：JSON 对象。

```json
{
  "ontologyIdentifier": "ontology-001"
}
```

| 字段               | 类型   | 必填 | 说明    |
| ------------------ | ------ | ---- | ------- |
| ontologyIdentifier | string | 是   | 本体 id |

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": null
}
```

| 字段    | 类型            | 说明                             |
| ------- | --------------- | -------------------------------- |
| code    | integer / int32 | 响应码                           |
| message | string          | 消息描述                         |
| data    | unknown         | 业务数据，接口文档未定义具体结构 |

## code

- `200`：请求成功。
- `400`：请求参数错误。
- `401`：权限不足，请重新登录。
- `500`：服务器内部错误。

## message

- 成功时返回：`SUCCESS`。
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/autoBindOntologyPropertyDatasourceType.ts`

```ts
export interface AutoBindOntologyPropertyDatasourceParams {
  ontologyIdentifier: string;
}

export type AutoBindOntologyPropertyDatasourceData = undefined;
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { AutoBindOntologyPropertyDatasourceData, AutoBindOntologyPropertyDatasourceParams } from "./apis/autoBindOntologyPropertyDatasourceType";
```

## apis 示例

文件：`src/apis/ontologyPropertyApi.ts`

```ts
import type { ApiResponse, AutoBindOntologyPropertyDatasourceData, AutoBindOntologyPropertyDatasourceParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 自动为本体属性关联数据源。
 *
 * 请求方式：POST `/ontology/property/auto_bind_datasource`
 *
 * @param params 自动关联数据源参数。
 * @param params.ontologyIdentifier 本体标识。
 * @returns 标准 API 响应。
 */
export function autoBindOntologyPropertyDatasourceInterface(
  params: AutoBindOntologyPropertyDatasourceParams,
): Promise<ApiResponse<AutoBindOntologyPropertyDatasourceData>> {
  return request<AutoBindOntologyPropertyDatasourceData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/auto_bind_datasource",
    method: "post",
    data: params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { autoBindOntologyPropertyDatasourceInterface } from "./ontologyPropertyApi";

export { autoBindOntologyPropertyDatasourceInterface };
```

## mocks 示例

文件：`src/mocks/autoBindOntologyPropertyDatasourceMock/autoBindOntologyPropertyDatasourceMock.ts`

```ts
import type { ApiResponse, AutoBindOntologyPropertyDatasourceData } from "@/types";

export const autoBindOntologyPropertyDatasourceMock: ApiResponse<AutoBindOntologyPropertyDatasourceData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: undefined,
};
```
