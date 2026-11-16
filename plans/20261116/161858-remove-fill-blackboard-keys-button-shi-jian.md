# 去掉补全黑板键辅助按钮

## 需求理解

行为入参与黑板无关，移除 ACTION 节点「补全 N 个黑板键」按钮及相关逻辑。

## 修改范围

- `BehaviorTreeNodeInspector.vue`：删按钮、`missingExternalKeys`、emit、`blackboard` prop
- `BehaviorTreeOrchestrationDialog.vue`：删事件绑定与 `handleAddExternalKeys` 及仅其使用的 import
- 测试增加否定断言

## 新增、修改和删除文件

- 修改：上述文件与测试
- 无新增/删除

## 核心实现方式

删除 UI 与补齐逻辑，不改黑板面板本身能力。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测 + format:check
