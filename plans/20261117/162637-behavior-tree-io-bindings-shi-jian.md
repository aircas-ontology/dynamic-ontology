# 同步行为树入参/出参绑定与黑板 bindObjectIdentifier

## 需求理解

1. ACTION 节点展示并可配置入参取值来源、出参回传黑板；保存序列化为 inputBindings / outputBindings。
2. PROPERTY 黑板项保存增加 bindObjectIdentifier，加载与校验对齐。

## 修改范围

- 类型、序列化/导入、校验、节点 Inspector、黑板面板、Mock、测试、readme

## 新增、修改和删除文件

- 新增：`behaviorTreeActionBindings.ts`（绑定草稿、上游节点、序列化辅助）
- 修改：orchestration 类型与 node-defs 类型、definition/model/validate/blackboard、NodeInspector、BlackboardPanel、dialog/composable、fixture、tests、readme

## 核心实现方式

对齐 index.html：入参默认/黑板/上游出参；出参回传 EXTERNAL 或同属性 PROPERTY 键；换绑行为清空绑定；黑板 PROPERTY 落 bindObjectIdentifier。

## 新增依赖及必要性

无。

## 验证方式

相关单测（TDD）、`npm test` 相关文件、`test:coverage`、`type-check`、`build:verify`、`format:check`、`check:types-conventions`。
