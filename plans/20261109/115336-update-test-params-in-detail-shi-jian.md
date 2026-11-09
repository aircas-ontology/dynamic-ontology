# 属性值修改：测试参数迁入实例数据弹框

## 需求理解

仅基础行为 · 属性值 · 修改：测试参数与「开始测试」迁入「查看实例数据」弹框；测试成功后刷新实例数据并清空参数编辑态。新增/删除流程不变。

## 修改范围

- `BehaviorTestDialog.vue`
- `BehaviorEntityRowDetailDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 仅修改上述文件

## 核心实现方式

外层 update 隐藏测试参数与开始测试；详情弹框展示参数表与开始测试；成功后清空 paramValues、reload 详情并刷新外层数据行列表。

## 新增依赖

无

## 验证方式

- 相关测试、format:check、type-check、build:verify
