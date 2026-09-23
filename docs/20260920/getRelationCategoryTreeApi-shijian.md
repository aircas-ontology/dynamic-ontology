# 接口名称

- 查询关系分类体系树

## 编译位置

mocks与types文件名自行语义化命名

- apis：`src/apis/ontologyManageApi.ts`
- mocks：`src/mocks/`
- types：`src/types/apis/`

## 接口domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口uri

- `/ontology/link_category/tree`

## 请求方式

- get

## 输入参数

- ```JSON
  {
    "spaceId": "1",
  }
  ```
- `spaceId`：【string，必填】 空间id

## 输出参数

```JSON
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "categoryId": 24,
    "name": "全部",
    "children": [
      {
        "categoryId": 26,
        "name": "隶属关系",
        "children": [
          {
            "categoryId": 29,
            "name": "附属"
          }
        ]
      },
      {
        "categoryId": 30,
        "name": "人员借调",
        "links": [
          {
            "uniqueIdentifier": "f5dd661753f84476a652d120be86adb5",
            "name": "借调",
            "type": "OTHER",
            "ontologyUniqueIdentifierFrom": "27499ff6432c425ea152909c768d860e",
            "ontologyNameFrom": "班级1",
            "ontologyUniqueIdentifierTo": "86371f5599e243aca485edac2bde8b22",
            "ontologyNameTo": "班级2",
            "ontologyIconFrom": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ1IDc5LjE2MzQ5OSwgMjAxOC8wOC8xMy0xNjo0MDoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjkwNkUyNEU1OEEwOTExRUJBNDJDODA2OTlCNEY5NjA0IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjkwNkUyNEU2OEEwOTExRUJBNDJDODA2OTlCNEY5NjA0Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OTA2RTI0RTM4QTA5MTFFQkE0MkM4MDY5OUI0Rjk2MDQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OTA2RTI0RTQ4QTA5MTFFQkE0MkM4MDY5OUI0Rjk2MDQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7rSd62AAADJElEQVR42qxWzU8TURCfflD6BRYKqQiobU1aEzwgoSZ+kB6MIkTlxFFJvEHiSQn+BQhHTTyYkJhwMxxMBBpjIsQaQaUHD4bGWEKAIAq0YCqtpRTnLbNLu+x2l9JJft3tvN357Zv3e/NGA2NdoGAaxBVEO+IS4gyigsZiiB+Ij4hRRBCxmz+YPKEWwQYfEYkaY+T9iBeIjFxQKXMiphFDhyADenaI3nWqJfQjPiOaoXBrphgtSoTXEG8QVXB0YzHeIq7LEXoQIwgDFM8MFNMjJtQhhhFl+d4eOd8Dr5ru5/g8luOwevUptFafk3vNSrF12YR31ayZv9ILp0z23MWyOaHKYAVHabnSmnbxhBqSfl4z6wxgx8BLyViOv95YyV2XEjGlEH2MS0tKUpQ+H3gxGc3x18n4ZbZMix5/2qRGH7hawXfMtS85g5XS6oGXjd2C/4Jt75lBbyekMmnuPvRnHgYi41Jh21ilYeXosnhkzj8ITnN1QdKc21oF92Sv1FCQEa7gjeOAnrV6sOhKhf+9rhvQ526H26EnEIx+369l/gFYTm5Ay3S/4Iunk7C9uyNF+EufVYhzjKWHTxGzyhILd52NL0Ns+y93b9SWcP7pjYjgU7AKrdo01ZlIHIl9cdSbeIVGVadbT0eM4+AxogFbiVn4f9Joh/VUHEy4PRiYeS013DWKs6ugDDDbTG9BZlfylIrJiiaConEVKJr5xBo4Jx5KiobNcEqK8PniJDSVn+buS1FAtxyNsJBYh08bc8IzDWW1cNZ6AibWZ2ENZ8/bzOa83LdMMcIxxIHPyd5HXmsNRzj6+yv0fBsW/M8a7nCE3egLx3+qmfw4E817OqnlBWPcE/KSqJrw1YfNXGU3ENRSD/I4PyGpUVRHa402TjBbOyk1hIwjw28L1oPMyD258m+TCxwSrc0Cbod3uH4qLEQcOU2UF/GFzq9iWpyOp7D4xGeOTlZkikiWophhuZ4mgOigryrGzDooZt6uLUApCB2BLEQxAmr7UpYCH+IeKzqHIIrQO77sNKrtvLM/ilWim4iLCLeo1Y9Qq/8a8UGu4+btvwADAEHh6cSGb097AAAAAElFTkSuQmCC",
            "apiName": "jiediao",
            "description": "班级1借调班级2 语文老师",
            "categoryId": 30,
          }
        ]
      }
    ]
  }
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `data`：【object】响应数据,如果没有data属性，说明关系树为空，需要添加

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
