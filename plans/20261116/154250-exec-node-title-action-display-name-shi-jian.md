# 节点列表标题展示 actionDisplayName

## 需求理解

执行面板节点折叠标题旁的行为标识由 `actionApi` 改为 `actionDisplayName`（有值才显示），与参考编辑器一致。

## 修改范围

- `src/components/BehaviorTreeExecPanel.vue`
- 必要时更新面板源码断言测试

## 新增、修改和删除文件

- 修改：上述文件
- 无新增/删除

## 核心实现方式

标题 muted 文案绑定 `block.actionDisplayName`。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测 + format:check
