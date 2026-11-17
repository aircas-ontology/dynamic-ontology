# 行为调度按类型加载参数组件

## 需求理解

行为调度创建、编辑、查看中，应用行为用 `BehaviorParameterConfig`，行为树用可嵌入的 `BehaviorTreeExecPanel`（不含测试弹窗）。按行为 `actionKind` 切换；调度只配置并保存，不执行。

## 修改范围

- 行为选项保留 `kind`
- `BehaviorTreeExecPanel` 支持隐藏执行与日志
- 周期表单与规则节点编辑按类型切换参数区
- 创建参数接受应用执行请求或行为树试跑请求作为 `entityJson`

## 新增、修改和删除文件

新增：`useScheduleTreeParameters.ts`、树参数恢复工具、相关单测、本 Plan。

修改：`ScheduleBehaviorOption`、`fetchScheduleBehaviorOptions`、`BehaviorTreeExecPanel`、`BehaviorScheduleFormDialog`、`useRuleActionParameters`、`ScheduleRuleFlowDesigner`、创建参数组装与规则校验。

无删除，无新依赖。不改用户已有无关工作区改动。

## 核心实现方式

1. 列表映射 `APPLICATION`→`application`，`TREE`→`behaviorTree`。
2. 应用行为沿用现有参数组件与快照。
3. 行为树嵌入 `BehaviorTreeExecPanel`，关闭执行按钮和日志；确认时用 `buildBehaviorTreeTestPayload` 写入请求，回显时回填草稿。
4. 规则保存校验同时接受 `actionApi` 与 `treeApi`。

## 新增依赖及必要性

无。

## 验证方式

相关单测、`format:check`；应用代码变更后 `type-check`、`build:verify`。
