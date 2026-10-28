# Plan：修复创建行为弹窗选择函数算子后不查询详情（DataCloneError）

- 时间：2026-10-19 17:33（Asia/Shanghai）
- git-user：guoshengnan
- 状态：已经用户确认修复

## 需求理解

创建行为弹窗（`SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`）选择"关联基础函数算子"后未查询算子详情，输入/输出参数区始终显示"该算子无参数"。定位根因并修复。

## 根因（已实测定位）

1. 算子目录 `operatorCatalog` 存于 `ref`，目录项为 Vue 深层响应式 Proxy；
2. 选择算子时 `handleOperatorChange` 先调用 `applySelectedOperator`（try 块之外）；
3. 其中 `structuredClone(operator.inputParameters)` 无法克隆 Proxy → 抛出 `DataCloneError: Failed to execute 'structuredClone' on 'Window'`；
4. 异常在详情请求发出前中断流程，`getOntologyFunctionDetailInterface`（第 279 行）永不执行。

已排除：后端详情接口正常（实测空间 46"测试-rwl"的 平均函数 `avg@1.0.0` 返回 200 及 2 个 INPUT 参数）、Mock 路由与类型契约一致、页面绑定与请求代码正确。浏览器实测复现 Console 报错与无请求现象。

## 修改范围

### 修改

1. `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
   - `applySelectedOperator` 中 2 处 `structuredClone(operator.inputParameters / operator.outputParameters)` 改为项目自有工具 `cloneSpaceBehaviorParameters`（同文件已导入，编辑模式回填已使用，对 Proxy 安全）。
2. `tests/ontology-space-behavior.test.mjs`
   - 新增测试：断言 `applySelectedOperator` 使用 `cloneSpaceBehaviorParameters` 克隆列表参数，且弹窗源码不再使用 `structuredClone(`。

## 新增依赖

无。

## 验证方式

1. TDD：先加测试确认失败，再修复至通过（`node --test tests/ontology-space-behavior.test.mjs`）。
2. `npm run type-check`、`npm run build:verify`（应用代码变更）。
3. `npm run format:check -- src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue tests/ontology-space-behavior.test.mjs`。
4. 浏览器回归：创建行为弹窗选择"平均函数 · 1.0.0"，确认发出 `/ontology/function/detail?functionApi=avg&version=1.0.0` 请求、Console 无 DataCloneError、输入参数显示 2 行（tt、sss）。
