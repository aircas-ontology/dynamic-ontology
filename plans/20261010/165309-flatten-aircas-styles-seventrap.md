# Aircas 样式目录提升 Plan

用户已确认本方案，由当前 Agent 单独实施，不使用 Subagent。

## 需求理解

将 src/styles/aircas/ 内全部内容提升至 src/styles/，尽量采用 copy。保持已有主题、CSS 变量、样式加载顺序和界面行为。

## 修改范围与文件

- 复制新增：src/styles/common/ 下 7 个 SCSS、themes/ 下 2 个 SCSS、components/ 下 5 个 SCSS、variables.scss、index.scss，共 16 个 SCSS 文件。
- 修改：src/styles/readme.md，合并原 Aircas 接入说明与现有目录规范，避免同名覆盖。
- 修改：src/main.ts，全局样式入口改为 @/styles/index.scss，保留 Element Plus 引入顺序。
- 修改：scripts/check-project-conventions.mjs，使用提升后的入口、主题路径和样式源码排除范围。
- 修改：tests/action-button-tones.test.mjs、tests/form-control-disabled.test.mjs、tests/aircas-theme-migration.test.mjs、tests/project-conventions.test.mjs、tests/ontology-subspace-create.test.mjs、tests/project-conventions-validator.test.mjs，更新路径与 fixture；保留有效主题、缺失令牌、暗亮不一致和 Sass 错误场景。
- 修改：AGENTS.md、.agents/skills/aircas-ui-development/SKILL.md、.agents/skills/aircas-ui-development/references/visual-system.md，仅同步迁移后的样式路径与规范链接。
- 删除：完成复制核对、CSS 一致性检查后删除原 src/styles/aircas/（16 个 SCSS 和 readme.md）。
- 新增：本 Plan 文件。

## 核心实现方式

1. 在系统临时目录保留原始样式、相关文件、工作区状态、源码摘要和编译 CSS 快照。
2. 先更新相关测试与 fixture，实际运行确认新入口及检查脚本尚未迁移而失败。
3. 使用 copy 复制目录与文件，保留相对层级和内部 Sass 引用；README 内容合并。
4. 同步应用入口、检查脚本、测试与当前规范中的路径；不批量修改历史 plans 或待执行 docs。
5. 核对所有 16 个 SCSS 复制完整、编译 CSS 与原入口一致，再清理原目录。
6. 格式化仅覆盖本次明确涉及的文件，格式化后再次核对编译 CSS 一致。

## 依赖与边界

不新增或调整依赖。保留用户已有修改；不读取 html/，不修改 public/，不提交或推送。本次目录提升授权同步调整原规范中限定 aircas 路径的内容；Subagent 规则冲突按确认方案采用单 Agent。

## 验证方式

- 定向 RED/GREEN：Node 测试入口运行迁移测试与规范检查 fixture。
- npm test；npm run test:coverage（行、函数、分支 80% 门槛，统计范围为脚本实际加载文件）。
- npm run type-check；npm run build:verify（构建到系统临时目录）；npm run check:project-conventions。
- npm run format 与 format:check，仅明确文件列表。
- 迁移前后 CSS 严格比较、旧运行路径残留扫描、目录及 README 链接核对。
- git diff --check、任务 diff、git status --short，并对比迁移前摘要确保无关文件保留。
- 无样式内容或交互行为改变，以编译 CSS 一致性证明迁移不改变视觉规则；当前无 E2E/Lint script，不将其描述为已验证，人工最终验收由用户完成。

必需检查失败时区分已有失败与迁移引入失败，仅修复当前迁移范围的问题。

## 实施与验证记录

目录迁移已落地，整体必需检查仍有既有失败，不标记为全部验证完成。

- Copy 后逐文件核对 16 个 SCSS 与迁移前快照字节一致；原目录 17 个文件（含 README）的内容完整提升，README 接入说明完整保留。
- 原入口与新入口复制时的编译 CSS 字节一致。限定文件格式化改变了编译 CSS 的空白；将相同 Prettier 配置应用到系统临时目录中的原始快照后，编译 CSS 再次字节一致。
- TDD RED：更新新路径和 fixture 后，定向测试 4 项因新入口缺失或检查器仍要求旧入口而失败。GREEN：相关 8 项定向测试全部通过。
- npm run format:check：29 个明确任务文件通过。
- npm run build:verify：通过，产物位于系统临时目录。
- npm test：389 项，382 通过、7 失败。迁移前快照在系统临时目录复跑为同样的 382 通过、7 失败，未新增失败。
- npm run test:coverage：失败。当前脚本实际加载文件的行覆盖率 87.58%、函数覆盖率 80.20%、分支覆盖率 75.38%，分支低于 80%；迁移前分别为 87.57%、80.10%、75.34%，原已不达标。同时包含上述 7 项既有测试失败。这些数字不是全项目源码覆盖率。
- npm run type-check：失败，ApplicationManagement 的 ApiDocsEndpointDetail.vue 有 TabPaneName 到 string 的类型错误；ApiDocsEndpointList.vue 有 aria-label、aria-hidden 属性类型错误。迁移前快照复跑为相同 3 项错误。
- npm run check:project-conventions：失败，18 项均与迁移前相同，涉及 code-formatting 缺少 Skill 索引、docs/readme.md 缺失链接、plans/PLAN.md 既有链接和 .prettierignore 未排除 public/；本次没有新增规范失败。
- 既有失败测试涉及对象导出、空间导出、登录超时、对象查询接口、空间操作按钮、格式配置一致性和旧布局清理，均不属于本次迁移范围。
- git diff --check 通过；已审查相对任务开始快照的 diff 和 git status。源码摘要比对确认无计划外文件修改、删除或新增。
- 无新增依赖，无运行时旧样式路径残留（测试中明确禁止旧路径的断言除外）；历史 plans 与待执行 docs 保留原记录。
- 浏览器验证未执行：本次仅目录提升，通过统一格式后的编译 CSS 一致性验证迁移前后规则不变，未修改交互；当前无 Lint/E2E script，未声称已验证。人工最终验收尚未执行。

未完成事项：上述既有测试、分支覆盖率、类型和规范检查失败仍需另行处理，本次未扩大范围修复。
