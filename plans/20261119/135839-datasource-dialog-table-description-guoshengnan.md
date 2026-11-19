# 需求理解

- 属性关联数据源弹窗的左侧数据源表节点显示表描述。描述来自已有表列表接口 `GET /ontology/datasource/table` 的 `description`。
- 右侧对象属性表改为使用点击「关联数据源」时已经请求的 `GET /ontology/property/detail`。分类名称仍按 `categoryId` 从现有分类树解析。
- 提交时从同一份详情记录读取属性名称、数据类型、主键、名称键和存储分组。

# 修改范围

- 只调整关联弹窗的表描述展示，以及弹窗属性列表和提交所使用的详情数据。
- 不改分类树、属性列表页，也不处理工作区中已有的无关修改。

# 新增、修改和删除文件

## 新增

- `plans/20261119/135839-datasource-dialog-table-description-guoshengnan.md`

## 修改

- `src/views/OntologyObjectAttributePanel/index.vue`
- `src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue`
- `tests/data-source-associate-dialog.test.mjs`

## 删除

- 无。

# 核心实现方式

- `mapDatasourceTables` 保留 `description`，弹窗表节点展示该描述；为空时显示「—」，过长省略，悬停可见全文。
- `ontologyPropertyMappings` 由 `ontologyPropertyDetails` 生成，字段使用详情中的 `uniqueIdentifier`、`displayName`、`apiName`、`propertyType`、`isPrimaryKey`、`isTitleKey`、`storageGroup` 和已有数据源关联。
- `handleDataSourceSubmit` 按详情记录组装批量更新参数。

# 新增依赖及必要性

- 无。

# 验证方式

- 先更新 `tests/data-source-associate-dialog.test.mjs` 并确认目标断言失败，再完成实现并确认通过。
- 执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`。
- 对本次修改且受 Prettier 支持的文件执行范围格式化与格式检查。
- 浏览器核对关联弹窗的表描述、右侧属性来源，以及已有连线、手动关联和提交。
