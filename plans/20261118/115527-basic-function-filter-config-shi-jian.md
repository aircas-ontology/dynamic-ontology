# Plan：基础函数行为表单移植「参数配置」

## 需求理解

行为类型为「基础函数」时展示与新建函数算子相同的参数配置；占位符改为「输入属性名」。保存仍 defer。

## 修改范围

- `BasicFilterGroupEditor.vue` / `FunctionOperatorBasicFilterBuilder.vue`：透传 `propertyPlaceholder`
- `BehaviorFormDialog.vue`：基础函数下挂载参数配置
- `tests/ontology-space-behavior.test.mjs`（及必要时 filter 相关断言）

## 新增依赖

无

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `format:check` 任务文件
