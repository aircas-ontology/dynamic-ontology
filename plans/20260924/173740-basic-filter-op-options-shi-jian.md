# Plan：基础过滤比较运算符替换

确认范围（用户 2026-09-24「确认」）。

## 需求理解

按 `docs/20260924/shijian.md` §2，删除现有运算符枚举，完全改用标准表。

## 修改范围

| 操作 | 路径                                                         |
| ---- | ------------------------------------------------------------ |
| 修改 | `src/types/pages/ontologyFunctionOperatorBasicFilterType.ts` |
| 修改 | `src/utils/functionOperatorBasicFilter.ts`                   |
| 修改 | `BasicFilterGroupEditor.vue`                                 |
| 新增 | `tests/basic-filter-op-options.test.mjs`                     |

## 核心实现

- 下拉 label：`含义 枚举值`
- `BETWEEN` / `NOT_BETWEEN`：双值区间
- `IN` / `NOT_IN`：逗号拆分 `values`
- `IS_NULL` / `IS_NOT_NULL`：无需取值

## 新增依赖

无。

## 验证方式

相关单测、`format:check`
