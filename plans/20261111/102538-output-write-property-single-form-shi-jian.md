# 写回出参只保留实例单选

## 需求理解

去除写回属性出参中非 main 数据行 /「请先选择上一级表单」表单；每行只选一个对象实例。入参非 main 数据行逻辑不变。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `src/views/SpaceBehaviorWorkspace/utils/collectApplicationPropertyOntologyPickers.ts`
- `tests/ontology-space-behavior.test.mjs`
- 本 Plan

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除

## 核心实现方式

1. 出参区移除 `findApplicationStorageGroupPickerForRow` 整块 UI
2. `collectApplicationStorageGroupPickers` 不再收录 WRITE_PROPERTY 出参
3. 出参组装只带 `entityPrimaryKey`，不要求 `dataPrimaryKeys`
4. 单测断言同步

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
