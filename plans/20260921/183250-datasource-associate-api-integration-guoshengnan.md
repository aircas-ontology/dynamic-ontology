# 属性关联数据源接口联动

## 需求理解

属性页面打开“关联数据源”弹窗时查询本体空间下的数据源表；选择表后查询该表字段，并将字段显示在关联数据源字段下拉框中。关联本体字段使用当前本体对象的全部属性。

## 修改范围

- 根据两个已指定接口文档新增数据源表、数据源字段的类型、API 函数、Mock 和统一出口。
- 将数据源表 API 的分页记录适配为现有关联弹窗所需的数据源表结构。
- 将字段 API 的字段记录适配为弹窗字段选项，并在表选择变化时触发查询。
- 属性页打开弹窗时加载数据源表，并传入全部本体属性；保留自动关联和手动关联交互。
- 补充 API、弹窗和属性页测试。

## 新增、修改和删除文件

- 新增 `src/types/apis/getOntologyDatasourceTablesType.ts`。
- 新增 `src/types/apis/getOntologyDatasourceColumnsType.ts`。
- 新增 `src/mocks/getOntologyDatasourceTablesMock/getOntologyDatasourceTablesMock.ts`。
- 新增 `src/mocks/getOntologyDatasourceColumnsMock/getOntologyDatasourceColumnsMock.ts`。
- 修改 `src/apis/ontologyDatasourceApi.ts`、`src/apis/index.ts`、`src/types/index.ts`。
- 修改 `src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue`。
- 修改 `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`。
- 修改并新增相关测试文件。

## 核心实现方式

父页面负责根据路由 `spaceId` 请求数据源表和字段，维护查询 loading 与错误提示，并把规范化后的数据源目录传入弹窗。弹窗选择关联数据源表时发出内部表标识事件，父页面据此使用该记录的 `tableName` 调用字段接口并更新对应表的字段列表。属性选项来自全部属性查询结果。

## 新增依赖及必要性

无。

## 验证方式

- 先新增接口和交互断言并确认失败。
- 完成实现后运行数据源、属性页面相关测试。
- 对任务文件执行格式化与格式检查。
- 执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify` 与 `git diff --check`。
