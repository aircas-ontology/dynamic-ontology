---
name: project-change-planning
description: Inspect, scope, and plan changes in this repository before implementation. Use for code, component, style, configuration, dependency, Mock, or file changes, including deciding whether a low-risk presentation edit may skip a full Plan.
---

# Project Change Planning

在实施前确定真实影响范围，并让计划强度与修改风险匹配。

## 先分类

以下任务不需要完整 Plan：

- 只读分析、问题定位、代码解释或修改建议；
- 同时满足下列全部条件的低风险展示性小改：
  - 用户已经明确目标和预期结果；
  - 仅调整展示文案、已有主题颜色变量的引用、字体大小或字重；
  - 不改变布局结构、组件结构、交互、业务逻辑、数据流、接口、类型、配置或依赖；
  - 不新增、删除或移动文件，不触碰受保护目录；
  - 影响局部、直接且能够通过检查明确验证。

低风险小改仍须先只读检查直接相关文件，采用最小修改，并在完成后执行与影响相称的验证。任一条件不满足或影响不确定时，执行完整 Plan 流程。

## 完整 Plan 流程

1. 读取根 `AGENTS.md`、导航指南、任务涉及目录的 `readme.md`，再只读检查相关文件、现有实现和仓库状态；不得读取 `html/`。
2. 优先复用现有目录、类型、组件、样式、工具和依赖，不为未提出的未来需求设计抽象。
3. 根据检查结果向用户提交 Plan，并等待明确确认。用户调整需求后，更新 Plan 并重新确认。
4. 确认后、实施前，将最终 Plan 保存到 `plans/YYYYMMDD/HHmmss-<topic>.md`。
5. 严格在确认范围内实施。

日期和时间使用 `Asia/Shanghai`，`topic` 使用小写 kebab-case。Plan 是已确认方案和历史记录，不是长期项目规范；已有历史 Plan 不因命名规则变化而批量重命名。

Plan 至少包含：

- 需求理解；
- 修改范围；
- 新增、修改和删除文件；
- 核心实现方式；
- 新增依赖及必要性；
- 验证方式。

## 范围与依赖控制

- 范围、受保护目录、依赖管理和冲突处理以根 `AGENTS.md` 为准。
- 保留工作区中用户已有的无关修改；无法安全绕开时，停止并说明。
- 如果实施中必须扩大范围、改变核心技术路线或新增依赖，停止相关实施，更新 Plan 并重新等待确认。
- 新增依赖前，检查当前依赖和平台能力是否能够合理完成需求；依赖变化时同时维护 `package.json` 与 lockfile。
- 不确定是否属于低风险小改时，按完整 Plan 处理。
