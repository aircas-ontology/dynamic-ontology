# P0 项目规范 Skill 化实施计划

## 需求理解

- 将项目变更规划、Aircas UI 开发、项目验证与交付三个 P0 工作流封装为项目级 Skills。
- 在 `.agents/skills/README.md` 建立便于大模型检索的 Skills 目录说明。
- 从 `AGENTS.md` 移除已迁入 Skills 的详细流程，保留必须常驻的权限边界与禁止项。
- 对仅涉及展示文案、已有主题颜色引用、字体大小或字重的低风险小改，允许免除完整 Plan，但仍需先检查并进行适当验证。

## 修改范围

- 新增三个 Skill 及其 Codex UI 元数据。
- 为 Aircas UI Skill 增加按需读取的视觉系统参考文档。
- 新增项目 Skills 检索入口。
- 精简 `AGENTS.md` 中与三个 P0 Skills 重复的内容。
- 不处理当前工作区已有的 `public/configs/mapConfigTemplate.js` 删除状态。

## 文件变更

### 新增

- `.agents/skills/README.md`
- `.agents/skills/project-change-planning/SKILL.md`
- `.agents/skills/project-change-planning/agents/openai.yaml`
- `.agents/skills/aircas-ui-development/SKILL.md`
- `.agents/skills/aircas-ui-development/references/visual-system.md`
- `.agents/skills/aircas-ui-development/agents/openai.yaml`
- `.agents/skills/project-verification-delivery/SKILL.md`
- `.agents/skills/project-verification-delivery/agents/openai.yaml`
- `plans/20260911/175124-encapsulate-p0-skills.md`

### 修改

- `AGENTS.md`

### 删除

- 无。

## 核心实现方式

- Skills 使用准确的 frontmatter 描述并保持自动发现。
- `project-change-planning` 负责低风险小改判定、只读检查、Plan、确认、范围控制和依赖评估。
- `aircas-ui-development` 负责 SCSS、主题变量、Element Plus、图标、无障碍、交互状态和视觉一致性；详细视觉尺度放入 reference。
- `project-verification-delivery` 根据 `package.json` 和修改类型选择验证命令，并生成真实、简洁的交付摘要。
- `.agents/skills/README.md` 记录各 Skill 的路径、触发条件、边界和建议调用顺序。
- `AGENTS.md` 保留规则优先级、范围限制、类型安全、受保护目录、Subagent 确认和增量输出等常驻约束。

## 新增依赖及必要性

无。

## 验证方式

- 使用 `skill-creator/scripts/quick_validate.py` 分别校验三个 Skill。
- 检查 Skill frontmatter、自动调用策略、README 链接和 reference 路由。
- 检查 `AGENTS.md` 与 Skills 的规则分工和最终差异。
- 执行 `npm run type-check`。
- 执行 `npm run build`。
