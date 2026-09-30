# 本体对象导出增加确认弹窗

## 需求理解

卡片和列表点击导出后，先弹出确认框，用户点「导出」才调用已对接的对象导出接口。取消不发请求。

## 修改范围

- 新增对象导出确认弹窗，文案说明导出该对象的 schema 与实例数据。
- 导出按钮改为打开弹窗；确认后沿用现有下载逻辑。
- 不改接口、文件名和按钮样式。

## 新增、修改和删除文件

- 新增 `src/views/OntologySpaceManagementDetail/components/OntologyObjectExportDialog.vue`
- 修改 `src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceObjectActions.ts`
- 修改 `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`
- 修改 `tests/export-ontology-api.test.mjs`

## 核心实现方式

缺少对象标识时不打开弹窗，并提示无法导出。确认后下载文件，成功则关闭弹窗；失败时错误留在弹窗内。导出进行中忽略重复确认。

## 新增依赖

- 无

## 验证方式

- 先运行对象导出测试，确认确认弹窗断言失败，再完成最小修改并复跑。
- 对本次修改文件执行格式检查。
