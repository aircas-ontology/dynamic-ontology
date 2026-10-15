# 详情面板按 category 分表展示入出参

## 需求理解

按 params.category 拆分 INPUT/OUTPUT，详情抽屉两表展示。

## 修改范围

mapOntologyFunctionDetail.ts、FunctionOperatorDetailDrawer.vue、get-ontology-function-detail-api.test.mjs

## 新增、修改和删除文件

- 修改：上述三个文件

## 核心实现方式

mapDetailParamsByCategory；抽屉始终两表；去掉基础函数隐藏输出表。

## 新增依赖及必要性

无。

## 验证方式

单测 + format:check。
