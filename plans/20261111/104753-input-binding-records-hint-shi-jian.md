# 提示语归入已选列表

## 需求理解

提示移出草稿框，与已选记录放一起；无记录显示「当前未选择参数」，有记录显示「当前选择参数：N」。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`
- 本 Plan

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除

## 核心实现方式

按已添加绑定条数生成提示；提示与列表同属已选区域。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
