# 项目格式化规则实施计划

## 需求理解

建立明确、可执行、可验证的项目格式化机制：Codex 修改代码时必须读取并遵守 `.vscode/settings.json`；Prettier CLI 与 VS Code 使用一致规则；项目提供专用格式化 Skill；格式化只覆盖当前任务文件，不得顺带批量修改；`html/` 和 `public/` 始终排除在格式化范围之外。

## 修改范围

### 新增

- `.prettierrc.json`
- `.prettierignore`
- `.agents/skills/code-formatting/SKILL.md`
- `.agents/skills/code-formatting/agents/openai.yaml`
- 本 Plan 文件

### 修改

- `AGENTS.md`
- `.vscode/settings.json`
- `.vscode/extensions.json`
- `.agents/README.md`
- `.agents/skills/project-verification-delivery/SKILL.md`
- `package.json`
- `package-lock.json`
- `scripts/check-project-conventions.mjs`
- `tests/project-conventions-validator.test.mjs`
- `tests/project-conventions.test.mjs`

### 删除

无。

不修改 `src/`、`public/`、`html/`，不覆盖或回退用户已有的 `.gitignore` 修改。

## 核心实现方式

1. 先增加失败测试，约束 VS Code 格式化设置、Prettier 配置、受保护目录忽略项、npm 脚本、根规则及项目 Skill 索引。
2. 安装 Prettier 开发依赖并同步更新 `package.json` 与 `package-lock.json`。
3. 新增 `.prettierrc.json`，以 `tabWidth: 2`、`printWidth: 160`、空格缩进对应现有 `.vscode/settings.json`；编辑器配置增加 `prettier.requireConfig` 并推荐 Prettier 扩展。
4. 新增 `format` 和 `format:check` 脚本。两个脚本由调用方提供明确文件列表，不把写入式全仓格式化作为项目工作流。
5. 新增 `code-formatting` Skill，要求修改前读取 `.vscode/settings.json` 和 `.prettierrc.json`，只格式化当前任务文件，并禁止触碰 `html/`、`public/` 和无关用户修改。
6. 更新 `AGENTS.md`、Skill 索引和交付验证 Skill，使格式规则成为项目硬边界并进入交付检查。
7. 扩展项目规范检查器，验证编辑器配置、Prettier 配置、保护目录忽略项、npm 脚本和根规则保持一致。

## 新增依赖及必要性

- 新增开发依赖 `prettier`，用于提供不依赖开发者本机 VS Code 的可复现格式化与检查能力。
- 不新增运行时依赖。

## TDD 与实施步骤

1. 在 `tests/project-conventions-validator.test.mjs` 和 `tests/project-conventions.test.mjs` 增加格式化契约测试。
2. 运行相关测试，确认因缺少配置、脚本和 Skill 而按预期失败。
3. 完成最小配置、规范检查器和 Skill 实现，使相关测试通过。
4. 仅对本次修改且受 Prettier 支持的文件执行格式化和格式检查。
5. 若检查暴露大量历史格式问题，不进行批量格式化，停止并提交范围调整说明。

## 验证方式

- RED：`node --test --experimental-strip-types tests/project-conventions-validator.test.mjs tests/project-conventions.test.mjs`
- GREEN：重新运行上述定向测试。
- 使用 `skill-creator` 的 `quick_validate.py` 校验 `.agents/skills/code-formatting`。
- 对本次修改文件运行 `npm run format:check -- <明确文件列表>`。
- 执行 `npm test`。
- 执行 `npm run test:coverage`，覆盖率保持不低于 80%。
- 执行 `npm run check:project-conventions`。
- 执行 `npm run type-check`。
- 执行 `npm run build:verify`。
- 执行 `git diff --check`，检查任务 diff 和 `git status --short`。

## 风险与边界

- `Writing Plans` 公共 Skill 建议使用 `docs/plans/`，但项目规则明确使用 `plans/`，本 Plan 按项目高优先级规则保存。
- 安装依赖需要网络访问，实施时按环境权限请求授权。
- `.prettierignore` 必须排除 `html/` 和 `public/`；任何验证不得读取 `html/` 或修改 `public/`。
- 工作区原有 `.gitignore` 修改属于用户，不纳入本任务。
