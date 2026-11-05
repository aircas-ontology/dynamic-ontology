# 需求理解与范围

数据源构建字段选择仅允许属性创建支持的数据类型。不支持字段禁选并提示，默认勾选、全选、重新加载及提交校验统一过滤。

# 文件

修改 `src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue` 与 `tests/datasource-build.test.mjs`；新增本实施记录；无文件删除及新增依赖。

# 实现方式

以属性创建支持的 Boolean、Int、Long、Float、Short、Byte、Double、Decimal、String、Date、Array、Timestamp 为允许列表，接口 ontologyDataType 优先，缺失时检查 nativeType。保持外键关联配置职责，不改变外键选项。

# 验证

先增加并运行行为回归测试确认失败，再实现禁选、过滤与提交拦截。运行相关及完整测试、覆盖率、类型检查、build:verify、目标文件格式检查与 diff 检查。记录已有失败及浏览器验证缺口。
