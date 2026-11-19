# Plan: 写入字段属性选项展示 storageGroup

## 需求理解

单对象与多对象基础函数「写入字段」属性下拉选项文案均追加 `storageGroup`。

## 修改范围

`BehaviorFormDialog.vue`、相关测试。

## 核心实现方式

- 单对象：`readBasicFunctionChildPropertyOptions` 映射 label 追加分组名。
- 多对象：`ensureBasicFunctionMainPropertyOptions` 构建 label 时追加分组名。

## 验证方式

相关测试；format:check。
