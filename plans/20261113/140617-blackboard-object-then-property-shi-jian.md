# 黑板对象属性改为先选对象再选属性

## 需求理解

行为树编排「黑板 / 变量」在来源=对象属性时，改为先选对象、再选属性；对象接口不变。

## 修改范围

- `useBehaviorTreeOrchestration.ts`：暴露对象列表 `objectOptions`
- `BehaviorTreeBlackboardPanel.vue`：对象 + 属性两级下拉
- `BehaviorTreeOrchestrationDialog.vue`：接线
- 测试断言

## 核心实现方式

1. 打开编排仍调 `GET /ontology/category/tree` 得到对象列表，并继续按对象拉 `property/info` 缓存属性。
2. UI：先选对象；属性下拉仅展示该对象属性；切换对象清空已选属性。
3. 回显：由已绑 `bindPropertyUniqueIdentifier` 反查 `objectId` 预填对象。

## 新增依赖及必要性

无。

## 验证方式

更新源码断言；format:check；behavior-tree-orchestration 测试。
