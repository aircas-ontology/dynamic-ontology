# Plan：应用管理 · OpenAPI 接口文档展示

## 需求理解

按 `docs/20260922/getOntologyApiDocsApi-shijian.md` 拉取 OpenAPI 文档，新建「应用管理」菜单（与全文检索平级），主区以左右分栏展示接口列表与详情。数据标准为 OpenAPI 3.1（SpringDoc `/v3/api-docs`）。Mock 使用用户提供的 `src/mocks/apiDocsOntologyMock/mock.ts` 中的裸 OpenAPI JSON。

## 修改范围

- 菜单、路由、页面 `ApplicationManagement`
- `ontologyDocApi.ts`、OpenAPI 展示类型、Mock 规范化
- 页面解析工具与异步状态；契约映射测试

## 新增 / 修改 / 删除文件

| 路径                                                   | 动作                               |
| ------------------------------------------------------ | ---------------------------------- |
| `src/apis/ontologyDocApi.ts`                           | 实现 `getOntologyApiDocsInterface` |
| `src/apis/index.ts`                                    | 导出接口                           |
| `src/types/apis/ontologyApiDocsType.ts`                | OpenAPI 展示用类型                 |
| `src/types/pages/applicationManagementType.ts`         | 页面视图模型类型                   |
| `src/types/index.ts`                                   | 转导出                             |
| `src/mocks/apiDocsOntologyMock/apiDocsOntologyMock.ts` | 规范化 Mock 导出                   |
| `src/mocks/apiDocsOntologyMock/mock.ts`                | 删除（内容迁入正式 Mock 文件）     |
| `src/layout/components/NavigationMenu.vue`             | 增加菜单项                         |
| `src/router/modules/workspaceRoutes.ts`                | 增加路由                           |
| `src/views/ApplicationManagement/**`                   | 页面、composables、utils、组件     |
| `tests/ontology-api-docs-api.test.mjs`                 | 契约与页面接线测试                 |
| `tests/application-management-page.test.mjs`           | 解析与路由/菜单测试                |

## 核心实现方式

1. `GET DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/v3/api-docs/ontology"`，返回裸 `OntologyApiDocsData`（非 `ApiResponse`，本接口例外）。
2. 解析 `paths` / `tags` 生成左侧分组列表；选中项展示方法、路径、summary、operationId、servers/info、parameters、requestBody、responses。
3. 样式遵循 Aircas 暗色紧凑风格，布局对齐截图左右分栏。

## 新增依赖

无。

## 验证方式

- `node --test` 相关测试文件
- `npm run type-check`（已知无关失败则记录）
- `npm run format:check -- <任务文件>`
- `npm run check:types-conventions`、`npm run check:project-conventions`
- `npm run build:verify`
- `git diff --check`、任务 diff 与 `git status --short`
