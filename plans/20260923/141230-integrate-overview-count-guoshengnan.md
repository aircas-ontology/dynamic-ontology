# 对接本体空间概览统计

## 需求理解

进入本体空间管理页时调用本体概览统计接口 `GET /ontology/overview/count`，将后端返回的空间、对象、行为和关系数量展示在顶部统计卡片中。

## 修改范围

- 增加概览统计接口的类型、API 函数和成功 Mock。
- 在空间管理 composable 中增加统计查询状态、重复请求控制和卸载保护。
- 将统计卡片从空间列表本地汇总切换为概览接口返回值。
- 页面进入时并行加载空间列表和概览统计；统计查询失败时在概览区域显示后端错误信息，列表查询保持现有行为。

## 新增、修改和删除文件

- 新增 `src/types/apis/getOntologyOverviewCountType.ts`
- 新增 `src/mocks/getOntologyOverviewCountMock/getOntologyOverviewCountMock.ts`
- 新增 `tests/get-ontology-overview-count-api.test.mjs`
- 修改 `src/types/index.ts`
- 修改 `src/apis/ontologyManageApi.ts`
- 修改 `src/apis/index.ts`
- 修改 `src/views/OntologySpaceManagement/composables/useSpaceManagement.ts`
- 修改 `src/views/OntologySpaceManagement/index.vue`

## 核心实现方式

`getOntologyOverviewCountInterface` 使用 `request` 发起无参数 GET 请求。composable 保存 `OverviewCountVO`，将四张卡片分别映射为 `spaceCount`、`ontologyCount`、`actionCount` 和 `linkCount`；响应 `code` 为 `0` 或 `200` 时视为成功，其他响应和网络异常展示错误信息并将卡片数值置为 0。页面挂载时同时触发列表与统计查询。

## 新增依赖

- 无

## 验证方式

- 先运行新增接口与页面契约测试，确认当前实现不满足统计接口接入要求。
- 完成实现后运行相关测试、类型检查、构建验证、定向格式检查和 `git diff --check`。
