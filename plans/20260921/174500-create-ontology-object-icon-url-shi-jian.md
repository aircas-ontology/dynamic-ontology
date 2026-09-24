# 创建本体对象参数 icon → iconUrl

## 需求理解

按 `docs/20260919/createOntologyObjectApi-guoshengnan.md` 正文，创建本体对象请求字段改为可选 `iconUrl`。编辑对象接口不在本次范围。

## 修改范围

- `src/types/apis/createOntologyObjectType.ts`
- `src/apis/ontologyObjectManageApi.ts`（JSDoc）
- `src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue`（创建调用）
- `tests/create-ontology-object-api.test.mjs`

## 新增、修改和删除文件

新增：无。修改：上述文件。删除：无。

## 核心实现方式

`CreateOntologyObjectParams.icon` 改为 `iconUrl?`；创建请求改为传 `iconUrl`。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/create-ontology-object-api.test.mjs`
- `npm run type-check`
- `npm run format:check -- <任务文件>`
