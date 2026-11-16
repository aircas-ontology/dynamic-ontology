# 去掉试跑结果，只留接口日志

## 需求理解

执行区不再展示「试跑结果」结构化区块；执行返回只通过「接口日志」查看。

## 修改范围

- `src/components/BehaviorTreeExecPanel.vue`：删除「试跑结果」区块及相关 props/helpers；保留 `testStatus` 供执行按钮 loading。
- `BehaviorTreeOrchestrationDialog.vue`、`BehaviorTreeTestDialog.vue`：停止传入 `test-error` / `test-result`。
- composable 仍维护执行状态与 toast，不扩大清理。

## 新增、修改和删除文件

- 修改：上述三个 Vue 文件
- 无新增/删除

## 核心实现方式

模板只保留「接口日志」；执行反馈靠按钮 loading、ElMessage、日志区。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测 + format:check 改动文件
