# 接口名称

- 列出容器运行实例（启停管理页数据源；spaceId 为空则列全部）

## 编译位置

- apis：`src/apis/funtionApi.ts`
- types：`src/types/apis`

## 接口描述

- 列出容器运行实例（启停管理页数据源；spaceId 为空则列全部）

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/function/container/runtime/list`

## 请求方式

- GET

## 输入参数

- ```JSON
  {
    "spaceId": "",
  }
  ```
- `spaceId`：【integer，必填】空间id

## 输出参数

```JSON
{
  "code": 200,
  "message": "SUCCESS",
  "data": [
    {
      "containerKey": "df27adab8fd64713a383e906eea070ca",
      "ontologySpaceId": 1,
      "displayName": "rongqi",
      "imageAddress": "mccutchen/go-httpbin:latest",//镜像地址（repoTags 首条，如 registry/image:tag）
      "containerName": "httpbin-ctr-18080",
      "phase": "CREATED",
      "phaseLabel": "已创建",//运行状态中文标签
      "hostPort": 18089,
      "containerPort": 8080,
      "nodeIp": "172.16.18.58",
      "nodePort": 37002,
      "containerId": null,
      "lastAction": null,
      "lastActionAt": null,
      "message": "容器算子已创建，尚未启动",
      "heartbeatStatus": null, //心跳状态：HEALTHY（健康）/UNHEALTHY（不健康）（仅 phase=RUNNING 时有意义）
      "heartbeatLabel": null,
      "lastHeartbeatAt": null,
      "containerSource": "USER",//容器来源：USER 用户创建（可操作）/ SYSTEM 系统预置（只读）
      "containerSourceLabel": "用户创建"
    }
  ]
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `data.displayName`：【string】算子名
- `data.containerName`：【string】容器名
- `data.hostPort`：【string】容器端口号
- `data.nodeIp`：【string】容器宿主机IP
- `nodePort`： 【string】容器宿主机端口

## code

- `200`：请求成功
- `400`：请求参数错误
- `401`：权限不足，请重新登录
- `500`：服务器内部错误

## message

- 成功时返回：`上传成功`
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
