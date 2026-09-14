# Codex 仓库导航指南

本文是 Codex 在本仓库中的固定导航入口，随项目级 Agent 资料存放在 `.agents/`。开发 Prompt 遵循 [docs 目录规范](../docs/readme.md)，按日期归档。

## 1. 开始任务前

按以下顺序确认上下文：

1. 阅读根目录 [AGENTS.md](../AGENTS.md)，确定全仓库规则、受保护目录和技术约束。
2. 查看 `git status --short`，区分用户已有修改与当前任务修改。
3. 使用 `rg --files`、`rg` 和只读命令定位相关文件；检索时排除 `html/`。
4. 修改 `src/<directory>/` 前，完整阅读该目录的 `readme.md`；目录级规范与根规则共同生效。
5. 涉及文件新增、删除、配置、依赖或行为变更时，先按项目规划流程确认范围并保存 Plan。

规则冲突时遵循 `AGENTS.md` 中定义的优先级；无法自行消解的冲突应先说明影响并等待用户确认。

## 2. 仓库入口

| 路径 | 职责 |
| --- | --- |
| [README.md](../README.md) | 项目简介、运行方式和推荐技能来源 |
| [package.json](../package.json) | 依赖、Node.js 版本和可执行脚本 |
| [src/main.ts](../src/main.ts) | Vue 应用启动入口 |
| [src/App.vue](../src/App.vue) | 根组件 |
| [src/router/index.ts](../src/router/index.ts) | 路由装配入口 |
| [src/styles/index.scss](../src/styles/index.scss) | 全局样式聚合入口 |
| [vite.config.ts](../vite.config.ts) | Vite 与构建配置 |
| [tests](../tests) | Node 测试套件 |
| [scripts](../scripts) | 项目约定检查等维护脚本 |

本项目使用 Vue 3、Composition API、TypeScript、Vite、Pinia、Vue Router 和 Element Plus。第三方可视化能力包括 Mars3D/Cesium、ECharts、Three.js 和 OpenLayers。

## 3. 目录职责

| 路径 | 真实职责 | 修改前必读 |
| --- | --- | --- |
| `src/apis/` | 后端请求函数；统一经请求工具调用 | [规范](../src/apis/readme.md) |
| `src/assets/` | 由 Vite 参与构建的页面、布局和组件资源 | [规范](../src/assets/readme.md) |
| `src/components/` | 必须由统一入口全局注册的公共组件 | [规范](../src/components/readme.md) |
| `src/layout/` | 应用公共骨架与布局级交互 | [规范](../src/layout/readme.md) |
| `src/mocks/` | 开发、演示和测试样例数据 | [规范](../src/mocks/readme.md) |
| `src/models/` | 具有状态、行为和约束的领域模型 | [规范](../src/models/readme.md) |
| `src/router/` | 路由实例、模块装配、守卫和元信息 | [规范](../src/router/readme.md) |
| `src/stores/` | 需要共享或持续存在的 Pinia 业务状态 | [规范](../src/stores/readme.md) |
| `src/styles/` | 主题令牌、全局样式和 Element Plus 覆盖 | [规范](../src/styles/readme.md) |
| `src/types/` | API、页面、领域、共享及全局 TypeScript 类型 | [规范](../src/types/readme.md) |
| `src/utils/` | 无页面状态的通用工具和基础设施适配器 | [规范](../src/utils/readme.md) |
| `src/views/` | 路由页面和完整用户流程编排 | [规范](../src/views/readme.md) |
| `docs/` | 开发人员编写的待执行 Prompt，按 `YYYYMMDD/` 归档 | [规范](../docs/readme.md) |
| `plans/` | 已确认的变更 Plan 和实施记录 | — |
| `public/` | 部署后静态资源与运行时配置；仓库规则禁止修改 | — |
| `html/` | 生产构建产物；禁止读取、修改或提交 | — |

## 4. 常见任务定位

| 任务 | 优先检查 |
| --- | --- |
| 新增或调整页面 | `src/views/`、`src/router/`、`src/assets/pages/`、`src/types/pages/` |
| 新增后端接口 | `src/apis/`、`src/types/apis/`、`src/utils/request.ts` |
| 调整共享状态 | `src/stores/`、相关领域类型和调用页面 |
| 修改公共组件 | `src/components/`、`src/assets/components/`、`src/styles/` |
| 修改主题或 Element Plus 外观 | `src/styles/theme-*.css`、`src/styles/element-plus/`、组件局部样式 |
| 修改地图或三维能力 | `src/utils/initEarth.ts`、相关模型、组件或页面，并核对实例生命周期 |
| 修改类型 | `src/types/`、`src/types/index.ts`、`scripts/check-types-conventions.mjs` |
| 修改构建配置 | `vite.config.ts`、`tsconfig*.json`、`package.json` |
| 增加或调整测试 | `tests/`、对应实现和 `package.json` scripts |

## 5. 规范入口

- 全项目硬边界、环境、异步状态和测试要求以 [AGENTS.md](../AGENTS.md) 为准。
- 目录技术规范以目标 `src/<directory>/readme.md` 为准。
- 工作流程以任务实际触发的 [项目 Skills](README.md) 为准。
- 开发 Prompt 只有在用户明确指定后才进入当前任务范围；历史 Plan 不作为现行规范。

## 6. 验证入口

实际运行前先读取 [package.json](../package.json) 中的 scripts，不臆造命令。当前常用入口如下：

```sh
npm test
npm run test:coverage
npm run check:types-conventions
npm run type-check
npm run build:verify
```

验证强度应与变更范围匹配：纯文档变更检查格式、链接和 diff；应用代码、类型、配置或依赖变更执行相关测试、类型检查和临时目录构建。正式发布用的 `npm run build` 会写入受保护的 `html/`，Codex 不得将其用于验证。

交付前至少检查 `git diff --check`、任务相关 diff 和 `git status --short`，确保没有计划外文件、调试代码、硬编码秘密或意外生成物。
