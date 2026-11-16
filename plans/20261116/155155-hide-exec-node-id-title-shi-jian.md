# 节点标题去掉 nodeId 展示

## 需求理解

执行面板节点折叠标题中不再展示 `nodeId`（红框中的 code 文案）。

## 修改范围

- `src/components/BehaviorTreeExecPanel.vue`：去掉标题里的 `<code>{{ block.nodeId }}</code>`
- 必要时同步源码断言

## 新增、修改和删除文件

- 修改：上述文件及测试
- 无新增/删除

## 核心实现方式

仅移除标题展示；内部仍用 `block.nodeId` 作为 collapse key。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测 + format:check
