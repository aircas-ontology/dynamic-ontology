# 需求理解

- 点击属性列表页“关联数据源”时，先调用 `GET /ontology/property/info`，以当前本体对象标识查询全部属性信息。
- 直接使用 `/info` 返回属性记录中的 `datasourceId` 和 `datasourceColumnName`，结合本体空间数据源表和字段接口还原已有连接。
- 完成回显数据准备后再打开关联弹窗，避免弹窗先按空关联初始化。

# 修改范围

- 扩展属性信息类型以承载 `/info` 返回的回显数据源字段。
- 调整关联数据源入口的异步流程、重复请求控制、错误反馈和连接数据适配。
- 给关联数据源入口按钮增加加载状态。
- 增加属性信息入口及连接回显流程的测试。

# 文件范围

## 新增

- `src/types/apis/getOntologyPropertyDetailByOntologyIdType.ts`
- `plans/20260922/185935-property-datasource-association-echo-guoshengnan.md`

## 修改

- `src/types/index.ts`
- `src/apis/ontologyPropertyApi.ts`
- `src/apis/index.ts`
- `src/views/OntologyObjectDetail/components/AttributePropertyTable.vue`
- `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`
- `tests/ontology-property-api.test.mjs`
- `tests/data-source-associate-dialog.test.mjs`

## 删除

- 无。

# 核心实现

- 关联数据源入口使用 `getOntologyPropertyByOntologyIdInterface`，发送 `GET /ontology/property/info`，查询参数为 `ontologyUniqueIdentifier`。
- 点击入口后直接使用属性信息中的数据源关联字段，再加载空间数据源表；对已关联表加载字段信息。
- 使用 `datasourceId` 匹配数据源表的 `tableName`，使用 `datasourceColumnName` 还原字段连接，并由表记录补充接口未返回的 `schemaName`。
- 数据全部准备完成后打开弹窗，使弹窗初始化时直接获得已有连接。
- 入口加载期间禁用重复触发；任一步失败时不打开弹窗，并展示后端错误信息。

# 新增依赖

- 无。

# 验证方式

- 先新增并运行相关测试，确认实现前失败，再完成最小实现并确认通过。
- 对任务文件执行限定范围的格式化和格式检查。
- 执行类型目录规范检查、类型检查、临时构建验证、全量测试和覆盖率检查。
- 交付前检查 `git diff --check`、任务 diff 和工作区状态，保留现有无关修改。
