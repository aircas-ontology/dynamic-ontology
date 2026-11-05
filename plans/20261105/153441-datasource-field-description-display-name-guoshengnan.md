# 数据源构建属性说明写入 displayName

## 需求理解

数据源构建第三步「字段与外键」中，属性说明已保存在字段 `description`。创建对象时，选中列的 `displayName` 仍使用列名。需要把说明的去空白文本写入构建请求的 `columns[].displayName`。列名继续作为 `columnName`。说明没有值时，`displayName` 使用属性名 `field.name`。第二步表级说明仍写入对象 `description`。

## 修改范围

仅调整数据源构建请求的列 `displayName` 映射，以及对应行为测试。不改向导界面、接口类型、Mock 和已有无关工作区改动。

## 新增、修改和删除文件

- 修改：`src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts`
- 修改：`tests/datasource-create-error.test.mjs`
- 新增：本 Plan 文件

无文件删除。

## 核心实现方式

在 `createOntologyObjectFromDatasource` 组装选中列时，`displayName` 优先使用 `field.description` 的去空白结果；说明没有值时使用属性名 `field.name`。

## 新增依赖及必要性

无新增依赖。

## 验证方式

先补充行为测试并确认因仍使用列名而失败，再完成映射并复测通过。执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`，以及对本次修改文件执行格式检查。浏览器在 `http://localhost:36000` 走数据源构建，核对创建请求中的属性 `displayName`。
