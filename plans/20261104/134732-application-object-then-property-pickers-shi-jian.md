# 应用行为对象属性两级选择

## 需求理解

入参「对象属性」与出参「写入对象属性」的红框表单改为先选当前空间对象、再选属性。本轮不组装 createAction。

## 修改范围

- BehaviorFormDialog.vue
- ontologySpaceBehaviorType.ts
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 修改：上述文件
- 新增/删除：无

## 核心实现方式

1. 复用 objectOptions
2. 两级下拉；切换对象清空属性；按对象 id 缓存属性选项
3. 绑定草稿增加 ontologyUniqueIdentifier
4. 属性 value 使用 uniqueIdentifier

## 新增依赖及必要性

无

## 验证方式

相关单测 + 任务文件 format:check
