# 执行/日志：黑板对象属性「实例 + 分组行」同步

## 需求理解

对照 `behavior-tree-editor/index.html`：黑板 PROPERTY 键先选对象实例；若 `executeInputs.blackboardInstances[].storageGroups` 标明键落在非主分组，再选该分组行；试跑请求额外携带 `inputDataPrimaryKeys`（对象标识 → 分组 → 行主键）。

## 修改范围

- 类型：`BehaviorTreeExecuteBlackboardInstance` 增加 `storageGroups`；试跑请求增加 `inputDataPrimaryKeys`
- 解析/校验/组装：`src/utils/behaviorTreeExecutePlan.ts`
- 执行态与拉行：`src/composables/behaviorTree/useBehaviorTreeExecution.ts`
- UI：`src/components/BehaviorTreeExecPanel.vue`，以及 Dialog / TestDialog 事件接线
- 测试：`tests/behavior-tree-orchestration.test.mjs`
- 文档：`src/views/BehaviorTreeOrchestration/readme.md` 补充一句执行面板能力说明

## 新增、修改和删除文件

- 修改：上述类型、工具、composable、ExecPanel、接线文件、测试、readme
- 新增：本 Plan 文件
- 删除：无

## 核心实现方式

1. 平铺 `blackboardInstances` 时保留 `storageGroups`
2. 缺失校验：有分组时实例与行均必填（对齐 index.html）
3. payload 组装 `inputDataPrimaryKeys`；换实例清空该对象下分组行选择
4. 选中实例后 `POST /ontology/entity/row_detail/page` 拉分组行候选
5. ExecPanel 在对象属性实例下增加分组行下拉

## 新增依赖及必要性

无；复用已有 `postGetOntologyEntityRowDetailPageInterface`。

## 验证方式

- 相关单测（含 storageGroups 校验与 payload）
- `npm run format:check -- <任务文件>`
- `npm run type-check`、`npm run build:verify`（触及应用代码）
