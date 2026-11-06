# 基础函数算子测试去掉实例主键

## 需求理解

测试基础函数算子行为时不选实例、不传 `entityPrimaryKey`；仅传 `ontologySpaceId`、`actionApi`。

## 修改范围

- `testOntologyActionType.ts`：`entityPrimaryKey` 可选
- `index.vue`：算子打开不校验对象标识
- `BehaviorTestDialog.vue`：隐藏实体列表与查看实例数据；提交两字段
- 更新相关测试

## 新增依赖

无

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs tests/test-ontology-action-api.test.mjs`
- `npm run format:check -- <本次文件>`
- `npm run type-check`、`npm run build:verify`
