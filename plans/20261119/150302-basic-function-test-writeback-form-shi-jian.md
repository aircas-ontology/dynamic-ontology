# Plan: 基础函数测试表单对齐 writeBackEntityPrimaryKey（第一版）

## 需求理解

按 `testActionApi.md` §5.3.3：有 `writeBack` 时增加回写目标实例选择并传 `writeBackEntityPrimaryKey`；多对象改为按对象选择实例并传 `entityPrimaryKeys`。

## 修改范围

- `src/types/apis/testOntologyActionType.ts`
- `src/components/BehaviorTestDialog/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan

## 核心实现方式

1. 类型增加 `writeBackEntityPrimaryKey`；`entityPrimaryKeys` 支持对象 id → 主键映射。
2. 详情解析 `basicFunction.writeBack`；有回写时展示回写目标实例下拉（按 `targetOntologyIdentifier` 加载）。
3. 多对象：每个 ontologyIdentifier 一个实例下拉，提交组装 `entityPrimaryKeys`。
4. 提交校验：有回写必选回写实例；多对象须为每个对象选实例。

## 新增依赖及必要性

无

## 验证方式

相关测试；format:check；build:verify（类型/应用变更）。
