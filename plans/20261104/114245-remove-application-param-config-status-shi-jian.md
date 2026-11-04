# 去除应用行为入出参配置状态列

## 需求理解

应用行为入参表、出参表去掉「配置状态」列。

## 修改范围

- BehaviorFormDialog.vue
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 修改：上述 2 个
- 新增/删除：无

## 核心实现方式

删除两表中 `label="配置状态"` 的列；更新测试断言。

## 新增依赖及必要性

无

## 验证方式

相关单测 + 任务文件 format:check
