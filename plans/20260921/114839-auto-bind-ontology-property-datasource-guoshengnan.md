# 自动关联本体属性数据源对接计划

## 需求理解

将属性页“关联数据源”弹窗中的“自动关联数据源”按钮改为调用 `autoBindOntologyPropertyDatasourceApi-guoshengnan.md` 定义的后端接口。接口只提交 `ontologyIdentifier`，由后端自动处理全部数据源匹配；成功后提示成功信息并保持弹窗打开，失败后提示接口返回或请求错误。手动关联流程不调整。

## 修改范围

- 为自动关联接口补充 API 请求参数/响应类型、请求函数、统一出口和成功 Mock。
- 在 `DataSourceAssociateDialog.vue` 增加自动关联事件，由父组件发起接口调用；按钮增加提交中状态和重复点击保护。
- 在 `OntologyObjectAttributePanel.vue` 使用路由 `objectId` 作为 `ontologyIdentifier`，调用自动关联接口并处理成功/失败提示；成功不关闭弹窗。
- 不改动手动拖拽关联、缓存提交、数据源选择和属性列表查询逻辑。

## 文件变更

新增：

- `src/types/apis/autoBindOntologyPropertyDatasourceType.ts`
- `src/mocks/autoBindOntologyPropertyDatasourceMock/autoBindOntologyPropertyDatasourceMock.ts`

修改：

- `src/types/index.ts`
- `src/apis/ontologyPropertyApi.ts`
- `src/apis/index.ts`
- `src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue`
- `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`
- `tests/ontology-property-api.test.mjs`
- `tests/data-source-associate-dialog.test.mjs`

## 核心实现方式

- API：POST `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/property/auto_bind_datasource"`，请求体 `{ ontologyIdentifier }`，响应数据类型允许接口示例中的空值。
- 弹窗：新增 `auto-associate` 事件；按钮仅负责触发事件并展示 loading，不再执行本地名称匹配。
- 页面：监听事件，校验 `route.params.objectId`，调用接口；`code === 200` 时显示“自动关联数据源成功”并保持弹窗，其他状态或异常显示失败信息并保持弹窗。

## 依赖

不新增依赖，复用现有 request、Element Plus 消息组件和类型公共出口。

## 验证

- 先运行任务相关测试确认新增行为失败，再补实现并运行相关测试。
- 执行 `npm run format:check --` 覆盖本次修改的 Vue、TypeScript、测试和 Mock 文件。
- 执行 `npm run type-check`、`npm run build:verify`、必要的项目/类型规范检查，并检查 `git diff --check`。
