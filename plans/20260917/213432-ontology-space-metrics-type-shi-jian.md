# Plan：抽取 OntologySpaceMetrics

确认范围（用户 2026-09-17「确认」）。

## 需求理解

将 `OntologySpaceItem.metrics` 内联对象类型抽成独立 `OntologySpaceMetrics`。

## 修改范围

- `src/types/pages/ontologySpaceManagementType.ts`
- `src/types/index.ts` 导出

## 新增依赖

无。

## 验证方式

`npm run check:types-conventions`、`npm run type-check`
