# 函数注释与命名规范

## 需求理解

在根 `AGENTS.md` 中增加简洁的 JavaScript、TypeScript 和 Vue 函数注释与命名规范。

## 修改范围

- 修改 `AGENTS.md`，增加函数适用范围、JSDoc 和语义化命名规则。
- 新增本 Plan；不修改或删除其他文件。

## 核心实现

- 具名函数和方法使用 JSDoc，按实际签名填写 `@description`、`@param` 和 `@returns`。
- JavaScript 在 JSDoc 中标注类型；TypeScript 和 Vue 不重复签名类型。
- 函数使用表达“动作 + 对象”的 camelCase 名称，禁止 `load`、`submit`、`save` 等孤立动词名称。
- 规则仅约束后续新增或修改的函数，不批量调整现有代码。

## 依赖

不新增依赖。

## 验证方式

- 对本 Plan 和 `AGENTS.md` 执行限定范围的格式化与格式检查。
- 运行 `npm run check:project-conventions`。
- 执行 `git diff --check`，检查任务 diff 和工作区状态。
