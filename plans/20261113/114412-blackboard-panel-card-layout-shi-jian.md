# 黑板/变量面板去横向滚动

## 需求理解

右侧「黑板 / 变量」多列表格导致横向滚动；改为可直观看全字段的竖向布局。

## 修改范围

- `BehaviorTreeBlackboardPanel.vue`：表格改为卡片表单
- `BehaviorTreeOrchestrationDialog.vue`：inspector 略加宽、`overflow-x: hidden`
- 测试负向/正向断言

## 核心实现方式

每行黑板键一张卡片：键名、类型+来源双列、按来源显示属性或取值、说明、删除。无横向滚动；行多时保留纵向滚动。

## 新增依赖及必要性

无。

## 验证方式

更新源码断言；format:check；behavior-tree-orchestration 测试。
