# 迁移行为树执行/日志（完整对齐原型）

## 需求理解

将原型「执行 / 日志」迁入编排弹框：读 executeInputs、黑板与 nodeExecutes、试跑 tree/test、结果与日志。

## 修改范围

- API/类型、ExecPanel、useBehaviorTreeExecution、Dialog、readme、测试

## 新增、修改和删除文件

- 新增：tree test 类型、exec utils、composable、ExecPanel
- 修改：behaviorTreeApi、getOntologyActionInfoType、orchestration 类型、Dialog、readme、测试、apis/index、types/index
- 无新依赖

## 核心实现方式

见已确认 Plan：类型 → API → composable → 面板 Tab → 测试验证。

## 新增依赖及必要性

无。

## 验证方式

format、types conventions、behavior-tree-orchestration 测试、type-check、build:verify。
