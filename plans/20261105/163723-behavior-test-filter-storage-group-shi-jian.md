# 编辑测试仅展示行为对应存储分组数据行

## 需求理解

属性值-编辑测试选择数据行时，仅展示与行为详情 `storageGroup` 一致的分组行。

## 修改范围

- 映射函数增加分组过滤
- 测试弹窗保存并使用详情 `storageGroup`
- 更新测试

## 新增、修改和删除文件

### 新增

- `plans/20261105/163723-behavior-test-filter-storage-group-shi-jian.md`

### 修改

- `src/views/SpaceBehaviorWorkspace/utils/mapOntologyEntityRowDetailToDataRows.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

### 删除

无

## 核心实现方式

1. `mapOntologyEntityRowDetailToDataRows(detail, storageGroup)` 用 `normalizeStorageGroup` 过滤。
2. 详情无存储分组时不展示可选行并提示。
3. 有分组无匹配行时显示空表。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <任务文件>`
