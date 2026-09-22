# 编辑本体空间参数 icon → iconUrl

## 需求理解

按 `docs/20260918/updateOntologySpaceApi-guoshengnan.md` 正文，编辑空间请求字段改为可选 `iconUrl`。

## 修改范围

- `src/types/apis/updateOntologySpaceType.ts`
- `src/apis/ontologyManageApi.ts`（JSDoc）
- `src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts`
- `tests/update-ontology-space-api.test.mjs`

## 核心实现方式

`UpdateOntologySpaceParams.icon` 改为 `iconUrl?`；编辑提交改为传 `iconUrl`。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/update-ontology-space-api.test.mjs`
- `npm run type-check`
- `npm run format:check -- <任务文件>`
