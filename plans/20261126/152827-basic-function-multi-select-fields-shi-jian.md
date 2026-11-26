# Plan：基础函数多对象可选展示字段 + 公共字段接口

## 需求理解

- 基础行为 · 基础函数：选中多个对象时，也可选择「展示字段」（`mode=QUERY`），不再强制只能聚合。
- 展示字段 / 聚合参数名 / 条件字段选项统一改用 `POST /ontology/action/basic-function/common-properties`（`docs/20261126/commonProApi.md`）。
- 单对象也走同一接口，`ontologyIdentifiers` 只传 1 个。

## 修改范围

- 新增：`src/types/apis/postOntologyActionBasicFunctionCommonPropertiesType.ts`
- 修改：`src/types/index.ts` 导出
- 修改：`src/apis/ontologyActionApi.ts`、`src/apis/index.ts`
- 新增：`src/mockData/fixtures/ontology/action.basicFunction.commonProperties.post.json`
- 修改：`src/mockData/routes.json`
- 修改：`src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- 修改：`src/views/SpaceBehaviorWorkspace/utils/buildBasicFunctionCreateActionParams.ts`
- 修改：`tests/ontology-space-behavior.test.mjs`（及相关断言）

## 新增 / 修改 / 删除文件

| 动作 | 路径 |
|------|------|
| 新增 | `src/types/apis/postOntologyActionBasicFunctionCommonPropertiesType.ts` |
| 新增 | `src/mockData/fixtures/ontology/action.basicFunction.commonProperties.post.json` |
| 新增 | `plans/20261126/152827-basic-function-multi-select-fields-shi-jian.md` |
| 修改 | `src/types/index.ts` |
| 修改 | `src/apis/ontologyActionApi.ts` |
| 修改 | `src/apis/index.ts` |
| 修改 | `src/mockData/routes.json` |
| 修改 | `BehaviorFormDialog.vue` |
| 修改 | `buildBasicFunctionCreateActionParams.ts` |
| 修改 | `tests/ontology-space-behavior.test.mjs` |

## 核心实现方式

1. API：`postOntologyActionBasicFunctionCommonPropertiesInterface`，domain 使用 `ONTOLOGYMANAGE_URL`，body 含可选 `ontologySpaceId` 与必填 `ontologyIdentifiers`。
2. 表单：已选对象数 ≥ 1 时展示「结果配置」；字段选项按全部已选 id 调公共字段接口；`label` 由 `displayNames` 去重拼接。
3. 同步/回填：多对象不再强制聚合、不再清空 `selectFields`。
4. 保存：多对象 + 无聚合允许 `mode=QUERY` + `selectFields`。
5. Mock：按文档样例落 POST fixture。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先更新/补测试并确认失败，再实现。
- `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`、任务文件 `format:check`。
