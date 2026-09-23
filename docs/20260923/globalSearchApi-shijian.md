# 接口名称

- 全局检索（跨五个本体索引，按相关性排序返回名称/类型/描述及各业务 id）

## 编译位置

mocks与types文件名自行语义化命名

- apis：`src/apis/ontologySearchApi.ts`
- mocks：`src/mocks/`
- types：`src/types/apis/`

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology/search/global`

## 请求方式

- POST

## 输入参数

- ```JSON
  {
    "keyword": "",
    "sizs": 20
  }
  ```

- `keyword`：【string，必填】 查询内容
- `sizs`：【number，非必填】 返回条数上限，缺省 100

## 输出参数

```JSON
{
  "code": 200,
  "message": "SUCCESS",
  "data": [
    {
      "name": "sj测试",
      "type": "空间",
      "desc": "测试空间",
      "spaceId": 37
    },
    {
      "name": "测试本体对象-修改",
      "type": "对象",
      "desc": "这是修改后的本体描述",
      "spaceId": 11,
      "objectId": 9
    },
    {
      "name": "飞机id",
      "type": "属性",
      "desc": "飞机id",
      "spaceId": 46,
      "objectId": 106,
      "propertyId": 243
    },
    {
      "name": "轰-6K中程轰炸机",
      "type": "实例",
      "desc": "轰-6K中程轰炸机 PL-204 204",
      "spaceId": 1,
      "objectId": 1,
      "instanceId": "space_a.airplane.d58eecff239c4c7f908d9c640a95d68e.204"
    },
    {
      "name": "a",
      "type": "关系分组"
    }
  ]
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `data`：【array】结果数组

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`查询成功`
- 失败时返回具体错误信息。

## types 示例

文件：`src/types/apis/ontologySearchType.ts`

```ts
export interface OntologySearchParams {
  keyword?: string;
  page: number;
  pageSize: number;
}

export interface OntologySearchItem {
  id: string;
  name: string;
  description: string;
}

export interface OntologySearchData {
  items: OntologySearchItem[];
  total: number;
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { OntologySearchData, OntologySearchItem, OntologySearchParams } from "./apis/ontologySearchType";
```

## apis 示例

文件：`src/apis/ontologySearchApi.ts`

```ts
import type { ApiResponse, OntologySearchData, OntologySearchParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 根据关键词分页查询本体数据。
 *
 * 请求方式：GET `/ontology/search`
 *
 * @param params 查询参数。
 * @param params.keyword 可选的本体名称或描述关键词。
 * @param params.page 当前页码，从 1 开始。
 * @param params.pageSize 每页返回的数据条数。
 * @returns 标准 API 响应，包含当前页本体列表和数据总数。
 */
export function getOntologySearchInterface(params: OntologySearchParams): Promise<ApiResponse<OntologySearchData>> {
  return request<OntologySearchData>({
    url: "/ontology/search",
    method: "get",
    params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { getOntologySearchInterface } from "./ontologySearchApi";

export { getOntologySearchInterface };
```

## mocks 示例

文件：`src/mocks/ontologySearchMock/ontologySearchMock.ts`

```ts
import type { ApiResponse, OntologySearchData } from "@/types";

export const ontologySearchMock: ApiResponse<OntologySearchData> = {
  code: 200,
  message: "查询成功",
  success: true,
  data: {
    items: [
      {
        id: "ontology-001",
        name: "Satellite Ontology",
        description: "用于描述卫星及其关联资源的本体。",
      },
    ],
    total: 1,
  },
};
```
