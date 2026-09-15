# 项目 Skills 目录

本目录存放由本项目创建并随仓库维护的项目 Skills。大模型处理任务时，应根据下表的触发条件读取对应 `SKILL.md`，不要仅依赖本索引执行具体流程。

项目全局硬边界由 [`AGENTS.md`](../AGENTS.md) 维护，目录技术规范由对应 `src/<directory>/readme.md` 维护；项目 Skill 只维护工作流程和检查方法。README 中列出的公共 Skills 可从互联网下载安装，但不是项目必备依赖，也不能覆盖项目规范。

## Skill 索引

| Skill                             | 入口                                                                                                 | 使用时机                                                                                     | 不适用场景                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `project-change-planning`         | [`skills/project-change-planning/SKILL.md`](skills/project-change-planning/SKILL.md)                 | 新增、修改或删除代码、组件、样式、配置、依赖、Mock 或其他项目文件时，先判断是否需要完整 Plan | 纯只读分析、问题定位、代码解释和修改建议            |
| `backend-api-implementation`      | [`skills/backend-api-implementation/SKILL.md`](skills/backend-api-implementation/SKILL.md)           | 用户明确指定一份 `docs/YYYYMMDD/*Api.md`，需要据此自动生成 API、类型和 Mock 时               | 未指定准确 Api.md、一次处理多份文档或仅讨论接口设计 |
| `aircas-ui-development`           | [`skills/aircas-ui-development/SKILL.md`](skills/aircas-ui-development/SKILL.md)                     | 设计、实现、审查或调整 Vue 页面、组件、SCSS、主题和 Element Plus 外观时                      | 不涉及界面的纯业务逻辑修改                          |
| `third-party-instance-management` | [`skills/third-party-instance-management/SKILL.md`](skills/third-party-instance-management/SKILL.md) | 集成、维护或审查 ECharts、Three.js、Cesium、Mars3D、OpenLayers 等第三方实例时                | 不涉及第三方复杂实例的普通 Vue 状态管理             |
| `project-verification-delivery`   | [`skills/project-verification-delivery/SKILL.md`](skills/project-verification-delivery/SKILL.md)     | 项目文件修改完成、准备声明完成或交付结果时                                                   | 尚未产生修改的只读任务                              |

## 建议调用顺序

涉及界面的常规修改通常按以下顺序使用：

1. 使用 `project-change-planning` 检查上下文并判断是否需要完整 Plan。
2. 实施指定 Api.md 时使用 `backend-api-implementation`。
3. 实施 UI 修改时使用 `aircas-ui-development`。
4. 涉及第三方可视化、地图或图形实例时使用 `third-party-instance-management`。
5. 完成修改后使用 `project-verification-delivery` 验证并交付。

低风险展示性小改是否免除完整 Plan，由 `project-change-planning` 根据实际影响判断。免除 Plan 不代表免除修改前检查、范围控制或修改后验证。

## 目录约定

- 每个 Skill 使用小写连字符命名的独立目录，并以 `SKILL.md` 作为入口。
- 每个项目 Skill 必须包含与 Skill 一致的 `agents/openai.yaml`，用于界面元数据和调用策略。
- 仅在内容需要按场景加载时增加 `references/`；重复执行且需要确定性的操作才增加 `scripts/`。
- 新增或大幅修改 Skill 时，使用 `skill-creator` 的 `quick_validate.py` 校验。
- 项目约束只在其责任位置维护一份；本索引负责检索，不复制各 Skill 的完整规则。
- 项目 Skill 引用公共 Skill 时必须提供不可用时的项目内替代流程。
