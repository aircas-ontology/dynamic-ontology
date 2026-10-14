# 属性类型枚举同步

## 需求理解

对象属性新增/编辑和概念模型构建中的属性类型下拉框统一删除 `Map`、`TimeSeries`、`Vector`、`MediaReference`、`Attachment`、`Geohash`、`Geoshape`、`Cipher`、`Ontology`。

## 修改范围

- 修改对象属性面板 composable 中的类型枚举。
- 修改概念模型构建页面中的类型枚举。
- 更新两处已有测试，校验保留类型和删除类型。

## 文件

- 修改 `src/views/OntologyObjectAttributePanel/composables/useAttributePropertyList.ts`。
- 修改 `src/views/OntologyConceptualModelCreate/index.vue`。
- 修改 `tests/ontology-object-attribute-panel.test.mjs`。
- 新增或修改概念模型构建页面相关测试（按现有测试入口覆盖）。

## 核心实现方式

直接从两处共用下拉数据源中移除指定枚举值，不改接口请求结构、后端数据类型映射或其他页面逻辑。

## 依赖

不新增依赖。

## 验证方式

执行相关测试、定向格式检查、`npm run type-check`、`npm run build:verify`、`git diff --check`。类型检查若出现本次无关的既有错误，将单独记录。
