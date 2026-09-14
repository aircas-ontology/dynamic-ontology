# 第三方实例 Skill 抽取 Plan

## 需求理解

将 `AGENTS.md` 中的“第三方实例”规则单独抽取为项目级 Skill，存放在 `.agents/skills/`，并保持规则可被发现和复用。

## 修改范围

- 从 `AGENTS.md` 删除“第三方实例”章节。
- 新增 `.agents/skills/third-party-instance-management/SKILL.md`。
- 更新 `.agents/skills/README.md` 中的 Skill 索引和调用顺序说明。
- 保留工作区中与本任务无关的现有修改。

## 文件变更

- 新增：`.agents/skills/third-party-instance-management/SKILL.md`
- 修改：`.agents/skills/README.md`
- 修改：`AGENTS.md`
- 新增：`plans/20260911/182655-third-party-instance-skill.md`
- 删除：无

## 核心实现方式

- 使用可区分的名称和描述，让涉及 ECharts、Three.js、Cesium、Mars3D、OpenLayers 等实例集成或生命周期管理的任务自动触发该 Skill。
- 保留原章节关于 Cesium 工具优先级、资源释放、防止重复初始化和 Vue 深度代理边界的约束，并补充最小必要的安全存储方式说明。
- 在项目 Skill 索引中登记入口，不复制完整规则。

## 新增依赖

无。

## 验证方式

- 使用 `skill-creator` 的 `quick_validate.py` 校验新增 Skill。
- 检查 Skill 索引链接、工作区状态和本任务相关 diff。
