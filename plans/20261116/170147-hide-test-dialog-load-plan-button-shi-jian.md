# 测试弹框隐藏「读取执行要求」

## 需求理解

列表行为树测试弹框打开已自动读取执行要求，去掉工具栏「读取执行要求」按钮；编排页仍保留。

## 修改范围

- `BehaviorTreeExecPanel.vue`：`showLoadPlanButton` 默认 true
- `BehaviorTreeTestDialog.vue`：传 false，去掉 `@load-plan`
- 相关测试断言

## 新增、修改和删除文件

- 修改：上述文件与测试
- 无新增/删除

## 核心实现方式

共享面板用 prop 控制按钮显隐；自动加载逻辑不变。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测 + format:check
