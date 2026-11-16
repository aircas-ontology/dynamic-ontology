# 节点标题优先展示 nodeDisplayName

## 需求理解

执行面板节点折叠标题左侧改为展示后端 `executeInputs.nodes[].nodeDisplayName`。

## 修改范围

- `BehaviorTreeExecuteNodePlan` 增加 `nodeDisplayName?: string`
- `execNodeBlocks.displayName` 优先取 `nodeDisplayName`，否则回退画布名 / `nodeId`
- 相关测试断言

## 新增、修改和删除文件

- 修改：类型、composable、测试
- 无新增/删除

## 核心实现方式

数据源切换；面板仍绑定 `block.displayName`。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测、`check:types-conventions`、format:check
