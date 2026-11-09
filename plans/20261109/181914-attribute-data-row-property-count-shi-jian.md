# 属性数量列改为属性个数

## 需求理解

「选择数据行」属性数量列单元格改为展示该行 props 个数。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/utils/mapOntologyEntityRowDetailToDataRows.ts`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

仅修改上述文件；无新依赖、无删除。

## 核心实现方式

`buildPageDataRowPropertyCount` 返回 `String(props.length)`，写入 `propertySummary`。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 本次改动文件
