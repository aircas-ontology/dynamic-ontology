# 基础函数测试弹框展示对象名称

## 需求理解

测试弹框「选择各对象实体实例」「回写目标实例」标签当前用 UUID 截断。详情接口已返回 `basicFunction.ontologyNames` 与 `writeBack.targetOntologyName`，改为优先展示这些名称。

## 修改范围

- `src/types/apis/createOntologyActionType.ts`
- `src/components/BehaviorTestDialog/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改：上述三文件
- 无新增依赖

## 核心实现方式

1. 类型补充可选 `ontologyNames`、`targetOntologyName`（仅详情回显）
2. 加载详情时构建 identifier→name 映射
3. `formatBasicFunctionOntologyLabel` 优先显示名称，无名称回退 UUID 截断

## 新增依赖及必要性

无

## 验证方式

- 更新测试后实现；`ontology-space-behavior`、`format:check`、`check:types-conventions`、`type-check`、`build:verify`
