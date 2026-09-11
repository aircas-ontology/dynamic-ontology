# TypeScript 类型规范

## 1. 目录职责

`src/types` 用于集中定义项目中的 TypeScript 类型。类型应按照业务领域或职责组织，避免所有类型长期堆放在同一层级。

推荐目录结构：

```text
src/types/
├─ <domain>/             # 具体业务领域，例如 auth、map、satellite
│  ├─ <typeFile>.ts
│  └─ index.ts           # 领域内部统一出口，可选
├─ shared/               # 不属于单一业务领域的通用类型
├─ global/               # 全局声明、环境声明或第三方声明扩展
└─ index.ts              # types 对外统一出口
```

目录组织规则：

- 具体业务类型优先放入对应的业务领域目录，例如 `auth`、`map`、`satellite`。
- 不属于具体业务领域的类型，按照职责归入 `shared`、`global` 等公共目录。
- 目录名使用小写；需要多个单词时使用 kebab-case，例如 `user-center`。
- 同一文件中的类型应属于同一业务领域或同一职责，禁止创建职责混杂的类型文件。
- 类型数量较少且归属明确时，可以暂时放在 `src/types` 根目录；当同一领域类型逐渐增多时，应及时下沉到业务领域目录。

## 2. 文件命名

普通 TypeScript 类型文件统一使用小驼峰命名（camelCase）：

```text
entitySatellite.ts
runtimeConfig.ts
storageGuard.ts
```

命名规则：

- 文件名应表达其承载的业务概念或职责，避免使用 `types.ts`、`common.ts` 等含义过于宽泛的名称。
- 多个单词直接使用小驼峰连接，不使用大驼峰、下划线、中划线或空格。
- 禁止使用拼音、无明确含义的缩写或随意缩写；项目已有通用缩写除外。
- 以 Class 为主要导出的模型文件遵循项目通用约定使用大驼峰；本规范中的小驼峰要求针对普通类型文件。
- `index.ts`、`readme.md`、`*.d.ts` 等生态或声明文件可保留约定命名，但其所在目录和职责必须清晰。

## 3. 类型定义规则

- 优先使用 `interface` 描述可扩展的对象结构，使用 `type` 描述联合类型、函数类型、工具类型或类型组合。
- 类型名称使用大驼峰命名，例如 `LoginCredentials`、`MapConfig`、`SatelliteState`。
- 类型定义应保持稳定、明确，避免在类型文件中混入业务逻辑、状态或 DOM 操作。
- 依赖第三方库类型时使用 `import type`，避免产生不必要的运行时依赖。
- 全局声明文件仅用于声明全局变量、环境变量或扩展第三方类型，不与普通业务类型混放。

## 4. 统一对外暴露

`src/types/index.ts` 是类型目录的统一公共出口：

- 所有需要被业务代码跨目录使用的公共类型，应在 `src/types/index.ts` 中显式导出。
- 业务代码原则上使用 `import type { ... } from "@/types"` 导入类型。
- 业务代码不应依赖具体内部文件路径，例如 `@/types/map` 或 `@/types/shared`；仅在类型目录内部组织文件时使用相对路径引用。
- 领域目录可以通过自身的 `index.ts` 管理领域内的导出，但最终是否对外公开由 `src/types/index.ts` 控制。
- 全局声明文件通过 TypeScript 的类型包含机制生效，不需要也不应从 `src/types/index.ts` 导出。

示例：

```ts
// src/types/index.ts
export type { LoginCredentials } from "./auth/credentials";
export type { MapConfig } from "./map/config";
export type { SatelliteState } from "./satellite/state";

// 业务代码
import type { LoginCredentials } from "@/types";
```

## 5. 新增类型检查清单

新增或调整类型文件时，应确认：

1. 文件名是否符合小驼峰命名规则。
2. 类型是否放在正确的业务领域或公共职责目录中。
3. 文件是否只承载单一领域或职责。
4. 是否需要通过 `src/types/index.ts` 对外暴露。
5. 业务代码是否通过 `@/types` 导入公共类型。
6. 是否使用了 `import type`，并保持类型文件无运行时业务逻辑。
