# 测试入参：表单单选 + 多次添加

## 需求理解

入参 PROPERTY 表单内实例改为单选；通过「添加」累加可删记录实现多绑定。`inputParams` 仍为数组；出参写回不变。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`
- 本 Plan

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除

## 核心实现方式

1. 入参 PROPERTY 去掉 `multiple` / `collapse-tags`，绑定 `selectedRowKeys[0]`
2. 草稿选择最多保留 1 个实例；`selectionMode === "multiple"` 仍表示提交读已添加记录
3. 单测源码约束同步

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
