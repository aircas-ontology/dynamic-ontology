# 属性值-新增行为测试（详情参数 + testAction）

## 需求理解

打开测试弹窗时调用行为详情接口，展示外部输入参数（名称、类型）并提供输入框；用户选择实体并填写后，调用 `POST /ontology/action/test`。本轮仅支持属性值-新增：请求体传 `ontologySpaceId`、`actionApi`、`entityPrimaryKey`、`params`。

## 修改范围

- 新增测试接口类型、API、Mock 路由与 fixture
- 扩展 `BehaviorTestDialog`：加载详情 EXTERNAL 入参、表单、提交
- `index.vue` 传入 `spaceId`；非 create 提交拦截
- 更新/新增契约与工作区测试

## 新增、修改和删除文件

### 新增

- `src/types/apis/testOntologyActionType.ts`
- `src/mockData/fixtures/ontology/action.test.post.json`
- `src/mocks/testOntologyActionMock/testOntologyActionMock.ts`
- `tests/test-ontology-action-api.test.mjs`
- `plans/20261105/143212-behavior-property-value-test-create-shi-jian.md`

### 修改

- `src/apis/ontologyActionApi.ts`
- `src/apis/index.ts`
- `src/types/index.ts`
- `src/mockData/routes.json`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `src/views/SpaceBehaviorWorkspace/index.vue`
- `tests/ontology-space-behavior.test.mjs`

### 删除

无

## 核心实现方式

1. `postTestOntologyActionInterface` → `ONTOLOGYMANAGE_URL + "/ontology/action/test"`，body 为 `TestOntologyActionParams`。
2. 响应类型按文档 §5.2：`TestOntologyActionResult | null`；Mock 用文档完整样例 `data: null`。
3. 弹窗打开并行：`getOntologyEntitiesInterface` + `getOntologyActionInfoInterface`。
4. 从详情 `mappingIns` 过滤 `sourceType=EXTERNAL` 且 INPUT，展示参数名/类型与输入框。
5. 提交：`basicAction === "create"` 时传四字段；否则提示后续接入。未选实体不可提交。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/test-ontology-action-api.test.mjs tests/ontology-space-behavior.test.mjs`
- 同范围 coverage（≥80%）
- `npm run format:check -- <任务文件列表>`
- `npm run type-check` / `npm run build:verify`（记录预存失败与本次相关项）
