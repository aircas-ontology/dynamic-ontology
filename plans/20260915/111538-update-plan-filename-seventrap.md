# 更新 Plan 文件命名规则

## 需求理解

在 `project-change-planning` Skill 规定的 Plan 文件名末尾追加当前仓库的 Git 用户名，便于识别 Plan 的编辑者。

## 修改范围

- 更新 `.agents/skills/project-change-planning/SKILL.md` 中的 Plan 保存路径和命名说明。
- 不修改或重命名已有历史 Plan。

## 文件变更

- 新增：`plans/20260915/111538-update-plan-filename-seventrap.md`
- 修改：`.agents/skills/project-change-planning/SKILL.md`
- 删除：无

## 核心实现方式

- Plan 路径格式调整为 `plans/YYYYMMDD/HHmmss-<topic>-<git-user>.md`。
- `git-user` 读取当前仓库的 `git config user.name`。
- 将 Git 用户名转换为适合文件名的 kebab-case；若未配置用户名，则停止保存并提示用户先配置。
- 日期和时间继续使用 `Asia/Shanghai`，`topic` 继续使用小写 kebab-case。

## 新增依赖及必要性

无。

## 验证方式

- 运行 Skill 快速校验。
- 运行 `npm run check:project-conventions`。
- 运行 `git diff --check`。
- 检查任务相关 diff 与 `git status --short`，确保没有计划外改动。
