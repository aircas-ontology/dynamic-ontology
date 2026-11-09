# 应用行为 PROPERTY 实例改为参数值列下拉

## 需求理解

PROPERTY 入参在「参数值」列用下拉选择实体，带分页；去掉底部独立实例表。

## 修改范围

- BehaviorTestDialog.vue
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 仅修改上述文件

## 核心实现方式

参数值列 el-select + footer 分页；同 ontologyUniqueIdentifier 共用选中；跨页保留选中项。

## 新增依赖

无

## 验证方式

相关断言、format、行为测试、build:verify
