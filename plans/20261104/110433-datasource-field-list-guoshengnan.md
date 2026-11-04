# 数据源字段列表与说明编辑

## 已确认需求

字段与外键步骤改为逐行表格，展示选用、属性名、数据类型、可编辑说明。说明回填接口 description，并在向导提交数据中保留；不扩展创建接口。

## 文件范围

- 修改 DatasourceBuildDialog.vue 的字段展示、说明映射和字段勾选处理。
- 修改 src/types/pages/datasourceBuildType.ts，增加可选 description。
- 更新 tests/datasource-build.test.mjs。
- 无删除、无新增依赖。

## 验证

先运行新增检查确认失败，再实现并运行定向测试、npm test、test:coverage、类型规范、类型检查、临时构建、限定格式检查和差异检查。保留已有无关失败；无浏览器控制工具时记录视觉验收缺口。
