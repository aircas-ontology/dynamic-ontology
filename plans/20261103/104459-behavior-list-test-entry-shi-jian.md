# 行为列表测试入口

## 需求理解

操作列增加【测试】按钮；本轮仅入口占位，点击提示后续接入。

## 修改范围

- BehaviorListPanel.vue
- SpaceBehaviorWorkspace/index.vue
- tests/ontology-space-behavior.test.mjs

## 核心实现方式

emit test 事件；页面 ElMessage.info 提示。

## 新增依赖

无

## 验证方式

相关单测 + format:check
