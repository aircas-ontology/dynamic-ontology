# 行为树创建表单字段

## 需求理解

类别选「行为树」时：删除「构建行为树」按钮；保留行为名称、api 名称、分类、描述；底栏「保存行为」改为「行为树编排」（占位，后续开发编排）。

## 修改范围

`BehaviorFormDialog.vue` 与相关单测。不接创建/编排接口。

## 新增、修改和删除文件

| 操作 | 路径                                                                 |
| ---- | -------------------------------------------------------------------- |
| 修改 | `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue` |
| 修改 | `tests/ontology-space-behavior.test.mjs`                             |

## 核心实现方式

统一基本信息字段；去掉 tree-panel；页脚行为树显示「行为树编排」并校验基础字段后占位提示。

## 新增依赖及必要性

无。

## 验证方式

相关单测、format、type-check、build:verify。
