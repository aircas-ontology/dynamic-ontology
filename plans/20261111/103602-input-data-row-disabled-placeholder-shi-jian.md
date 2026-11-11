# 非 main 数据行占位改为禁用下拉

## 需求理解

入参未选上一级实例时，展示禁用的数据行选择框（placeholder「请先选择上一级表单」），不再只显示纯文案。选中实例后仍为可编辑数据行下拉。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`
- 本 Plan

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除

## 核心实现方式

空 `entitySlots` 时用 `el-select disabled` + placeholder 替代纯文本 span。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
