# 行为树编辑表单回显与类别锁定

## 需求理解

点击行为树编辑按钮后，已调用行为详情接口。编辑弹框中：

- 类别自动选中「行为树」且不可编辑；
- 回显对应表单基础字段（名称、api 名称、分类、描述等）；
- 不因类型误判阻断「行为树编排」入口。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/utils/mapOntologyActionInfoToFormState.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

不新增依赖；不改编排弹窗保存/加载逻辑（已支持 edit 态 GET）。

## 新增、修改和删除文件

| 操作 | 路径                                     |
| ---- | ---------------------------------------- |
| 修改 | `mapOntologyActionInfoToFormState.ts`    |
| 修改 | `BehaviorFormDialog.vue`                 |
| 修改 | `tests/ontology-space-behavior.test.mjs` |
| 新增 | 本 Plan 文件                             |

## 核心实现方式

1. `mapActionKind`：`TREE` → `behaviorTree`。
2. `unsupportedEditReason`：`kind === "behaviorTree"` 时置空（编排内保存，不走表单「保存行为」）。
3. 编辑态禁用类别 `el-select`（`mode === "edit"`）。
4. 基础字段沿用现有 `applyActionInfoBaseFields` 回填。

## 新增依赖及必要性

无。

## 验证方式

- 单测：TREE 详情映射为 `behaviorTree`、`unsupportedEditReason === ""`，并校验表单源码编辑态禁用类别。
- `npm test -- tests/ontology-space-behavior.test.mjs`（或项目现有入口中相关用例）。
- `npm run format:check --` 任务涉及文件；需要时 format。
- 适用时 `npm run type-check`。
