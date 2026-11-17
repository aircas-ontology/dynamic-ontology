# 规则画布操作区布局

- 需求及授权：用户确认保存按钮移至弹窗右上角、绿色实心；画布控制按钮顶部居中。
- 修改：src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleRuleConfigDialog.vue、ruleConfig/ScheduleRuleFlowToolbar.vue。
- 新增：本 Plan；无删除文件、无新增依赖。
- 实现：保存按钮从 footer 移至 header 右侧，使用 Element Plus type=success，并保留 readonly 隐藏及原保存事件；右侧留出关闭图标空间。footer 保留取消/关闭。工具栏四按钮在画布区域顶部居中，提示独占下一行；按钮窄屏换行。
- 边界：仅模板布局和局部 SCSS，不改变图实例、调度数据、保存/取消、清空确认或其他画布操作业务逻辑。不修改公共主题、public 或 html，保留所有工作区既有修改。
- 验证：纯布局样式改动免新增行为测试、全量单测和覆盖率；运行既有相关规则画布回归、type-check、build:verify、任务文件格式、diff 检查。无可用浏览器工具及 E2E 入口，实际暗亮、键盘焦点和窄屏溢出视觉待人工验收，不宣称浏览器检查通过。

## 验证结果

- 保存按钮仅移动位置，保留原事件及只读隐藏条件，使用 success 实心外观；工具栏居中、窄屏换行，提示文案保留。
- 既有 behavior-schedule-rule-canvas、behavior-schedule-rule-header-panels、schedule-rule-node-editing 共 25 项通过。
- 指定三文件 format:check、临时目录 build:verify 和 git diff --check 通过。
- type-check 未通过：仍有原有 14 项其他文件诊断；本次两组件无诊断。前置 vue-tsc 失败后 node 配置 tsc 未执行。
- 纯布局外观改动，免新增业务测试、全量单测及覆盖率。
- 无浏览器控制工具，暗亮、焦点及窄屏实际视觉未执行浏览器验证，人工验收待完成。
- 未修改第三方图实例、保存业务或其他工作区内容；无提交推送。
