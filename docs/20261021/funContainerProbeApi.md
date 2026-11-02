# 接口名称

- 探查接口文档，解析出接口列表（名称/api/请求方式/路径/描述/出入参）

## 编译位置

- apis：`src/apis/funtionApi.ts`
- types：`src/types/apis`

## 接口描述

- 探查接口文档，解析出接口列表（名称/api/请求方式/路径/描述/出入参）

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 uri

- `/ontology/function/container/probe_interfaces`

## 请求方式

- POST

## 输入参数

- ```JSON
  {
    "docPath": "",
  }
  ```
- `docPath`：【string，必填】上传接口文档接口返回的存储路径

## 输出参数

```JSON
{
  "code": 200,
  "message": "SUCCESS",
  "data": [
    {
      "name": "createStudent",
      "api": "POST /api/v1/students",
      "method": "POST",
      "path": "/api/v1/students",
      "description": "创建学生",
      "inputParameters": [
        {
          "name": "operator",
          "in": "body",
          "required": false,
          "type": "string",
          "description": "操作人账号"
        },
        {
          "name": "remark",
          "in": "body",
          "required": false,
          "type": "string",
          "description": "备注"
        },
        {
          "name": "student",
          "in": "body",
          "required": true,
          "type": "object",
          "description": "学生对象",
          "fields": [
            {
              "name": "id",
              "in": "body",
              "required": false,
              "type": "integer",
              "description": "学生主键，新增时可不传，由服务端生成"
            },
            {
              "name": "name",
              "in": "body",
              "required": true,
              "type": "string",
              "description": "姓名"
            },
            {
              "name": "age",
              "in": "body",
              "required": false,
              "type": "integer",
              "description": "年龄"
            },
            {
              "name": "gender",
              "in": "body",
              "required": false,
              "type": "string",
              "description": "性别：MALE 男，FEMALE 女，UNKNOWN 未知"
            },
            {
              "name": "email",
              "in": "body",
              "required": false,
              "type": "string",
              "description": "邮箱"
            },
            {
              "name": "className",
              "in": "body",
              "required": false,
              "type": "string",
              "description": "所在班级"
            },
            {
              "name": "tags",
              "in": "body",
              "required": false,
              "type": "array",
              "description": "标签列表"
            },
            {
              "name": "courses",
              "in": "body",
              "required": false,
              "type": "array",
              "description": "成绩列表（数组套对象，用于验证子字段展开到元素层）",
              "fields": [
                {
                  "name": "courseId",
                  "in": "body",
                  "required": true,
                  "type": "integer",
                  "description": "课程主键"
                },
                {
                  "name": "courseName",
                  "in": "body",
                  "required": false,
                  "type": "string",
                  "description": "课程名"
                },
                {
                  "name": "score",
                  "in": "body",
                  "required": false,
                  "type": "number",
                  "description": "得分"
                }
              ]
            },
            {
              "name": "enrollment",
              "in": "body",
              "required": false,
              "type": "object",
              "description": "学籍信息（二级嵌套对象）",
              "fields": [
                {
                  "name": "grade",
                  "in": "body",
                  "required": false,
                  "type": "string",
                  "description": "入学年级"
                },
                {
                  "name": "enrollDate",
                  "in": "body",
                  "required": false,
                  "type": "string",
                  "description": "入学日期"
                },
                {
                  "name": "source",
                  "in": "body",
                  "required": false,
                  "type": "string",
                  "description": "生源类型"
                }
              ]
            }
          ]
        }
      ],
      "outputParameters": [
        {
          "name": "code",
          "in": "body",
          "required": true,
          "type": "string",
          "description": "业务码，成功为 200"
        },
        {
          "name": "msg",
          "in": "body",
          "required": true,
          "type": "string",
          "description": "提示信息"
        },
        {
          "name": "data",
          "in": "body",
          "required": false,
          "type": "integer",
          "description": "新建学生主键"
        }
      ]
    },
    {
      "name": "getStudentDetail",
      "api": "GET /api/v1/students/{id}",
      "method": "GET",
      "path": "/api/v1/students/{id}",
      "description": "查询学生详情",
      "inputParameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "type": "integer",
          "description": "学生主键"
        }
      ],
      "outputParameters": [
        {
          "name": "code",
          "in": "body",
          "required": true,
          "type": "string",
          "description": ""
        },
        {
          "name": "msg",
          "in": "body",
          "required": true,
          "type": "string",
          "description": ""
        },
        {
          "name": "data",
          "in": "body",
          "required": false,
          "type": "object",
          "description": "学生详情",
          "fields": [
            {
              "name": "id",
              "in": "body",
              "required": false,
              "type": "integer",
              "description": ""
            },
            {
              "name": "name",
              "in": "body",
              "required": false,
              "type": "string",
              "description": ""
            },
            {
              "name": "age",
              "in": "body",
              "required": false,
              "type": "integer",
              "description": ""
            },
            {
              "name": "gender",
              "in": "body",
              "required": false,
              "type": "string",
              "description": ""
            },
            {
              "name": "email",
              "in": "body",
              "required": false,
              "type": "string",
              "description": ""
            },
            {
              "name": "className",
              "in": "body",
              "required": false,
              "type": "string",
              "description": ""
            },
            {
              "name": "createTime",
              "in": "body",
              "required": false,
              "type": "string",
              "description": "创建时间"
            }
          ]
        }
      ]
    },
    {
      "name": "listStudents",
      "api": "GET /api/v1/students/list",
      "method": "GET",
      "path": "/api/v1/students/list",
      "description": "分页查询学生列表",
      "inputParameters": [
        {
          "name": "keyword",
          "in": "query",
          "required": false,
          "type": "string",
          "description": "姓名模糊搜索"
        },
        {
          "name": "gender",
          "in": "query",
          "required": false,
          "type": "string",
          "description": "性别精确筛选"
        },
        {
          "name": "page",
          "in": "query",
          "required": false,
          "type": "integer",
          "description": "页码，从 1 开始"
        },
        {
          "name": "size",
          "in": "query",
          "required": false,
          "type": "integer",
          "description": "每页条数"
        }
      ],
      "outputParameters": [
        {
          "name": "code",
          "in": "body",
          "required": true,
          "type": "string",
          "description": ""
        },
        {
          "name": "msg",
          "in": "body",
          "required": true,
          "type": "string",
          "description": ""
        },
        {
          "name": "data",
          "in": "body",
          "required": false,
          "type": "object",
          "description": "分页数据",
          "fields": [
            {
              "name": "records",
              "in": "body",
              "required": false,
              "type": "array",
              "description": "",
              "fields": [
                {
                  "name": "id",
                  "in": "body",
                  "required": false,
                  "type": "integer",
                  "description": ""
                },
                {
                  "name": "name",
                  "in": "body",
                  "required": false,
                  "type": "string",
                  "description": ""
                },
                {
                  "name": "age",
                  "in": "body",
                  "required": false,
                  "type": "integer",
                  "description": ""
                },
                {
                  "name": "gender",
                  "in": "body",
                  "required": false,
                  "type": "string",
                  "description": ""
                },
                {
                  "name": "email",
                  "in": "body",
                  "required": false,
                  "type": "string",
                  "description": ""
                },
                {
                  "name": "className",
                  "in": "body",
                  "required": false,
                  "type": "string",
                  "description": ""
                },
                {
                  "name": "createTime",
                  "in": "body",
                  "required": false,
                  "type": "string",
                  "description": "创建时间"
                }
              ]
            },
            {
              "name": "total",
              "in": "body",
              "required": false,
              "type": "integer",
              "description": "总条数"
            },
            {
              "name": "page",
              "in": "body",
              "required": false,
              "type": "integer",
              "description": "当前页码"
            },
            {
              "name": "size",
              "in": "body",
              "required": false,
              "type": "integer",
              "description": "每页条数"
            },
            {
              "name": "pages",
              "in": "body",
              "required": false,
              "type": "integer",
              "description": "总页数"
            }
          ]
        }
      ]
    }
  ]
}
```

- `code`：【number】响应码
- `message`：【string】消息描述

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
