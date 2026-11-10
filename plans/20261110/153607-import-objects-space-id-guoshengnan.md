# 对象导入传入空间标识

## 需求理解

空间内通过文件导入创建对象时，向导入接口传入当前空间的 `spaceId`。

## 修改范围

- 修改 `src/types/apis/importOntologiesType.ts`、`src/apis/ontologyObjectManageApi.ts` 和 `src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts`。
- 修改 `tests/import-ontologies-api.test.mjs`，覆盖接口表单和页面操作。
- 新增本计划文件；不删除文件，不新增依赖。

## 实现方式

校验当前空间标识，将其与文件作为 multipart 表单字段提交；无有效空间标识时提示且不请求。保留当前对象工作区未提交的批量导出变更。

## 验证方式

先运行测试确认目标行为未实现，再实现并运行测试。执行格式、类型规范、类型检查、构建验证、全量测试和覆盖率检查；审查差异及工作区状态。浏览器和真实接口联调如无法执行则注明。
