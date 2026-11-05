# 行为查看对接 GET /ontology/action

## 需求理解

查看抽屉按详情接口拉取并展示；摘要仅用接口有字段；子字段用 mappingIns.paramPath，不调 function/detail。

## 修改范围

- mapOntologyActionInfoToViewState
- BehaviorDetailDrawer、index.vue
- 类型 mappingIns 可选 category/outputMode
- 测试

## 新增依赖

无

## 验证方式

相关单测 + format:check
