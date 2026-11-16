# 需求理解

修复规则配置弹窗内下拉菜单被遮挡的问题。选项内容已经存在，配置弹窗显式层级 5100，而 Element Plus 菜单默认基准 2000，需统一局部浮层层级。

# 修改范围

- 修改 ScheduleRuleFlowDesigner.vue：仅对节点配置弹窗提供局部 Element Plus ConfigProvider，菜单基准设为 5300，高于配置弹窗 5100 和内部变量选择弹窗 5200。
- 修改 tests/schedule-rule-node-editing.test.mjs：增加真实 Vue 渲染与 Element Plus 层级注入集成测试，验证内部菜单层级、重复分配与外部隔离。
- 新增本 Plan；不删除文件、不更改选项、数据模型、全局层级或其他页面。保留工作区全部已有修改。

# 实现与依赖

使用 Element Plus 公开 ConfigProvider zIndex 配置，避免逐个菜单覆盖和强制全局 CSS；传送到 body 的浮层仍继承 Vue 配置上下文。不新增依赖。

# 验证

先增加集成测试确认当前层级低于弹窗而失败，再最小修复确认通过。执行相关测试、npm test、test:coverage、type-check、build:verify、明确文件格式检查、git diff --check 和状态检查。当前未提供浏览器控制工具，无法执行真实页面点击、主题和视觉验收，明确保留验证缺口。

# 实施与验证结果

- 已为节点配置弹窗包裹局部 ElConfigProvider，zIndex 5300；显式导入组件，保留原有弹窗及全部选项。
- 集成测试使用真实 Vue 渲染和 Element Plus useZIndex：修改前菜单为 2003，因低于 5200 失败；修改后高于两层弹窗、重复分配递增，外部菜单保持原基准，测试通过。
- 相关测试 21/21 通过；本次三文件格式检查及 git diff --check 通过；build:verify 通过，输出到系统临时目录。
- npm test：994 项，961 通过、33 失败，沿用既有失败，未扩大修复范围。
- test:coverage 未通过：已加载文件行 92.38%、函数 88.47%、分支 77.38%，分支低于 80%，并非全项目源码覆盖率。
- type-check 未通过：既有 API、其他页面及调度创建参数等类型问题；本次修改的 ScheduleRuleFlowDesigner 无报错。
- 浏览器检查未执行：没有可调用浏览器工具；真实点击、焦点、主题及视觉人工验收尚待完成。
