# 对齐 executeInputs.nodes 新格式

## 需求理解

「读取执行要求」的 `GET /ontology/action` 返回 `executeInputs` 改为按节点的 `nodes[]` + `blackboardInstances`；参考 `behavior-tree-editor/index.html` 解析与填参口径更新 Vue 侧。

## 修改范围

- 类型：`getOntologyActionInfoType.ts`、`types/index.ts`
- 工具：`behaviorTreeExecutePlan.ts`
- UI/状态：`useBehaviorTreeExecution.ts`、`BehaviorTreeExecPanel.vue`
- 测试：`tests/behavior-tree-orchestration.test.mjs`
- readme 一句说明

## 新增、修改和删除文件

- 修改上述文件；无新增依赖

## 核心实现方式

1. 类型增加 `nodes`、`blackboardInstances`、入参 `sourceType` 等
2. utils 按 `plan.nodes` 收集节点/对象、缺参（仅 EXTERNAL）、组装 payload（EXTERNAL→params，PROPERTY 等→inputParams）
3. 面板按 sourceType 渲染；黑板实例优先 `blackboardInstances`

## 新增依赖及必要性

无。

## 验证方式

更新 payload/缺参测试；`format:check`；相关测试通过。
