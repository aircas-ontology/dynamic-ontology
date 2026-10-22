# 容器算子编辑仅可改描述（仅 UI）

## 需求理解

编辑容器算子时只能修改「函数说明」；其余字段与容器配置区隐藏/禁用。不改保存接口。

## 修改范围

- FunctionOperatorFormDialog.vue
- 相关契约测试

## 核心实现方式

- 调用协议编辑态 disabled
- 容器配置整段 `v-if="!operator"`

## 新增依赖及必要性

无。

## 验证方式

契约测试 + format:check
