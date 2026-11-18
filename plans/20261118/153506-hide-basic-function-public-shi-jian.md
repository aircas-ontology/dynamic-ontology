# 新建函数算子隐藏基础函数入口

## 需求理解

在「新建函数算子」中隐藏「基础函数」类型入口；相关业务实现代码保留，不删除。编辑已有基础函数不受影响。

## 修改范围

- `src/types/pages/ontologyFunctionOperatorType.ts`：公开开关与公开类型选项过滤
- `src/types/index.ts`：导出新常量
- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`：新建默认类型改为公开类型
- `tests/function-operator-workspace.test.mjs`：补充隐藏断言

## 新增、修改和删除文件

- 修改上述文件
- 新增 Plan 本文件
- 无删除业务实现代码
- 无新增依赖

## 核心实现方式

复用函数编排隐藏模式：新增 `FUNCTION_OPERATOR_BASIC_PUBLIC = false`，`FUNCTION_OPERATOR_PUBLIC_TYPE_OPTIONS` 过滤 `basic`（及已有 `composite`）。新建空草稿默认类型改为 `code`，避免打开后仍落在已隐藏类型。

## 新增依赖及必要性

无。

## 验证方式

- 更新并运行 `tests/function-operator-workspace.test.mjs`（含 `npm test`）
- `npm run check:types-conventions`
- `npm run format:check -- <任务文件列表>`
- `npm run type-check`、`npm run build:verify`（类型与应用代码变更）
