# Plan: 单对象写入属性仅展示子表

## 需求理解

有展示字段时（单对象），写入字段属性下拉只可选非 main（子表）属性；不影响应用行为属性下拉与多对象仅 main 逻辑。

## 修改范围

`BehaviorFormDialog.vue` + 相关测试。

## 新增、修改和删除文件

- 修改：`src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- 修改：`tests/ontology-space-behavior.test.mjs`
- 新增本 Plan

## 核心实现方式

新增 `readBasicFunctionChildPropertyOptions`，按缓存 `storageGroup` 排除 main；写入字段下拉改用该函数；同步/加载后清空已选 main 属性。

## 新增依赖及必要性

无

## 验证方式

相关测试；format:check。
