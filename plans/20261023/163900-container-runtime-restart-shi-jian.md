# 容器运行配置对接重启

## 需求理解

对接 `POST /ontology/function/container/runtime/restart?containerKey=`；在运行配置展开区「启动」「停止」后增加「重启」；仅 `RUNNING` 可用。

## 修改范围

- 新增 restart 类型、Mock、契约测试
- 修改 `functionApi.ts`、apis/types barrel、`FunctionOperatorContainerRuntimePanel.vue`、list 面板测试

## 核心实现方式

照抄 start/stop：`postOntologyFunctionContainerRuntimeRestartInterface` → 成功刷新行 +「重启成功」提示。

## 新增依赖及必要性

无。

## 验证方式

相关测试、`format:check`、`type-check`、`build:verify`。
