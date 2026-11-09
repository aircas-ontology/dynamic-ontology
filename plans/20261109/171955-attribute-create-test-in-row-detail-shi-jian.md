# 属性值新增：表单迁入查看实例数据

## 需求理解

基础行为-属性值新增：测试参数表单与「开始测试」不再出现在测试弹框主界面，改为与修改一致——选实体后进「查看实例数据」填写并测试。删除及其他类型行为不动。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorEntityRowDetailDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

仅修改上述文件；无新依赖、无删除。

## 核心实现方式

1. BehaviorEntityRowDetailDialog 新增 `enableCreateTest`；展示独立测试参数表与开始测试按钮。
2. BehaviorTestDialog 去掉主界面新增参数区与新增时主 footer 开始测试；传入 `enable-create-test`；更新提示与 submitError 展示。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 本次改动文件
- `npm run type-check`、`npm run build:verify`
