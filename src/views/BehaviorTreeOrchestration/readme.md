# BehaviorTreeOrchestration

行为树编排全屏弹框（从创建/编辑行为树入口打开）。

## 能力

- 自动拉取 `GET /ontology/action/tree/node-defs`
- 编辑态自动 `GET /ontology/action` 加载 `treeDefinition`
- 左侧节点/可绑定行为面板、X6 画布、右侧节点配置 / 黑板 / 执行日志
- 黑板键支持三种来源：固定值 / 外部输入 / 对象属性；PROPERTY 保存含 `bindObjectIdentifier`；黑板可为空
- ACTION 节点可配置入参取值（默认 / 黑板 / 上游出参）、出参回传黑板，以及可选的执行成功条件 `successCondition`（`outputKey` / `op` / `value`）
- 创建 `POST /ontology/action`（`actionKind: TREE`）；成功后切「更新」并 `PUT`，停留编排页继续改
- 「执行 / 日志」：读取 `executeInputs.nodes`（入参带 `sourceType`）与 `blackboardInstances`（含非主分组 `storageGroups`）、填写黑板实例/分组行与 `nodeExecutes`、试跑 `POST /ontology/action/tree/test`（含 `inputDataPrimaryKeys`）、展示结果与本面板接口日志
- 执行面板与 `useBehaviorTreeExecution` / `behaviorTreeExecutePlan` 已下沉到公共目录；行为列表「测试」复用同一套能力，打开时自动读取执行要求

## 不包含

- 发布/下线、节点说明、登录鉴权与元数据表单（由创建/编辑行为弹框提供）
