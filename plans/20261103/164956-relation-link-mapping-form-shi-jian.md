# Relation instance status and visibility windows

## 需求理解

- 关系实例已选中一条关系，且基础操作为「新增」或「修改」时，在关系表下方展示：
  - **状态**（必填）：选项 `ENABLE` / `DELETE`（下拉展示为 enable / delete，与截图一致）
  - **持续时间**：可多条；每行 `el-date-picker` `datetimerange`（开始/结束），支持删除行与「添加时段」
- 基础操作为「删除」、或未选关系时不展示该区块。
- 按更新后的 `docs/20261103/createActionApi.md` §3.3：`targetStatus` 为 `ENABLE`|`DELETE`；`visibilityWindows` 为 epoch millis 列表。新增时状态+时段必填；修改时状态必填、时段选填。本轮只做表单与草稿，不对接 LINK `createAction`。
- 文档中「修改不能是 DELETE」与修改示例冲突：以字段表与修改示例为准，修改也允许选 `DELETE`。

## 修改范围

- `src/types/pages/ontologySpaceBehaviorType.ts`：草稿增加 `relationTargetStatus`、`relationVisibilityWindows`；常量 options。
- `BehaviorFormDialog.vue`：显隐、状态/时段 UI、草稿写入、校验与清空。
- `ObjectBehaviorFormDialog.vue`：默认草稿补新字段。
- `tests/ontology-space-behavior.test.mjs`：断言。

## 新增、修改和删除文件

- 修改：上述类型、两个 FormDialog、测试。
- 新增/删除：无。

## 核心实现方式

```ts
const showRelationLinkMappingSection = computed(
  () => showRelationInstanceSection.value && Boolean(selectedRelationId.value.trim()) && (basicAction.value === "create" || basicAction.value === "update"),
);
// UI: datetimerange value-format x -> draft { startTime, endTime } epoch millis
```

## 新增依赖

无。

## 验证方式

- 源码断言：显隐、enable/delete、添加时段、草稿字段
- `format:check` 任务文件；`type-check`/`build:verify` 无本任务新增错误；`ontology-space-behavior` 测试通过
