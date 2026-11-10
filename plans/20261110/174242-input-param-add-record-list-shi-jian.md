# 测试入参：多选改为添加记录列表

## 需求理解

测试入参 PROPERTY 多选改为「原表单草稿选择 → 添加 → 可删已选列表」；提交只读已添加记录。出参写回与关系 From/To 不变。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`
- 本 Plan

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除
- 不改 `buildApplicationTestRequestParams.ts`、类型契约

## 核心实现方式

1. 草稿沿用 `selectedRowKeys` / `selectedEntities` / `entitySlots`；已选新增按参数名的 binding records
2. UI：多选 + 非 main 草稿数据行 + 添加；下方可删已选列表；添加后清空草稿
3. 去重：同 entityPrimaryKey + dataPrimaryKey 不重复追加
4. 提交 multiple 入参读已选记录；single 出参不动
5. 关弹框 / 重载详情时清空已选与草稿

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
