# 属性值与修改值分列

## 需求理解

实例数据弹框中，属性值只读展示；修改值输入框单独一列放在属性值右侧。

## 修改范围

- BehaviorEntityRowDetailDialog.vue
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 仅修改上述文件

## 核心实现方式

属性值列始终只读；enableUpdateTest 时增加修改值列，可编辑参数渲染 el-input，否则显示 —。

## 新增依赖

无

## 验证方式

相关断言、format:check、行为测试、type-check、build:verify
