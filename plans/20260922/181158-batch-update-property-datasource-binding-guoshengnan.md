# 需求理解

- 属性关联数据源弹窗中的手动关联、拖拽关联、删除连线和撤销操作只更新本地草稿及“操作缓存”。
- 用户点击“提交”后，才按 `docs/20260922/1.batchUpdateOntologyPropertiesApi.md` 调用批量更新接口。
- 成功后提示并将当前草稿标记为已保存，弹窗保持打开且不刷新属性树；失败时展示后端错误、保留弹窗和本地操作并恢复提交按钮。

# 修改范围

- 补充批量更新本体属性的请求类型、请求函数、统一导出和文档提供的成功 Mock。
- 给数据源表及临时关联对象保留独立的 `schemaName`，使用接口返回的 `tableName` 作为 `datasourceId`。
- 在属性面板中把弹窗提交载荷与全部属性的必填字段合并后调用批量接口。
- 增加覆盖本地暂存、统一提交、成功保持弹窗和失败保留状态的源码契约测试。

# 文件范围

## 新增

- `src/types/apis/batchUpdateOntologyPropertiesType.ts`
- `src/mocks/batchUpdateOntologyPropertiesMock/batchUpdateOntologyPropertiesMock.ts`
- `plans/20260922/181158-batch-update-property-datasource-binding-guoshengnan.md`

## 修改

- `src/types/index.ts`
- `src/apis/ontologyPropertyApi.ts`
- `src/apis/index.ts`
- `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`
- `src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue`
- `tests/ontology-property-api.test.mjs`
- `tests/data-source-associate-dialog.test.mjs`

## 删除

- 无。

# 核心实现

- 接口函数按目录规范命名为 `putBatchUpdateOntologyPropertiesInterface`，发送 `PUT /ontology/property/batch`，请求体直接使用属性更新数组。
- 弹窗继续以 `draftBinds` 和 `pendingOperations` 维护本地变更；“关联”、拖拽、删除和撤销均不调用 API。
- 提交时根据属性唯一标识查找原属性，生成接口要求的 `displayName`、`dataType`、`isTitleKey`、`isPrimaryKey`、`storageGroup` 和可选 `datasource`。
- 提交期间防止重复请求；成功时更新弹窗内部的已保存基线并清空待提交状态，失败时恢复 loading 且不关闭弹窗、不清空操作缓存。
- 解除关联按接口契约省略可选的 `datasource` 字段。

# 新增依赖

- 无。

# 验证方式

- 先运行相关测试得到失败结果，再完成实现并确认相关测试通过。
- 对任务文件执行限定范围的 Prettier 格式化和格式检查。
- 执行类型目录规范检查、类型检查、临时目录构建验证、全量测试和覆盖率检查。
- 交付前执行 `git diff --check`，检查任务 diff 与工作区状态，保留其他已有修改。
