# 草稿区添加选择状态提示

## 需求理解

在「添加」按钮下方、已选列表上方显示：草稿已选齐为「当前选择参数」，否则「当前未选择参数」。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`
- 本 Plan

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除

## 核心实现方式

根据草稿实例（及非 main 数据行）是否选齐切换提示文案。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
