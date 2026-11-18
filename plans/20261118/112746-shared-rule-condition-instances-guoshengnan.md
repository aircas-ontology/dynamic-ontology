# 规则条件共享实例配置

- 需求理解：条件变量选择仅定义对象与字段；双击行为后，上半部编辑执行路径中共享的条件实例及子表数据行，下半部配置独立行为参数。
- 共享范围：绑定仍归属原条件变量；同条件的所有下游行为同步，外层条件影响全部引用它的行为，内层条件仅影响对应路径。取消不写回。
- 修改文件：规则变量选择器、值编辑器、画布编辑器与图会话；必要时调整现有相关测试。
- 新增文件：页面私有条件实例面板、实例选择行组件、路径条件提取工具及 tests/*.test.mjs 行为测试。
- 删除文件：无。新增依赖：无。公共类型与接口格式优先保持不变。
- 核心实现：沿图入边逐路径提取条件和 Switch 出口；递归展示 AND/OR 分组、左右变量和来源层级；草稿按源节点共享，确认时批量写回原条件及行为。复用现有查询控制器处理加载、空、错误、重复查询、过期响应和卸载失效。
- 保存兼容：沿用条件变量的 instanceIds、storageGroup、dataPrimaryKey；继续按现有 judgeRules 和 flowDocument 协议保存与恢复，不新增接口字段。
- 验证：TDD 验证多层路径、多对象、左右变量、Switch/default、汇流、共享同步、取消、查询状态及现有格式保存。运行 npm test、npm run test:coverage、npm run type-check、npm run build:verify、npm run check:project-conventions 和限定文件格式检查；浏览器冒烟仅限相关弹窗、主题及回显；人工最终验收另行报告。
- 边界：保留已有 datasource 测试及历史 Plan 修改；不读取 html/，不修改 public/，不使用 Subagent。

## 实施记录

- 新增：`src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleConditionInstances.vue`、`ScheduleRuleConditionInstanceRow.vue`、`src/views/SpaceBehaviorScheduleWorkspace/utils/ruleConditionInstanceBindings.ts`、`tests/rule-condition-instance-bindings.test.mjs`。
- 修改：同页面的 `ScheduleRuleFlowDesigner.vue`、`ScheduleRuleVariablePicker.vue`、`ScheduleRuleValueEditor.vue`、`scheduleRuleFlowGraphSession.ts`；相关 `schedule-rule-variable-picker.test.mjs`、`schedule-rule-node-editing.test.mjs`。
- 未修改公共类型或接口转换器。实例仍保存在原条件中；保存格式通过现有转换器集成测试验证。
- 多路径共享条件在上方逐路径展示，编辑区按源条件去重，避免同一共享字段出现多个不同步的表单。条件内部保留层级编号、AND/OR 关系、左右操作数及完整摘要。

## 验证记录

- TDD：新增路径提取测试首次因实现模块不存在而失败；实现后通过，随后补充真实图会话写回、共享影响范围、现有请求格式及面板验证测试。
- 相关七个测试文件：74 项全部通过。
- `npm test`：1169 项中 1123 项通过、46 项失败；失败集中在未修改的 AI、数据源、空间、登录、样式及既有规范测试，不在当前范围内修复。完整输出位于系统临时目录 `codex-rule-test.log`。
- `npm run test:coverage`：失败；已加载文件行覆盖率 93.38%、函数 90.31%、分支 78.77%，分支未达到 80%。此统计不代表全项目源码覆盖率。新增路径工具行 / 分支 / 函数为 100% / 85.25% / 100%。完整输出位于系统临时目录 `codex-rule-coverage.log`。
- `npm run type-check`：失败，14 条错误均位于本次未修改文件；本次修改文件没有类型报错。输出位于系统临时目录 `codex-rule-types.log`。
- `npm run build:verify`：沙箱内受 AppData 权限阻止；获准在沙箱外重跑后通过，产物只写系统临时目录。输出位于系统临时目录 `codex-rule-build.log`。
- `npm run check:project-conventions`：失败，历史文档失效链接、既有 public 格式排除配置及其他组件未定义主题变量等问题；没有本次新增文件的规范错误。
- 限定文件 `format:check` 通过；`git diff --check` 通过。
- 浏览器验证未执行：当前未提供浏览器控制所需执行工具，不能验证暗亮主题、焦点、滚动、运行时 Console 或实际页面交互。没有现有 E2E script。
- 人工验收未进行；全量自动化检查尚未全部通过，不宣称项目验证完成。

## 截图反馈修正

- 用户反馈实例卡片显示问题，本次继续修正已确认方案内的展示缺陷：移除内部 ID 和存储分组编码的直接展示，错误区使用简短提示并保留详情与重试；卡片最多两列，窄屏单列；每次打开节点弹窗重置内容滚动位置。
- 范围仅限既有三个弹窗私有组件、节点编辑器及相关测试。不修改接口、共享实例语义或服务端配置，不将服务端依赖报错掩盖为加载成功。
- 先增加真实组件渲染回归测试，确认旧实现因内部 ID、编码及完整错误撑开卡片而失败，再修正展示。沿用前述验证入口；浏览器工具仍不可用，视觉效果需人工验收。
- 修正验证：相关三个测试文件 33 项通过；完整测试 1171 项，1125 通过、46 失败。类型检查仍为其他文件的 14 条错误；规范检查仍受历史问题阻断。正式覆盖率统计的已加载文件行 / 分支 / 函数为 93.38% / 78.80% / 90.31%，分支未达 80%。`build:verify`、限定文件格式检查和 `git diff --check` 通过。对应完整日志保存为系统临时目录下的 `codex-rule-display-*.log`。

## 紧凑列表样式调整

- 按用户第二张参考图，将原实例卡片改为无外框的单列条目：对象与字段、条件位置同行，下一行并排显示带明确标签的实例和数据行选择器；窄屏自然换行，保留完整错误、空状态、只读展示及重试入口。
- 仅修改 `ScheduleRuleConditionInstanceRow.vue` 和 `ScheduleRuleConditionInstances.vue` 的模板及 scoped SCSS，不修改任何查询、共享绑定、校验或保存逻辑，不新增依赖。
- 属于原方案内的展示调整，按用户明确指定的参考样式继续实施。验证限定格式、相关组件回归、类型检查、临时目录构建及项目规范；业务逻辑没有变化，按根规范免除全量单测、覆盖率和 E2E 重跑。浏览器工具不可用，暗亮主题和实际视觉布局待人工验收。
- 本轮结果：相关两份测试文件 20 项通过，`build:verify`、限定格式和 `git diff --check` 通过；类型检查仍报告其他文件的 14 条既有错误，两个样式组件无新增报错。项目规范命令本轮返回退出码 0（日志仅包含命令启动信息）；未执行浏览器或人工视觉验收。日志位于系统临时目录的 `codex-rule-compact-*.log`。
