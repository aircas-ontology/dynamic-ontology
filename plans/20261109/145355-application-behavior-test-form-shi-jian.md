# 应用行为测试表单（不调测试接口）

## 需求理解

应用行为测试弹框打开后调用行为详情，展示 mappingIns 中 category=INPUT：EXTERNAL 可填、FIXED 只读 sourceConfig、PROPERTY 按 ontologyUniqueIdentifier 选实例。本期不调用测试接口。

## 修改范围

- BehaviorTestDialog.vue
- utils/collectApplicationPropertyOntologyPickers.ts（可选小工具）
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 新增 collect 工具；修改测试弹框与测试文件

## 核心实现方式

isApplicationTest=kind===application；属性值测试排除 application；详情 INPUT 表 + PROPERTY 去重实体选择；开始测试禁用。

## 新增依赖

无

## 验证方式

相关断言、format:check、行为测试、type-check、build:verify
