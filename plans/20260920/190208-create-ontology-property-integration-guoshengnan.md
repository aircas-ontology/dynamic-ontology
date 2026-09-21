# 本体对象属性接口对接实施计划

## 需求理解

将本体对象属性页面从本地草稿数据切换为后端接口：进入页面查询当前本体全部属性，点击属性分类查询分类下属性，新增、编辑、删除分别调用对应接口，并在成功后关闭弹窗、提示和刷新列表。

## 修改范围

- 新增本体属性 API 类型、请求函数和契约 Mock。
- 扩展 `src/apis/index.ts`、`src/types/index.ts` 公共出口。
- 修改 `OntologyObjectAttributePanel.vue` 的查询、表单提交、编辑回显和删除流程。
- 扩展属性页面专项测试，覆盖接口调用契约和页面行为入口。

## 文件清单

新增：

- `src/types/apis/createOntologyPropertyType.ts`
- `src/types/apis/deleteOntologyPropertyType.ts`
- `src/types/apis/getOntologyPropertyByCategoryIdType.ts`
- `src/types/apis/getOntologyPropertyByOntologyIdType.ts`
- `src/types/apis/updateOntologyPropertyType.ts`
- `src/apis/ontologyPropertyApi.ts`
- `src/mocks/createOntologyPropertyMock/createOntologyPropertyMock.ts`
- `src/mocks/deleteOntologyPropertyMock/deleteOntologyPropertyMock.ts`
- `src/mocks/getOntologyPropertyByCategoryIdMock/getOntologyPropertyByCategoryIdMock.ts`
- `src/mocks/getOntologyPropertyByOntologyIdMock/getOntologyPropertyByOntologyIdMock.ts`
- `src/mocks/updateOntologyPropertyMock/updateOntologyPropertyMock.ts`

修改：

- `src/apis/index.ts`
- `src/types/index.ts`
- `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`
- `tests/ontology-object-attribute-panel.test.mjs`

## 核心实现

- 全部属性查询使用 `GET /ontology/property/info`，参数为路由对象标识 `ontologyUniqueIdentifier`。
- 分类查询使用 `GET /ontology/property/by_category`，只传当前树节点的 `categoryId`。
- 创建使用 `POST /ontology/property`；页面字段映射为接口字段，数据源相关字段传空字符串或空对象，缺省字段使用文档允许的默认值。
- 编辑使用 `PUT /ontology/property`，以属性 `uniqueIdentifier` 作为更新标识。
- 删除使用 `DELETE /ontology/property/{propertyUniqueIdentifier}`，删除前二次确认。
- 查询、命令操作分别维护 loading/submitting/error 状态，防止重复提交并显示失败消息。

## 依赖

不新增依赖，复用现有 request、Element Plus 和 Aircas 公共样式。

## 验证

- 先运行新增专项测试确认失败，再完成实现。
- 运行 `npm test`、`npm run test:coverage`、`npm run check:types-conventions`、`npm run type-check`、`npm run build:verify`。
- 对任务文件执行 `npm run format:check -- <明确文件列表>`，并执行 `git diff --check`。
