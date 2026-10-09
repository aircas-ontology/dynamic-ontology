# 本体空间导出类型

## 需求理解

本体空间导出弹窗增加导出类型选择。接口查询字段为 `exportType`，枚举为 `SCHEMA`（仅结构）和 `INSTANCE`（含实例数据，默认）。导出说明写明这两个枚举的含义。对象导出不在本次范围。

## 修改范围

- 导出参数类型增加必填 `exportType`。
- 空间导出接口说明补充该字段；请求仍为 `GET /ontology/space/export`，参数原样作为查询参数。
- 导出弹窗保留空间名称，并用说明列出 `SCHEMA：仅结构`、`INSTANCE：含实例数据`。
- 单选默认 `INSTANCE`，打开弹窗时重置；导出过程中不可切换。确认时把当前类型传给导出函数。
- 下载文件名和对象导出保持不变。

## 新增、修改和删除文件

修改：

- `src/types/apis/exportOntologySpaceType.ts`
- `src/types/index.ts`
- `src/apis/ontologyManageApi.ts`
- `src/views/OntologySpaceManagement/components/SpaceCommandDialogs.vue`
- `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts`
- `tests/export-ontology-space-api.test.mjs`

不新增、不删除文件。

## 核心实现方式

- 在导出参数文件定义 `OntologySpaceExportType = "SCHEMA" | "INSTANCE"`，并由 `@/types` 转导出。
- 弹窗使用 `el-radio-group.aircas-radio-group` 与 `el-radio.aircas-radio`，选项文案为「仅结构」「含实例数据」。
- `confirmExportOntologySpace` 接收所选类型，调用 `getExportOntologySpaceInterface({ spaceId, exportType })`。

## 新增依赖及必要性

不新增依赖。

## 验证方式

先更新 `tests/export-ontology-space-api.test.mjs` 并确认失败，再实现后确认通过。对本次文件执行格式检查。类型目录变更后执行 `npm run check:types-conventions`、`npm run type-check` 和 `npm run build:verify`。在浏览器打开本体空间导出弹窗，核对默认选项、说明文案和切换。
