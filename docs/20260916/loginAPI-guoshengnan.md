# 接口名称

- 登录接口

## 编译位置

- apis：`src/apis/loginApi.ts`
- mocks：`src/mocks/loginMock/`
- types：`src/types/apis/loginType.ts`

## 接口描述

- 输入用户名、密码，登录系统。

## 接口domain

- `DOMAIN_CONFIG.LOGIN_URL`

## 接口uri

- `/ontology/user/login`

## 请求方式

- post

## 输入参数

- ```JSON
  {
    "password": "a123456",
    "username": "admin"
  }
  ```
- `password`：【string，必填】密码,示例值(a123456)
- `username`：【string，必填】用户名,示例值(admin)

## 输出参数

```JSON
{
	"code": 200,
	"data": {},
	"message": ""
}
```

- `code`：【number】响应码
- `message`：【string】消息描述
- `success`：【boolean】请求是否成功
- `data`：【object】响应数据

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

文件：`src/types/apis/loginType.ts`

```ts
export interface LoginParams {
  username: string;
  password: string;
}
export interface LoginData {
  data: object;
}
```

并在 `src/types/index.ts` 中统一导出：

```ts
export type { LoginParams, LoginData } from "./apis/login";
```

## apis 示例

文件：`src/apis/loginApi.ts`

```ts
import type { ApiResponse, LoginParams, LoginData } from "@/types";
import { request } from "@/utils/request";

/**
 * 登录。
 *
 * 请求方式：POST `/ontology/user/login`
 *
 * @param params 登录参数。
 * @param params.username 用户名。
 * @param params.password 密码。
 * @returns 标准 API 响应。
 */
export function loginInterface(
  params: LoginParams,
): Promise<ApiResponse<LoginData>> {
  return request<LoginData>({
    url: "/ontology/user/login",
    method: "post",
    params,
  });
}
```

并在 `src/apis/index.ts` 中导出：

```ts
import { loginInterface } from "./loginApi";

export { loginInterface };
```

## mocks 示例

文件：`src/mocks/loginMock/loginMock.ts`

```ts
import type { ApiResponse, LoginData } from "@/types";

export const loginMock: ApiResponse<LoginData> = {
  code: 200,
  message: "登录成功",
  data: {},
};
```
