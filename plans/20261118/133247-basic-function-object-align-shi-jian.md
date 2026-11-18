# Plan：对齐「行为类型 / 选择对象」

## 需求理解

红框内「行为类型」与「选择对象」输入框顶边对齐。

## 修改范围

仅 `BehaviorFormDialog.vue` 样式。

## 核心实现方式

1. 网格 `align-items: start`
2. 多选 tree-select wrapper 与主题控件高度一致，默认垂直居中；保留 max-height 与换行滚动

## 新增依赖

无

## 验证方式

`format:check` 该文件；人工确认两列顶边对齐
