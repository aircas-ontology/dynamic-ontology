# 需求理解

在数据源构建对象的第三步字段列表展示每张数据表的主键，使用字段接口返回的 `isPrimaryKey`，不改变字段选择或提交内容。

# 修改范围

- 修改 `src/types/pages/datasourceBuildType.ts`，为页面字段增加可选主键标识。
- 修改 `src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue`，在字段映射时保留主键标识，并在属性名后显示“（主键）”。
- 修改 `tests/datasource-schema-flow.test.mjs` 和 `tests/datasource-build.test.mjs`，验证主键、普通字段、多表、复合主键和重新加载。
- 新增本计划，不删除文件，不修改接口、依赖及受保护目录。

# 核心实现方式

字段查询响应中的 `isPrimaryKey` 映射到对应页面字段。只有值为 true 时展示主键标记；缺失时不显示，不推断为非主键。多个主键字段分别展示标记。选择、外键和提交逻辑保持原样。

# 新增依赖

无。

# 验证方式

先增加行为测试并确认目标行为未实现导致失败；实现后依次执行类型规范检查、类型检查和临时目录构建，并执行相关测试、全量测试、覆盖率、格式检查和 diff 检查。尽可能进行页面浏览器冒烟验证，记录未执行项。
