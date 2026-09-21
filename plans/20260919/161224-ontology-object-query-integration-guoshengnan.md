# 本体对象列表查询接入计划

## 需求理解

在本体空间对象页面适配分类树接口返回的 `ontologyMetaInfos` 本体对象数据。页面初次进入时展示分类树响应中的全部本体对象；点击左侧分类树节点时通过右侧列表锚点定位到对应分类分区。

## 修改范围

- 使用分类树接口响应内嵌的本体元信息构建右侧现有卡片/表格分区。
- 分类树节点和右侧对象分区使用相同的 `categoryId` 锚点；节点选择触发平滑滚动和高亮。
- 保留对象创建流程及分类树加载的 loading、empty、error 状态。
- 新增针对 API 契约和页面接入的测试；不修改受保护的 `html/`、`public/`。

## 文件

- 新增：`src/types/apis/getOntologyObjectByCategoryIdType.ts`
- 新增：`tests/ontology-object-query-api.test.mjs`
- 修改：`src/apis/ontologyObjectManageApi.ts`
- 修改：`src/apis/index.ts`
- 修改：`src/types/index.ts`
- 修改：`src/views/OntologySpaceManagementDetail/composables/useOntologyObjectWorkspace.ts`
- 修改：`src/views/OntologySpaceManagementDetail/utils/mapOntologyCategoryTree.ts`
- 修改：`src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`
- 修改：`src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue`
- 修改：`tests/ontology-object-workspace.test.mjs`

## 核心实现方式

- 初次加载只请求分类树接口，同时将每个分类节点的 `ontologyMetaInfos` 映射为右侧对象分区。
- 每个分类节点都生成对应右侧锚点，即使该分类暂无对象也可定位。
- 选择分类节点时保留左侧树选中状态，右侧通过 `scrollIntoView` 平滑定位并短暂高亮目标分区。

## 新增依赖

- 无。

## 验证方式

- 先运行新增测试确认失败，再完成实现并运行 `npm test`、`npm run test:coverage`。
- 执行 `npm run check:types-conventions`、`npm run type-check`、`npm run build:verify`。
- 对全部任务文件执行 Prettier 格式化与检查，最后执行 `git diff --check` 和工作区范围检查。
