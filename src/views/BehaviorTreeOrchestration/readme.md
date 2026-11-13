# BehaviorTreeOrchestration

行为树编排全屏弹框（从创建/编辑行为树入口打开）。

## 能力

- 自动拉取 `GET /ontology/action/tree/node-defs`
- 编辑态自动 `GET /ontology/action` 加载 `treeDefinition`
- 左侧节点/可绑定行为面板、X6 画布、右侧节点配置/黑板
- 黑板键支持三种来源：固定值 / 外部输入 / 对象属性；黑板可为空
- 创建 `POST /ontology/action`（`actionKind: TREE`）；成功后切「更新」并 `PUT`，停留编排页继续改

## 不包含

- 发布/下线、执行日志、节点说明、登录鉴权与元数据表单（由创建/编辑行为弹框提供）
- 执行页 inputs / nodeExecutes 调试（仅原型 HTML 演示）
