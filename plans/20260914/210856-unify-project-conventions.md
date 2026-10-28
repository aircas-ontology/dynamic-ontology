# 统一项目规范与约束实施计划

## 需求理解

审计并统一项目的规范来源、目录职责、Skills、开发 Prompt、环境版本、构建验证、类型归属和组件注册规则，修复用户逐项确认的冲突及直接实现偏差。

## 修改范围

- 调整 `AGENTS.md`、`.agents/`、`README.md` 和相关 `src/*/readme.md`，明确规则归属并移除冲突或重复约束。
- 明确 `docs/` 存放开发 Prompt、`plans/` 存放已确认 Plan 和历史记录，并让两个目录进入版本控制。
- 统一 Node.js、Chrome、npm、锁文件和构建验证要求。
- 将 `ApiResponse<T>` 迁入 `src/types/apis` 并通过 `@/types` 使用。
- 将 `src/components/AircasTimeline.vue` 加入全局组件注册。
- 补齐第三方实例 Skill 的 Codex 元数据，并校准项目 Skills 对公共 Skills 的可选依赖边界。
- 修订当前 API Prompt，使示例符合 API、Mock 和类型目录规范。
- 保留用户已完成的 `AGENTS.md` 与 `.agents/CODEX-NAVIGATION-GUIDE.md` 迁移修改，不覆盖或回退。

## 文件变化

### 新增

- `.npmrc`
- `.agents/skills/third-party-instance-management/agents/openai.yaml`
- `scripts/verify-build.mjs`
- `src/types/apis/apiResponseType.ts`
- `tests/project-conventions.test.mjs`
- 本 Plan 文件

### 修改

- `AGENTS.md`
- `README.md`
- `.gitignore`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `.agents/README.md`
- `.agents/CODEX-NAVIGATION-GUIDE.md`
- 4 个项目 `SKILL.md` 及必要参考文档
- 受本次规则裁决影响的 `src/*/readme.md`
- `docs/readme.md`
- `docs/20260914/1.ontologySearchApi.md`
- `src/utils/request.ts`
- `src/types/index.ts`
- `src/apis/exampleApi.ts`
- `src/components/register.ts`

### 删除

无。历史 Plan 不重命名、不改写。

## 核心实现方式

1. 使用测试先描述 `ApiResponse` 归属、全局组件注册、Node/npm/Chrome 配置及临时构建要求，并确认测试因缺少实现而失败。
2. 完成最小 TypeScript、配置和构建验证脚本修改，使目标测试通过。
3. 以 `AGENTS.md` 管理全局硬边界、目录 `readme.md` 管理技术规范、项目 Skills 管理工作流程、`docs/` 管理待执行 Prompt、`plans/` 管理历史方案。
4. 项目 Skills 引用规范来源，不把公共 Skills 当作必然存在的项目依赖。
5. 保留 `npm run build` 供人工发布；自动化验证统一使用输出到系统临时目录的 `npm run build:verify`。

## 新增依赖及必要性

不新增运行时依赖。将已有开发依赖 `@types/node` 升级到 Node 24 对应版本，使类型环境与最低运行时版本一致。

## 验证方式

- RED：运行新增规范测试并确认因目标能力缺失而失败。
- GREEN：运行新增规范测试并确认通过。
- 执行 `npm test`。
- 执行 `npm run test:coverage`，覆盖率门槛保持 80%。
- 执行 `npm run check:types-conventions`。
- 执行 `npm run type-check`。
- 执行 `npm run build:verify`，确认输出位于系统临时目录且未触碰 `html/`。
- 使用 `skill-creator` 的 `quick_validate.py` 校验全部项目 Skills。
- 检查 Markdown 相对链接、`git diff --check`、任务 diff 和 `git status --short`。
