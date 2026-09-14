# 更新 APIs 目录规范

## 需求理解

根据 `src/apis` 当前实现及其关联的类型、请求工具，总结可复用的接口定义规则，并更新 `src/apis/readme.md`。

## 修改范围

- 修改 `src/apis/readme.md`。
- 新增本 Plan 文件。
- 不修改接口实现、类型、配置、依赖或构建产物。

## 核心实现方式

- 以 `exampleApi.ts`、`index.ts`、`src/types/apis`、`src/types/index.ts` 和 `src/utils/request.ts` 为依据。
- 整理目录职责、命名、类型引用、请求封装、JSDoc、统一出口和排序规则。
- 提供与现有实现一致的示例和新增接口检查清单。

## 依赖

不新增依赖。

## 验证方式

- 检查 Markdown 结构和内部路径引用。
- 检查 Git diff，确保除 Plan 外仅修改 `src/apis/readme.md`。
- 本次仅修改文档，不执行应用级类型检查或生产构建。
