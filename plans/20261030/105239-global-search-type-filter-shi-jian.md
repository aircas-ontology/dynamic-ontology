# 全局检索增加类型筛选

## 需求理解

按 docs/20260923/globalSearchApi-shijian.md：请求增加可选 searchType（1=空间含主题、2=对象、3=关系、4=属性、5=实例；不传则五类全查）。Header 顶部搜索与全文检索页共用 OntologyGlobalSearchField，两处界面与请求一并支持该条件。

## 修改范围

- 类型与请求契约、全局检索 composable、公共搜索组件、相关测试
- 无新依赖；不改 public/、html/；不改用户已改动的 docs 文件

## 新增、修改和删除文件

- 修改：ontologyGlobalSearchType.ts、types/index.ts、ontologySearchApi.ts、useOntologyGlobalSearch.ts、OntologyGlobalSearchField.vue、ontology-global-search.test.mjs
- 新增：本 Plan 文件
- 无删除

## 核心实现方式

1. 类型增加 OntologyGlobalSearchTypeCode 与 ONTOLOGY_GLOBAL_SEARCH_TYPE_OPTIONS（全部用 null，请求时省略）
2. composable 持有 searchType，请求条件展开，clear 重置
3. OntologyGlobalSearchField 左侧 el-select；类型变更且有关键词时重查

## 新增依赖及必要性

无。

## 验证方式

- npm test（ontology-global-search / full-text-search）
- npm run test:coverage
- npm run type-check、build:verify、check:types-conventions
- npm run format:check -- 本次修改文件列表
