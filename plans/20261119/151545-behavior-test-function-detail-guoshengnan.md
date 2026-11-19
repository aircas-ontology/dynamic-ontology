# 需求理解

- 行为测试弹窗左栏「挂载函数」调用函数详情接口，展示协议（无则不显）、更新时间（无则不显）、函数 API。
- 增加「详情」text 按钮，打开与函数算子详情一致的只读抽屉（方案 A：公共组件抽取）。
- 「算子 API」复用同一函数详情数据展示；详情抽屉只读，无编辑/发布/删除/测试操作。

# 修改范围

- 将 `FunctionOperatorDetailDrawer`（及参数树依赖）提升到 `src/components/`
- `BehaviorTestDialog` 拉 versions/detail 并展示摘要 + 打开只读详情
- `FunctionOperatorPanel` 改为引用公共抽屉
- 相关测试

# 新增、修改和删除文件

## 新增

- `src/components/FunctionOperatorDetailDrawer/FunctionOperatorDetailDrawer.vue`
- `src/components/FunctionOperatorDetailDrawer/FunctionOperatorScriptParamTree.vue`
- `src/utils/mapOperatorParametersToScriptParamTree.ts`（自 views 上移）
- `plans/20261119/151545-behavior-test-function-detail-guoshengnan.md`

## 修改

- `src/components/BehaviorTestDialog/BehaviorTestDialog.vue`
- `src/components/register.ts`
- `src/views/FunctionOperatorPanel/index.vue`
- `tests/ontology-space-behavior.test.mjs`
- 页面内原抽屉/参数树改为再导出或删除后改引用

## 删除

- `src/views/FunctionOperatorPanel/components/FunctionOperatorDetailDrawer.vue`（迁出后）
- `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptParamTree.vue`（迁出后）
- `src/views/FunctionOperatorPanel/utils/mapOperatorParametersToScriptParamTree.ts`（迁出后）

# 核心实现方式

1. 公共抽屉增加 `readonly`：为 true 时隐藏全部操作按钮；面板继续用原 `browseOnly` 语义。
2. 行为详情含 `functionApi` 时解析 version（优先 `behavior.functionOperatorVersion`，否则 versions 取最新）并请求 detail，用 `mapOntologyFunctionDetailToOperator`。
3. 挂载函数行：协议 / 更新时间 / 函数 API 条件展示 +「详情」按钮；算子 API 展示 api 与描述。
4. 点击详情打开只读抽屉，支持切版本；关闭测试弹窗时清理请求与抽屉状态。

# 新增依赖及必要性

- 无

# 验证方式

- TDD 更新 `tests/ontology-space-behavior.test.mjs`
- `node --test tests/ontology-space-behavior.test.mjs`
- 任务文件 format:check；`npm run type-check`、`npm run build:verify`
- 浏览器冒烟：摘要条件字段与只读详情抽屉
