# Plan：全文检索 userName 路由入参处理

## 需求理解

全文检索路由的 `userName` 参数处理与对象空间管理保持一致：嵌入入口携带 `userName` 时，进入全文检索及其检索结果跳转仍保留该参数，并继续使用现有嵌入模式登录与布局行为。

## 修改范围

在现有路由透传守卫基础上补充全文检索场景的自动化覆盖，不改变接口参数、页面结构或新增依赖。

## 文件变更

| 操作 | 路径                                                                                   |
| ---- | -------------------------------------------------------------------------------------- |
| 修改 | `tests/full-text-search.test.mjs` — 增加全文检索路由保留 `userName` 与结果跳转透传断言 |

## 核心实现方式

- 使用 Vue Router 内存路由解析全文检索入口携带的 `userName` 查询参数。
- 复用 `resolveEmbeddedPropagation` 验证从全文检索到工作区内结果详情的跳转会合并原有 `userName`，同时保留其他查询参数。
- 现有 `src/router/embeddedModeGuard.ts` 无需重复实现，避免改变已完成的统一透传逻辑。

## 新增依赖

无。

## 验证方式

- 先运行任务相关测试确认新增断言状态，再执行 `npm test` 与 `npm run test:coverage`。
- 执行 `npm run type-check`、`npm run build:verify`。
- 对 `tests/full-text-search.test.mjs` 执行格式检查，并检查 `git diff --check`、工作区状态和任务范围 diff。
