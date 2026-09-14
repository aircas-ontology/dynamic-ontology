# 本体 API Demo 计划

## 需求理解

参考 `src/apis/readme.md`，为 `src/apis` 增加一个符合目录规范的 TypeScript API demo，并通过 `index.ts` 统一导出。

## 修改范围

- 新增本体列表 API 示例及其请求、响应类型。
- 更新 `src/apis/index.ts` 的统一导出。
- 不新增依赖，不修改 `html/`、`public/` 或无关文件。

## 核心实现方式

- 新增 `src/apis/ontologyApi.ts`。
- 使用现有 `@/utils/request` 发起 GET 请求。
- 使用 JSDoc 说明接口用途、参数和返回值。

## 验证方式

- 执行 `npm run type-check`，确认新增类型和导出无误。
