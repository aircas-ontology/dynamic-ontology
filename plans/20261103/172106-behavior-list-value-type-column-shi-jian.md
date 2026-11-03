# Behavior list: replace operator column with kind

## 需求理解

行为列表去掉「函数算子」列，改为「类别」，展示 `actionKind` 映射后的 `kind` 中文标签（基础行为 / 应用行为 / 行为树）。

## 修改范围

- `BehaviorListPanel.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增依赖

无。

## 验证方式

相关测试与 `format:check`。
