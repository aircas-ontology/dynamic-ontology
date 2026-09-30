# 创建本体空间参数 icon → iconUrl

## 需求理解

按 `docs/20260918/createOntologySpaceApi-guoshengnan.md` 正文，创建空间请求字段 `icon` 改为可选 `iconUrl`；`description` 改为可选。编辑空间接口仍使用 `icon`，不在本次范围。

## 修改范围

- `src/types/apis/createOntologySpaceType.ts`
- `src/apis/ontologyManageApi.ts`（JSDoc）
- `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts`（创建调用）
- `tests/create-ontology-space-api.test.mjs`

## 新增、修改和删除文件

- 新增：无
- 修改：上述文件 + Plan
- 删除：无

## 核心实现方式

1. `CreateOntologySpaceParams`：`iconUrl?: string`、`description?: string`
2. 创建调用改为 `iconUrl: draft.iconUrl`
3. 测试断言同步为 `iconUrl`

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/create-ontology-space-api.test.mjs`
- `npm run type-check`
- `npm run format:check -- <任务文件>`
