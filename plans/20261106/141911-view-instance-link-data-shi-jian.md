# 查看实例关系数据

## 需求理解

关系实例测试弹框按钮改为「查看实例关系数据」；点击打开独立占位弹框并调用 `POST /ontology/entity/all_link`。属性值/算子仍走原「查看实例数据」。响应展示待定。

## 修改范围

- 新增 entityAllLink 类型 / API / Mock / 契约测试
- 新增 `BehaviorEntityLinkDataDialog.vue`
- 修改 `BehaviorTestDialog.vue` 按钮与接线
- 更新 `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 新增：`src/types/apis/postOntologyEntityAllLinkType.ts`
- 新增：`src/mockData/fixtures/ontology/entity/allLink.post.json`
- 新增：`src/mocks/postOntologyEntityAllLinkMock/postOntologyEntityAllLinkMock.ts`
- 新增：`tests/post-ontology-entity-all-link-api.test.mjs`
- 新增：`src/views/SpaceBehaviorWorkspace/components/BehaviorEntityLinkDataDialog.vue`
- 新增：本 Plan
- 修改：`src/types/index.ts`、`src/apis/ontologyEntityApi.ts`、`src/apis/index.ts`、`src/mockData/routes.json`
- 修改：`BehaviorTestDialog.vue`、`tests/ontology-space-behavior.test.mjs`

## 核心实现方式

关系模式选齐 From/To 后打开新弹框，请求体两端主键数组；成功仅占位文案。

## 新增依赖

无

## 验证方式

- `node --test tests/post-ontology-entity-all-link-api.test.mjs tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <本次文件>`
- `npm run type-check`、`npm run build:verify`
