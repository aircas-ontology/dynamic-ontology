# 本体对象导出类型

## 需求理解

本体对象导出按已确认的本体空间导出方式增加导出类型。查询字段为 `exportType`，枚举为 `SCHEMA`（仅结构）和 `INSTANCE`（含实例数据，默认）。导出说明写明这两个枚举。空间导出和对象文件名解析不改。

## 修改范围

- 对象导出参数增加必填 `exportType`。
- `GET /ontology/meta/export` 仍把参数原样作为查询参数，并补充字段说明。
- 导出弹窗保留对象名称，说明列出 `SCHEMA：仅结构`、`INSTANCE：含实例数据`。
- 单选默认 `INSTANCE`，打开弹窗时重置；导出过程中不可切换。确认时把当前类型传给导出函数。

## 新增、修改和删除文件

修改：

- `src/types/apis/exportOntologyType.ts`
- `src/types/index.ts`
- `src/apis/ontologyObjectManageApi.ts`
- `src/views/OntologySpaceManagementDetail/components/OntologyObjectExportDialog.vue`
- `src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceObjectActions.ts`
- `tests/export-ontology-api.test.mjs`

不新增、不删除文件。

## 核心实现方式

- 在对象导出参数文件定义 `OntologyExportType = "SCHEMA" | "INSTANCE"`，并由 `@/types` 转导出。
- 弹窗使用 `el-radio-group.aircas-radio-group` 与 `el-radio.aircas-radio`。
- `confirmExportOntologyObject` 接收所选类型，调用 `getExportOntologyInterface({ uniqueIdentifier, exportType })`。

## 新增依赖及必要性

不新增依赖。

## 验证方式

先更新 `tests/export-ontology-api.test.mjs` 并确认失败，再实现后确认通过。对本次文件执行格式检查。类型目录变更后执行 `npm run check:types-conventions`、`npm run type-check` 和 `npm run build:verify`。
