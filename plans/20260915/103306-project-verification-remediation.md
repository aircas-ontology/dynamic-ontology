# 项目规范与代码验证整改计划

## 需求理解

修复本轮验证发现的模型输入校验、主题变量、登录命令状态问题；调整登录路由例外；将 Codex 导航指南合并到根 `AGENTS.md` 并禁止大模型修改 `public/`；精简 Api.md 驱动 Skill 的职责；增加只覆盖关键约定的确定性检查脚本和测试。修改完成后持续验证，连续两轮无问题即停止。

## 修改范围

- 为 `SatelliteClass` 和 `TimeEngine` 增加关键输入与不变量校验。
- 为登录占位流程补齐 `idle`、`submitting`、`success`、`error` 状态、重复提交保护和明确反馈。
- 修复抽屉样式引用的未定义变量。
- 将登录入口和兜底路由写入路由规范的明确例外，不移动现有路由。
- 将 `.agents/CODEX-NAVIGATION-GUIDE.md` 的现行内容合并到 `AGENTS.md`，将 `public/` 改为大模型禁止修改、删除或提交，并删除独立导航指南。
- 将 `backend-api-implementation` 收敛为单份 Api.md 驱动的跨目录编排流程，目录技术规则以对应 `readme.md` 为准。
- 新增关键项目约定检查器及其测试，并接入项目验证入口。

## 文件变更

### 新增

- `scripts/check-project-conventions.mjs`
- `tests/project-conventions-validator.test.mjs`
- `plans/20260915/103306-project-verification-remediation.md`

### 修改

- `AGENTS.md`
- `.agents/README.md`
- `.agents/skills/backend-api-implementation/SKILL.md`
- `.agents/skills/project-change-planning/SKILL.md`
- `.agents/skills/project-verification-delivery/SKILL.md`
- `package.json`
- `src/models/SatelliteClass.ts`
- `src/models/TimeEngine.ts`
- `src/router/readme.md`
- `src/styles/element-plus/el-drawer.scss`
- `src/views/LoginPage/index.vue`
- `tests/project-conventions.test.mjs`
- `tests/satellite-class.test.mjs`
- `tests/time-engine.test.mjs`

### 删除

- `.agents/CODEX-NAVIGATION-GUIDE.md`

历史 Plan 仅作为记录保留，不因导航指南合并而改写。

## 核心实现方式

1. 先增加能够复现非法时间轴配置、非法轨道采样步长、登录状态缺口和关键约定检查缺口的失败测试。
2. 模型入口仅接受有限数值和有效范围；轨道采样要求有效日期、起点不晚于终点、步长为正有限数。
3. 登录页使用显式命令状态；提交期间禁用表单，当前认证服务未接入时以可见错误状态结束，成功状态保留在完整状态模型中。
4. 抽屉阴影复用现有 Element Plus 公开 CSS 变量。
5. 关键约定检查器不读取 `html/` 或 `public/` 内容，只检查 Markdown 本地链接、项目 Skill 入口与引用、主题变量定义以及根规范中的受保护目录声明。
6. Api.md Skill 负责契约闸门、文件映射、TDD 编排、歧义暂停和验证，不复制 APIs、Types、Mocks 的完整技术规则。

## 新增依赖

无。

## 验证方式

- 针对新增测试分别确认 RED 和 GREEN。
- `npm test`
- `npm run test:coverage`
- `npm run check:types-conventions`
- `npm run check:project-conventions`
- `npm run type-check`
- `npm run build:verify`
- 对所有项目 Skill 运行 `quick_validate.py`
- 检查 Markdown 本地链接、`git diff --check`、任务 diff 和工作区状态。
- 在最终状态连续执行两轮完整验证；连续两轮均无问题后停止。
