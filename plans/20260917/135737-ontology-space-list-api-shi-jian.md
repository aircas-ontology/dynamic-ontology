# Plan：对接本体空间列表接口（表/卡视图）

确认范围（用户 2026-09-17）：
1. 字段映射同意：`spaceId→id`，`ontologyCount→metrics.ontology`，`actionCount→metrics.behavior`，`linkCount→metrics.relation`，`propertyCount→metrics.rule`，`source=0`；时间/分类等接口无字段置空。
2. 表格保留创建时间/创建用户/更新时间空列。
3. Mock 目录维持 `ontologySpaceListMock/`；**新建**接口契约 Mock 文件；原页面样例 Mock 保留供详情与失败回退。

## 需求理解

按 `docs/20260916/ontologyListApi-guoshengnan.md` 正文样例对接列表 GET，驱动表格与卡片同一数据源。

## 修改范围

- 重写 `src/types/apis/ontologyManageType.ts`：`OntologySpaceListItem` + `OntologySpaceListData`
- 更新 `src/types/index.ts` 导出
- 新增 `src/views/OntologySpaceManagement/utils/mapOntologySpaceList.ts` 映射
- 新增 `src/mocks/ontologySpaceListMock/ontologySpaceListApiMock.ts`（契约样例）
- 调整 `ontologySpaceListMock.ts`：继续为页面 `OntologySpaceItem[]` 样例（不再占用 `OntologySpaceListData`）
- 更新 `useSpaceManagement.ts`：成功映射接口数据；失败仍回退页面样例 Mock
- 更新相关测试

## 新增依赖

无。

## 验证方式

TDD + `npm test` / `test:coverage` / `check:types-conventions` / `type-check` / `build:verify`
