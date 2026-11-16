# 需求理解

参考 github-project 的规则画布，为条件分支和执行行为节点增加双击配置、取消及确认回写。

# 修改范围与实现

- 画布会话监听节点双击，通过节点 ID 读取和更新节点数据，保留位置和连线。
- 页面私有条件编辑组件支持组合条件、子条件及比较值编辑。
- 行为配置复用当前空间行为选项，保留实例和参数配置。
- 开始节点不编辑；关闭弹窗不修改节点，确认后更新摘要及规则文档。

# 文件

- 修改规则配置弹窗、调度表单、画布 Designer、GraphSession。
- 新增 ruleConfig 下节点编辑与条件编辑组件及配套测试。
- 不修改 public、html，不新增依赖。

# 验证

行为测试覆盖双击、取消、确认、未连线节点及卸载；执行 npm test、test:coverage、type-check、build:verify、格式和 diff 检查。浏览器检查受影响弹窗。

# 实施与验证记录

- 参考 github-project 的 node:dblclick、编辑副本与确认回写方式，按当前项目组件及类型边界适配；未直接引入参考项目的 API、样例数据或旧样式。
- 新增 ScheduleRuleConditionEditor.vue、ScheduleRuleValueEditor.vue 和 schedule-rule-node-editing.test.mjs。
- 规则画布相关 13 项测试通过，构建验证、任务文件格式检查与 git diff --check 通过。
- 全量 npm test：986 项中 953 通过、33 失败，包含已有助手、空间管理等断言及此前调度列表默认参数断言不匹配。
- test:coverage 失败：已加载文件行覆盖率 92.38%、分支 77.38%、函数 88.47%；分支低于 80%，并包含上述失败测试，不代表全项目覆盖率。
- type-check 失败：既有 agentChatApi、ApplicationManagement、SpaceBehaviorWorkspace 等错误及此前创建调度 spaceId 可选性问题；本次新增编辑组件和画布会话无类型报错。
- check:project-conventions 失败：已有历史 Plan 失效链接、public 格式排除和其他页面主题变量问题。
- 当前没有可调用的浏览器控制工具，未执行浏览器双击、暗亮主题和键盘交互验收；人工验收待执行。
