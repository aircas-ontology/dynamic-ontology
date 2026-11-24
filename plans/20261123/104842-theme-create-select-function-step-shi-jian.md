# Plan: theme-create-select-function-step

## 需求理解

创建主题/子空间向导在「配置关系」后新增「选择函数」；`getOntologyFunctionListInterface`（types=EXTERNAL,CUSTOMIZE）分页多选；创建写入 `selectedFunctionApis`。本期不做选择行为。

## 修改范围

类型、mapSubspaceCreateRequest、index/workspace panel、SubspaceCreateFunctionPanel、引导步骤与测试。

## 新增依赖

无。

## 验证方式

TDD → 相关测试/覆盖率 → type-check、build:verify → format:check。
