# 行为调度规则配置：自定义变量 / 规则代码 / AI 生成规则

## 需求理解

在已有规则配置全屏画布上，按原型和截图补齐右上角三个入口：

1. **自定义变量**打开「自定义变量管理」弹窗：搜索、添加变量；左侧变量名称 / 编辑 / 删除；右侧当前变量的键名称、值类型标签、编辑 / 删除、添加键；页脚关闭。
2. **规则代码**打开右侧代码面板，标题为「规则代码」与「与左侧可视化双向同步」，带行号编辑器；按钮在「规则代码 / 收起代码」间切换。
3. **AI 生成规则**打开底部面板：三个预设 chips、描述输入（0/500）、上传 `.txt/.md/.json`、发送、同步到规则、收起。

本期不实现节点双击编辑器。数据走页面内 Mock，不接真实 LLM，不新增依赖（`monaco-editor` 已在 `package.json`）。单个 Vue 文件不超过 500 行。

## 修改范围

只动行为调度规则配置这条线；不改 `public/`、`html/`、`SubspaceCreateTreePanel.vue`。

## 新增、修改和删除文件

新增：

- `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/CustomRuleVariableDialog.vue`
- `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/ruleConfig/CustomRuleVariableEditors.vue`
- `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/ruleConfig/ScheduleRuleFlowCodeEditor.vue`
- `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/ruleConfig/ScheduleRuleAiChatPanel.vue`
- `src/views/OntologySpaceManagementDetail/utils/scheduleRuleFlowText.ts`
- `src/views/OntologySpaceManagementDetail/utils/scheduleRuleVariableCatalog.ts`
- `src/views/OntologySpaceManagementDetail/utils/scheduleRuleAiGenerate.ts`
- `tests/behavior-schedule-rule-header-panels.test.mjs`
- 本 Plan 文件

修改：

- `src/views/OntologySpaceManagementDetail/behaviorScheduleComponents/BehaviorScheduleRuleConfigDialog.vue`
- `src/types/pages/ontologySpaceBehaviorScheduleType.ts`
- `src/types/index.ts`
- `tests/behavior-schedule-rule-canvas.test.mjs`

不删除文件。不新增 npm 依赖。

## 核心实现方式

- 变量目录为页面会话内存 Mock，初始样例与截图一致（全局任务上下文 / 系统运行参数 / 环境阈值及其键）。搜索过滤名称和键；删除二次确认。值类型：字符串、数值、布尔、对象。
- 规则代码使用已有 `monaco-editor`，动态导入避免列表页预加载；画布文档与受限 DSL 双向同步；解析失败提示且不覆盖画布；保存时若代码有错先拦截。Monaco 实例非响应式，卸载 `dispose`。
- AI 面板本地 Mock 生成可解析规则文本；「同步到规则」写回画布和代码；卸载取消进行中的生成。
- 自定义变量弹窗 `z-index` 高于规则配置全屏弹窗（5000）。按钮与表格使用 `aircas-button` / `aircas-table` / `aircas-tag` 及主题色变量。

## 新增依赖及必要性

无。复用现有 `monaco-editor`。

## 验证方式

- TDD：先写源码契约与工具行为测试，确认失败后再实现。
- `npm test`、`npm run test:coverage`
- `npm run type-check`、`npm run check:types-conventions`、`npm run build:verify`
- `npm run format:check -- <任务文件>`
