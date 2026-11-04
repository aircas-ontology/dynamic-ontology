# 对象类型参数隐藏配置表单

## 需求理解

应用行为入/出参表中，参数类型为「对象」的父行不展示输入来源/读取属性（或输出方式/写入目标）表单；仅子属性行保留这些控件。参数名、类型、配置状态列仍展示。

## 修改范围

- `BehaviorFormDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改：上述 2 个
- 新增/删除：无

## 核心实现方式

对象行两列 `#default` 内 `v-if="!row.isObject"` 再渲染 `el-select`；配置状态列保持现状。

## 新增依赖及必要性

无

## 验证方式

相关单测 + 任务文件 `format:check`
