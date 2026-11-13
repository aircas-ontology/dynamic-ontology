# 容器节点面板配置子节点顺序

## 需求理解

节点顺序应对齐 `behavior-tree-editor/index.html`：在容器节点（COMPOSITE）的节点配置面板列出子节点并用 ↑/↓ 调序；去掉子节点面板上的「同级顺序」。

## 修改范围

- `src/views/BehaviorTreeOrchestration/components/BehaviorTreeNodeInspector.vue`

## 新增、修改和删除文件

- 修改：上述 1 个文件
- 新增 / 删除：无

## 核心实现方式

1. 删除选中子节点时的「同级顺序」上移/下移。
2. 选中 COMPOSITE 时展示子节点顺序列表（序号、名称、↑/↓），首尾按钮 disabled。
3. 无子节点或仅 1 个子节点时显示提示文案。

## 新增依赖及必要性

无。

## 验证方式

- 任务文件 `format:check`
- 编排相关测试通过
