# 基础算子测试实体改下拉

## 需求理解

去掉基础算子测试提示文案；实体选择改为只展示名称的下拉，footer 保留分页；属性值测试仍用表格。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`
- 本 Plan

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除

## 核心实现方式

1. `dialogHint` 对基础算子返回空，模板 `v-if="dialogHint"`
2. 基础算子独立 `el-select`（名称 + footer 分页）；跨页保留选中快照
3. 属性值仍用实体表格

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
