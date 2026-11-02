# 运行配置改为二级页面

## 需求理解

「运行配置」改为函数算子红框内二级页展示；关闭改为「返回」。

## 修改范围

- 新增：`FunctionOperatorContainerRuntimePanel.vue`
- 删除：`FunctionOperatorContainerRuntimeDialog.vue`
- 修改：`FunctionOperatorPanel/index.vue`、相关测试

## 核心实现方式

`runtimePanelVisible` 切换列表与二级页；面板标题 + 返回 + 原表格与异步态。

## 新增依赖及必要性

无。

## 验证方式

契约/工作区测试、`format:check`、`type-check`；人工开关二级页。
