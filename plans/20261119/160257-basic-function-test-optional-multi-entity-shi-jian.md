# 基础函数测试：对象实体实例改为可选

## 需求理解

多对象基础函数测试因未选某一对象实例被拦截。按 `docs/20261105/testActionApi.md` 5.3.3：不传实例则默认查全部，`entityPrimaryKeys` 可选。将「选择各对象实体实例」改为可不传；回写目标实例仍必填。

## 修改范围

仅改测试弹窗组装/文案与相关测试断言；不改保存创建、类型契约、文档。

## 新增、修改和删除文件

- 修改：`src/components/BehaviorTestDialog/BehaviorTestDialog.vue`
- 修改：`tests/ontology-space-behavior.test.mjs`
- 无新增依赖；不删文件

## 核心实现方式

1. `buildBasicFunctionTestRequestParams`：去掉每个 picker 必须选中的校验；仅把已选对象写入 `entityPrimaryKeys`；全部未选则不挂该字段。
2. 文案对齐单对象可选：标题加「（可选）」、placeholder「不选则查询全部实例」、`dialogHint` 去掉强制选择语气。

## 新增依赖及必要性

无。

## 验证方式

- 更新相关断言后执行 `npm test` / `npm run test:coverage`
- `npm run type-check`、`npm run build:verify`
- `npm run format:check --` 仅改动文件
