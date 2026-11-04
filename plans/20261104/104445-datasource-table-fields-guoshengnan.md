# 数据源表字段编辑

## 需求理解

选择数据库表步骤将入库名改为 APIName，说明以可编辑输入框展示。

## 修改范围

- 修改 DatasourceBuildDialog.vue 的表头、提示、校验文案和说明输入绑定。
- 修改 OntologyObjectCreateDialog.vue，将主表编辑后的说明传入已有对象 description。
- 更新 tests/datasource-build.test.mjs。
- 无删除文件、无新增依赖。

## 实现与验证

说明双向绑定现有 table.comment，保留跨步骤修改；接口仅支持对象级 description，不增加表级接口字段。先验证新增检查失败，再实施并运行测试、覆盖率、类型检查、临时构建、限定格式检查和差异检查。浏览器工具不可用时明确记录未执行视觉验收。
