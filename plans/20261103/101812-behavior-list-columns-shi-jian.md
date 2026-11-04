# 行为列表列顺序调整

## 需求理解

表头改为：行为名称、行为类别、描述、函数算子、apiName、状态、更新时间；操作列固定右侧。

## 修改范围

- src/views/SpaceBehaviorWorkspace/components/BehaviorListPanel.vue
- tests/ontology-space-behavior.test.mjs

## 核心实现方式

重排列并新增函数算子（functionOperatorName）、apiName（behaviorApiName）；类别文案改为行为类别。

## 新增依赖

无

## 验证方式

相关单测 + format:check
