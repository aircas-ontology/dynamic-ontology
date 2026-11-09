# 应用行为测试：WRITE_PROPERTY 出参实例

## 需求理解

按 `docs/20261106/shijian.md` 第 69 行与 `docs/20261105/api-application-action-test-params.md` §3 / §4.8：

- 弹框除 `category=INPUT` 外，还要展示 `category=OUTPUT` 且 `outputMode=WRITE_PROPERTY` 的参数。
- 按行内 `ontologyUniqueIdentifier` 选择写回目标对象实例。
- 传参规则与 PROPERTY 入参相同：对象 id → 实例主键写入 `entityPrimaryKeys`（已有组装逻辑可复用）。
- `RESULT_ONLY` 出参不展示、不选实例。

## 修改范围

- 收集器：`src/views/SpaceBehaviorWorkspace/utils/collectApplicationPropertyOntologyPickers.ts`
- 弹框：`src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- 单测：`tests/ontology-space-behavior.test.mjs`
- 不改 `buildApplicationTestRequestParams` 的请求结构。

## 新增、修改和删除文件

- 修改上述 3 个文件；新增本 Plan 文件；无删除、无新依赖。

## 核心实现方式

1. 扩展 `collectApplicationPropertyOntologyPickers`，并入 `outputMode=WRITE_PROPERTY` 出参行的对象标识，按对象 id 去重。
2. 弹框增加 `applicationWritePropertyOutputRows`，展示「写回属性出参」区块，复用现有实例选择器。
3. 提交仍遍历 `applicationOntologyPickers` 组装 `propertyEntitySelections`。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 本次改动文件列表
- `npm run type-check`、`npm run build:verify`
- 交付前：`git diff --check`、`git status --short`
