## 1 数据源接口对接

## 需求背景

属性关联数据源的数据源接口对接

## 功能要求

接口说明：获取对象空间下数据源列表（E:\资料\h数字5模块\project\dev-project\docs\20260921\getOntologyDatasourceTablesApi-guoshengnan.md）、根据对象空间和表名查询字段信息（E:\资料\h数字5模块\project\dev-project\docs\20260921\getOntologyDatasourceColumnsApi-guoshengnan.md），点击对象属性列表页的关联数据源按钮，弹出弹框时调用
对象空间下数据源列表接口，获取数据显示到选择数据源的下拉框中，在下拉框选择好数据后，在关联数据源中选择一个表，根据选择信息调用对象空间和表名查询字段信息接口获取表字段数据回显到关联数据源字段的下拉框中。关联对象字段的下拉框数据用对象的全部属性列表
