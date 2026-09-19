# APIs 目录规范

## 1. 目录职责

`src/apis` 只负责定义后端接口的请求函数，不在此处维护页面状态、业务流程或接口业务类型。

```text
src/apis/
├─ <domain>Api.ts   # 按页面或业务域组织的接口函数
├─ index.ts         # 所有接口函数的统一公共出口
└─ readme.md        # 本目录规范
```

- 【必须】接口文件按页面或业务域分类，一个文件只承载同一职责的接口。
- 【必须】请求统一通过 `@/utils/request` 提供的 `request` 发起，并使用 `ApiResponse<T>` 描述标准响应。
- 【必须】接口的请求参数、响应数据及嵌套数据类型统一放在 `src/types/apis`，不得在 API 文件中重复定义。
- 【禁止】在本目录维护页面状态、操作 Store、编排业务流程或直接操作 DOM。

## 2. 文件与接口命名

接口文件使用“小驼峰业务名 + `Api.ts`”格式：

```text
exampleApi.ts
ontologyApi.ts
```

接口函数使用“小写 HTTP 方法 + 业务动作或资源名 + `Interface`”格式：

```ts
getExampleInterface;
postExampleInterface;
putExampleInterface;
deleteExampleInterface;
```

- 【必须】HTTP 方法前缀与实际请求方法一致，使用 `get`、`post`、`put`、`delete` 等小写形式。
- 【必须】业务部分使用 PascalCase，名称准确表达操作对象或动作。
- 【禁止】使用无明确含义的缩写或无法体现资源和动作的名称。
- 【必须】接口函数使用具名导出，返回类型显式声明为 `Promise<ApiResponse<T>>`。

## 3. 类型与依赖导入

- 【必须】API 业务类型文件遵循 `src/types/readme.md`，使用“小驼峰概念名 + `Type.ts`”命名。
- 【必须】API 文件通过 `@/types` 公共出口导入业务类型，不得绕过出口引用 `@/types/apis/*`。
- 【必须】仅作为类型使用的符号通过 `import type` 导入。
- 【必须】`ApiResponse` 与 API 业务类型统一通过 `@/types` 导入；运行时 `request` 从 `@/utils/request` 导入。
- 【优先】导入语句按类型、请求工具和其他依赖分组，保持顺序稳定。

```ts
import type { ApiResponse, ExampleData, ExampleParams } from "@/types";
import { request } from "@/utils/request";
```

## 4. 接口定义

接口函数保持轻量，只组装请求配置并返回请求结果。GET 查询参数使用 `params`；POST、PUT 等提交内容使用 `data`。

```ts
export function getExampleInterface(params: ExampleParams): Promise<ApiResponse<ExampleData>> {
  return request<ExampleData>({
    url: "/example",
    method: "get",
    params,
  });
}
```

- 【必须】`request<T>` 的泛型表示响应中 `data` 字段的类型。
- 【必须】`url`、`method`、`params` 或 `data` 与后端契约保持一致。
- 【禁止】在接口函数中静默吞掉请求异常；通用错误处理由请求层负责，业务特有处理交给调用方。
- 【禁止】在 API 模块中直接操作组件状态、Store 或 DOM。

## 5. JSDoc 注释

【必须】每个导出的接口函数包含标准 JSDoc，至少说明：

1. 接口用途。
2. 请求方法和路径。
3. 每个参数及重要字段的含义。
4. 返回数据的业务结构。

```ts
/**
 * 查询示例数据列表。
 *
 * 请求方式：GET `/example`
 *
 * @param params 查询参数。
 * @param {number} params.page 当前页码，从 1 开始。
 * @param {number} params.pageSize 每页返回的数据条数。
 * @returns 标准 API 响应，包含分页列表和数据总数。
 */
```

【必须】注释描述接口契约和业务含义；【禁止】重复解释 TypeScript 语法或写入令牌、账号等敏感信息。

## 6. 统一出口

【必须】`src/apis/index.ts` 作为接口函数的统一公共出口。业务代码通过 `@/apis` 使用接口，不直接引用具体 API 文件。

【必须】`index.ts` 采用“先导入、后导出”的结构：

```ts
import { getExampleInterface } from "./exampleApi";

export { getExampleInterface };
```

- 【必须】导入区和导出区之间保留一个空行。
- 【必须】导入语句按文件路径字典序排列。
- 【必须】同一文件导入多个接口时，接口名称按字典序排列。
- 【必须】导出列表按接口来源文件、接口名称的字典序排列，并与导入内容保持一致。

## 7. 新增接口检查清单

1. API 文件是否按页面或业务域归类，并命名为 `<domain>Api.ts`。
2. 接口函数名是否以实际 HTTP 方法开头、以 `Interface` 结尾。
3. 请求参数和响应数据类型是否定义在 `src/types/apis/*Type.ts`。
4. 业务类型是否已由 `src/types/index.ts` 导出，并在 API 文件中通过 `@/types` 导入。
5. 是否使用 `request<T>`，并显式声明 `Promise<ApiResponse<T>>` 返回类型。
6. 请求路径、方法及 `params` 或 `data` 是否与后端契约一致。
7. 每个导出接口是否具有完整、准确的 JSDoc。
8. 接口是否已按排序规则加入 `src/apis/index.ts` 的导入区和导出区。
9. 是否已执行与变更相匹配的测试、类型检查和 `npm run build:verify`。
