# TypeScript 类型规范

## 1. 目录职责

`src/types` 集中定义项目中的 TypeScript 类型。类型必须按使用范围和业务职责归类，禁止将不同职责的类型长期堆放在同一目录或同一文件中。

```text
src/types/
├─ apis/                    # 接口请求参数、响应数据等 API 类型
├─ pages/                   # 页面专属类型，每个页面一个 TypeScript 文件
│  └─ <page>Type.ts
├─ <domain>/                # 可跨页面复用的业务领域类型，例如 auth、map、satellite
├─ shared/                  # 跨业务领域复用的通用类型
├─ global/                  # 全局声明、环境声明、第三方类型扩展
└─ index.ts                 # 所有普通类型的统一公共出口
```

目录规则：

- 【必须】`apis/` 作为所有 `src/apis` 接口类型的唯一存放位置，接口文件不得在 `src/apis` 内直接定义业务数据类型。
- 【必须】`pages/` 仅存放页面专属类型，每个页面定义一个直接位于 `pages/` 下的 `<page>Type.ts`；【禁止】再创建页面子目录。
- 【必须】可被多个页面复用的类型提升到对应业务领域目录。
- 【必须】`<domain>/` 存放跨页面复用且属于明确业务领域的类型，目录名使用小写或 kebab-case。
- 【必须】`shared/` 仅存放无法归属于单一业务领域的通用类型。
- 【必须】`global/` 仅存放全局声明、环境变量和第三方类型扩展；文件同样使用 `*Type.ts`，不使用 `*.d.ts`。
- 【禁止】类型文件直接放在 `src/types` 根目录；根目录仅保留 `index.ts`、`readme.md` 等规范文件。
- 【必须】一个类型文件只承载一个领域或职责，禁止混合页面、API、业务领域和通用类型。

## 2. 文件命名

普通类型文件统一使用“小驼峰概念名 + `Type.ts`”格式：

```text
exampleType.ts
loginCredentialsType.ts
satelliteStateType.ts
```

命名规则：

- 【必须】文件名以 `Type.ts` 结尾，概念部分使用小驼峰。
- 【必须】文件名表达承载的业务概念或职责；【禁止】使用 `types.ts`、`common.ts` 等宽泛名称。
- 【禁止】使用拼音、无明确含义的缩写或随意缩写；项目已有通用缩写除外。
- 【必须】除 `index.ts` 和 `readme.md` 外，所有类型文件（包括 `global/` 声明文件）使用 `*Type.ts`。
- 【必须】类型名称使用 PascalCase，例如 `LoginCredentials`、`MapConfig`、`SatelliteState`。

## 3. 类型定义规则

- 【优先】使用 `interface` 描述可扩展对象结构，使用 `type` 描述联合、函数、工具或组合类型。
- 【必须】类型定义稳定、明确；【禁止】混入业务逻辑、状态管理、DOM 操作或副作用。
- 【必须】依赖第三方库类型时使用 `import type`，避免产生运行时依赖。
- 【必须】全局声明文件仅用于声明全局变量、环境变量或扩展第三方类型。
- 【必须】接口类型包含请求参数、响应数据及嵌套结构，API 文件通过 `@/types` 使用。

## 4. 统一对外导出与导入

`src/types/index.ts` 是普通类型的唯一公共出口：

- 【必须】每个普通类型文件中导出的类型均由 `src/types/index.ts` 显式转导出。
- 【禁止】从 `src/types/index.ts` 导出 `global/*Type.ts`；它们通过 `declare global` 和 TypeScript 项目包含机制生效。
- 【优先】`index.ts` 使用 `export type { ... } from "..."` 直接转导出；如确需导入，所有 import 必须位于 export 之前。
- 【必须】转导出按来源路径和类型名称的字典序排列，并与 `check:types-conventions` 规则一致。
- 【必须】业务代码使用 `import type { ... } from "@/types"` 导入公共类型。
- 【禁止】API 文件从 `@/types/<subdirectory>`、`../types/<subdirectory>` 等内部路径导入类型。
- 【优先】`src/types` 内部文件使用相对路径组织依赖，但对外暴露仍经过 `src/types/index.ts`。

示例：

```ts
// src/types/index.ts：直接转导出，无需先创建本地绑定
export type { ExampleData, ExampleItem, ExampleParams } from "./apis/exampleType";
export type { LoginCredentials } from "./auth/credentialsType";
export type { MapConfig } from "./map/configType";

// src/apis/exampleApi.ts
import type { ExampleData, ExampleParams } from "@/types";
```

## 5. 类型变更校验

【必须】新增、修改、移动或删除 `src/types` 文件后依次执行：

```bash
npm run check:types-conventions
npm run type-check
npm run build
```

其中：

- `check:types-conventions` 检查 `*Type.ts` 命名、目录归类、普通类型是否由 `index.ts` 导出、出口排序以及是否绕过统一出口导入。
- `type-check` 检查 TypeScript、Vue 类型和声明文件是否正确。
- `build` 用于确认类型路径和公共出口调整不会破坏生产构建。

校验失败时必须先修复类型目录、命名、导出或导入问题，不得通过关闭类型检查或规避类型系统解决。

## 6. 新增类型检查清单

1. 类型是否归入 `apis`、`pages/<page>Type.ts`、业务领域、`shared` 或 `global` 中的正确位置。
2. 普通文件名是否符合小驼峰概念名 + `Type.ts`。
3. 文件是否只承载单一领域或职责。
4. 普通类型是否已由 `src/types/index.ts` 导出。
5. `index.ts` 的导入、导出是否分别按字典序排列。
6. 业务代码和 API 文件是否通过 `@/types` 使用公共类型。
7. 是否使用了 `import type`，并保持类型文件无运行时业务逻辑。
8. 是否已执行规范校验、类型检查和构建。

## 7. 现状差异与后续整改

- 当前 `src/types/index.ts` 使用直接类型转导出，符合本规范和校验脚本；原文“必须先导入、后导出”的歧义已修正。
- 当前部分业务类型的字段注释完整度不一致，后续修改相关契约时应补充业务含义、单位和可空语义。
