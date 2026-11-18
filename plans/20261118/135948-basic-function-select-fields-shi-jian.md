# Plan：基础函数单对象「展示字段」

## 需求理解

仅当基础函数且选择对象恰好 1 个时展示多选「展示字段」；调用属性分类树接口加载；value 为 apiName。

## 修改范围

- `BehaviorFormDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 核心实现方式

独立 options/loading/error/token；对象变更时重载；非单选时隐藏并清空。保存仍 defer。

## 新增依赖

无

## 验证方式

相关单测 + format:check
