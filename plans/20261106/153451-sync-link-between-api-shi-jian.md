# 同步 link_between 接口契约

## 需求理解

按 `docs/20261106/entityAllLinkApi.md` 最新契约：

- URI：`POST /ontology/entity/link_between`（原 `/ontology/entity/all_link`）
- Body 由数组改为单对象（From/To 四字段）
- 响应仍待补充，`data` 继续为 `unknown`
- 函数名暂保留 `postOntologyEntityAllLinkInterface`

## 修改范围

- 类型：`postOntologyEntityAllLinkType.ts`、`types/index.ts`
- API / Mock：`ontologyEntityApi.ts`、`routes.json`
- 调用：`BehaviorTestDialog.vue`、`BehaviorEntityLinkDataDialog.vue`
- 测试：`post-ontology-entity-all-link-api.test.mjs`、`ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改上述文件
- 无新增 / 删除文件

## 核心实现方式

- `PostOntologyEntityAllLinkParams` 改为四字段对象
- 删除 `OntologyEntityIdsQueryParam`
- API URL 与 Mock path 改为 `/ontology/entity/link_between`
- 对话框组装 From/To 单对象请求体

## 新增依赖

无

## 验证方式

- `node --test tests/post-ontology-entity-all-link-api.test.mjs tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <本次文件>`
- `npm run type-check`、`npm run build:verify`
