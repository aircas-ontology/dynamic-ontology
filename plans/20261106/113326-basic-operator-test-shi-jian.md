# 基础函数算子行为测试

## 需求理解

支持 **基础行为 + 基础函数算子** 的测试流程：

1. 弹框内容：按行为挂载对象的 `ontologyUniqIdentifier` 分页查询实例，单选即可。
2. 点击「开始测试」调用已有 `POST /ontology/action/test`（`postTestOntologyActionInterface`）。
3. 请求体对齐文档 5.3.3：

```json
{
  "ontologySpaceId": "<spaceId>",
  "actionApi": "<behaviorApiName>",
  "entityPrimaryKey": "<所选实例主键>"
}
```

本轮不传 `params` / `dataPrimaryKey` / `linkEntityPrimaryKey`。属性值测试逻辑保持不变。

## 修改范围

**入口** — `src/views/SpaceBehaviorWorkspace/index.vue`

- `openBehaviorTest` 放宽为：`kind === "basic"` 且 `valueType` 为 `attributeValue` **或** `basicFunctionOperator`。
- 提示文案同步为同时覆盖两类。

**弹框** — `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`

- 增加 `isBasicFunctionOperatorTest`（`valueType === "basicFunctionOperator"`）。
- UI：算子模式下只展示「选择实体实例」；隐藏「选择数据行」「测试参数」；保留「查看实例数据 / 关闭 / 开始测试」。
- `dialogHint`：算子模式提示「选择对象实例后执行基础函数算子测试」。
- 打开时：算子模式只 `loadEntityList`，不调用 `loadBehaviorDetailParams`。
- `submitBehaviorTest`：算子分支校验已选实例后提交上述三字段；`actionApi` 取列表项 `behaviorApiName`（必要时 trim）；属性值分支逻辑不动。
- watch 依赖补上 `behavior?.valueType`，避免模式切换状态错乱。

**测试** — `tests/ontology-space-behavior.test.mjs`

- 更新入口门禁与弹框断言：支持 `basicFunctionOperator`；算子模式不展示参数区；提交含三字段且不含本轮未用字段的强制路径。

**不动**

- API / 类型（`testOntologyActionType.ts` 已具备）。
- 关系实例、应用行为、带 `linkEntityPrimaryKey` 的算子扩展场景。

## 新增、修改和删除文件

- 修改：`src/views/SpaceBehaviorWorkspace/index.vue`
- 修改：`src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- 修改：`tests/ontology-space-behavior.test.mjs`
- 新增：本 Plan 文件

## 核心实现方式

列表测试入口放宽后，算子模式弹框仅加载实体列表；提交 `ontologySpaceId` + `actionApi` + `entityPrimaryKey`。

## 新增依赖

无

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <本次文件>`
- `npm run type-check`、`npm run build:verify`（记录既有失败）
