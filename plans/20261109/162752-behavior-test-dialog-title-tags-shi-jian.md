# 测试弹框标题展示行为类别与基础操作标签

## 需求理解

行为测试弹框标题旁用标签展示行为类别、基础操作。

## 修改范围

- BehaviorTestDialog.vue
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 仅修改上述文件

## 核心实现方式

el-dialog #header：标题 + 行为类别 / 基础操作 el-tag；标签文案与列表一致。

## 新增依赖

无

## 验证方式

源码断言、format、行为测试
