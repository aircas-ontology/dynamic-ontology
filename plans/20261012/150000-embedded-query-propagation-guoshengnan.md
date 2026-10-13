# 嵌入模式 userName 参数透传方案

## 需求理解

`/workspace/ontology-space-management` 与 `/workspace/full-text-search` 均有后续页面（空间详情、对象详情、概念模型构建等）。要求：入口路由携带 `userName` 参数进入嵌入模式后，站内跳转到后续页面时也持续隐藏顶部栏和左侧导航栏。

## 核心思路

新增全局路由守卫，在 `/workspace` 布局内的站内跳转中自动透传 `userName` 查询参数，URL 始终作为嵌入状态的唯一事实来源，布局层零改动。

## 修改范围

| 文件 | 操作 | 内容 |
|---|---|---|
| `src/router/embeddedModeGuard.ts` | 新增 | `resolveEmbeddedPropagation` 纯函数 + `registerEmbeddedModeGuard` |
| `src/router/index.ts` | 修改 | 在 `registerAuthGuard` 之后注册新守卫 |
| `tests/embedded-mode-guard.test.mjs` | 新增 | TDD：透传 / 放行 / 非布局路由不透传 / 无死循环用例 |

## 核心实现方式

守卫规则：

1. 目标路由已带 `userName` → 放行（首次进入、刷新）
2. 目标不带 `userName`、来源路由带有、且目标 `matched` 含 `Workspace` 布局路由 → 重定向到原目标并合并 `userName`
3. 其他情况（登录页、普通模式跳转）→ 放行

守卫在 `registerAuthGuard` 之后注册，登录重定向优先。

## 新增依赖

无。

## 验证方式

1. TDD：先写测试并确认失败，再实现并验证通过；`npm test`、`npm run test:coverage`
2. `npm run type-check`（对比既有 4 个无关错误确认无新增）、`npm run build:verify`
3. `npm run format:check` 覆盖新增/修改文件
4. 浏览器人工验收：嵌入入口 → 空间详情，确认导航持续隐藏且 URL 带参数
