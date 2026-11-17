# 区分实例行为卡片标签与按钮

- 需求及授权：用户已确认将类型标签改为中性灰浅底，执行按钮改为主题主色实心。
- 修改范围：仅 src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityBehaviors.vue 的两处 Element Plus 官方外观 Props。
- 新增：本 Plan。无删除文件，无新增依赖，无公共样式或主题变量变更。
- 实现：标签 type=info、effect=light；执行按钮保留 primary 和 small，移除 plain。保留原文案、布局、描述及点击事件。
- 验证：纯样式变更免新增单元测试、全量测试、覆盖率和 E2E；执行现有相关回归测试、type-check、build:verify、明确文件格式与 diff 检查。沿用 Element Plus 暗亮主题及默认 hover/active/disabled/focus 状态；无浏览器控制工具，实际视觉及焦点、溢出人工验收待完成，不以静态检查冒充浏览器验证。
- 保留其他任务及用户修改；不修改 public，不访问 html，不提交推送。

## 验证记录

- 本次仅改标签 type/effect 与执行按钮 plain 属性，复用现有主题样式，无布局及事件修改。
- 现有 object-profile-entity-detail-view 与 behavior-execution-prefill 共 18 项通过。
- 指定文件格式检查、build:verify、git diff --check 通过。
- type-check 未通过：当前工作区 15 项诊断，14 项此前基线，另含并行调度工作 restoreRuleFlowDocument.ts 的 RuleValueNode 类型问题；本次卡片无类型诊断。前置 vue-tsc 失败后 node 配置 tsc 未执行。未扩大范围修改。
- 纯样式变更，按项目规则免新增单元测试、全量单测、覆盖率及 E2E。
- 浏览器未执行：无可用控制工具；暗亮主题、hover/active/disabled/focus、溢出及视觉效果仅确认继承现有 Element Plus 官方能力，实际运行效果及人工验收待完成。
- 已保留其他工作区改动，无自动提交推送。
