# Plan：新增「全文检索」菜单与页面

## 需求理解

在左侧导航增加菜单「全文检索」，配置语义化路由，右侧页面仅展示一个检索输入框，placeholder 为「检索空间，对象，实例，属性..」。

## 修改范围

仅涉及导航菜单、工作区路由模块、新建页面；不改 HeaderBar 顶栏搜索、不接 API/Store。

## 文件变更

| 操作 | 路径 |
| --- | --- |
| 修改 | `src/layout/components/NavigationMenu.vue` — 增加菜单项 |
| 修改 | `src/router/modules/workspaceRoutes.ts` — 增加子路由 |
| 新增 | `src/views/FullTextSearch/index.vue` — 检索页 |
| 新增 | `tests/full-text-search.test.mjs` — 路由与页面断言 |
| 修改 | `tests/layout-navigation.test.mjs` — 菜单项断言 |

## 核心实现方式

- **路由**：`name: 'FullTextSearch'`，`path: 'full-text-search'`（完整 URL：`/workspace/full-text-search`），`meta.title: '全文检索'`，懒加载页面
- **菜单**：与「本体空间管理」同级，使用命名路由跳转；图标使用 Element Plus `Search`
- **页面**：放置 `el-input`（`aircas-input`），placeholder 按原文；本地 `ref` 绑定关键词，暂不实现检索逻辑

## 新增依赖

无。

## 验证方式

- TDD：新增 `tests/full-text-search.test.mjs`，并扩展 `tests/layout-navigation.test.mjs`
- `npm test`（任务相关用例）
- `npm run test:coverage`
- `npm run type-check`
- `npm run build:verify`
- 手工确认：点击菜单可进入页面，面包屑显示「全文检索」，输入框 placeholder 正确
