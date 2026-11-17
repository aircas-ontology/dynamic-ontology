# 修复黑板 PROPERTY 属性回显

## 需求理解

编辑行为树时，PROPERTY 黑板键的「属性」应显示名称，而非 uuid（目录中无）。

## 修改范围

- 详情导入后按黑板 PROPERTY 对象预拉属性
- 黑板面板同步对象选择时若目录未就绪则请求属性

## 新增、修改和删除文件

- 修改：`behaviorTreeBlackboard.ts`、`useBehaviorTreeOrchestration.ts`、`BehaviorTreeBlackboardPanel.vue`、测试

## 核心实现方式

收集 `bindObjectIdentifier`（及属性目录回退），`Promise.all` 调用已有 `ensureBehaviorTreeObjectProperties`；面板 watch 补请求。

## 新增依赖及必要性

无。

## 验证方式

相关单测、`format:check`。
