import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
function readSource(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
}

test("workspace opens create schedule dialog with shared aircas classes", () => {
  const workspaceSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/index.vue");
  const dialogSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleFormDialog.vue");

  assert.match(workspaceSource, /BehaviorScheduleFormDialog/);
  assert.match(workspaceSource, /openCreateScheduleDialog/);
  assert.doesNotMatch(workspaceSource, /showPendingMessage\('新建调度'\)/);
  assert.match(dialogSource, /class="aircas-dialog/);
  assert.match(dialogSource, /class="aircas-form/);
  assert.match(dialogSource, /aircas-input/);
  assert.match(dialogSource, /aircas-select/);
  assert.match(dialogSource, /aircas-radio-group/);
  assert.match(dialogSource, /aircas-radio/);
  assert.match(dialogSource, /aircas-checkbox/);
  assert.match(dialogSource, /aircas-button/);
  assert.match(dialogSource, /popper-class="aircas-picker"/);
  assert.match(dialogSource, /新建调度/);
  assert.match(dialogSource, /close-on-click-modal/);
});

test("workspace opens edit schedule dialog with the same form and echoed row data", () => {
  const workspaceSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/index.vue");
  const dialogSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleFormDialog.vue");
  const typeSource = readSource("../src/types/pages/ontologySpaceBehaviorScheduleType.ts");

  assert.match(workspaceSource, /openEditScheduleDialog/);
  assert.match(workspaceSource, /submitEditSchedule/);
  assert.doesNotMatch(workspaceSource, /showPendingMessage\('编辑'\)/);
  assert.match(dialogSource, /编辑调度/);
  assert.match(dialogSource, /props.mode === "edit"|mode === "edit"/);
  assert.match(dialogSource, /hydratingScheduleDraft/);
  assert.match(typeSource, /"create" \| "edit" \| "view"/);
});

test("workspace opens view schedule dialog with the same form in readonly mode", () => {
  const workspaceSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/index.vue");
  const dialogSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleFormDialog.vue");
  const typeSource = readSource("../src/types/pages/ontologySpaceBehaviorScheduleType.ts");

  assert.match(workspaceSource, /openViewScheduleDialog/);
  assert.match(workspaceSource, /:mode="formMode"/);
  assert.match(workspaceSource, /:initial-draft="formDraft"/);
  assert.doesNotMatch(workspaceSource, /showPendingMessage\('查看'\)/);
  assert.match(dialogSource, /查看调度/);
  assert.match(dialogSource, /formDisabled/);
  assert.match(dialogSource, /props.mode === "view"/);
  assert.match(typeSource, /BehaviorScheduleFormMode/);
  assert.match(typeSource, /BehaviorScheduleRecord = BehaviorScheduleDraft/);
});

test("create dialog switches rule and period fields including weekly monthly cron", () => {
  const dialogSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleFormDialog.vue");
  const typeSource = readSource("../src/types/pages/ontologySpaceBehaviorScheduleType.ts");

  assert.match(dialogSource, /规则调度/);
  assert.match(dialogSource, /周期调度/);
  assert.match(dialogSource, /规则配置/);
  assert.match(dialogSource, /每天/);
  assert.match(dialogSource, /每周/);
  assert.match(dialogSource, /每月/);
  assert.match(dialogSource, /Cron/);
  assert.match(dialogSource, /执行日/);
  assert.match(dialogSource, /BEHAVIOR_SCHEDULE_WEEKDAYS/);
  assert.match(typeSource, /周一/);
  assert.match(dialogSource, /请选择每月执行日期/);
  assert.match(dialogSource, /Cron 表达式/);
  assert.match(dialogSource, /标准 5 段：分 时 日 月 周；兼容 6 段（含秒）/);
  assert.match(dialogSource, /请先选择关联对象/);
  assert.match(dialogSource, /DEFAULT_BEHAVIOR_SCHEDULE_EXECUTE_TIME/);
  assert.match(typeSource, /08:00:00/);
});

test("workspace opens invocation log dialog with prototype columns and status tags", () => {
  const workspaceSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/index.vue");
  const dialogSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleInvocationLogDialog.vue");
  const typeSource = readSource("../src/types/pages/ontologySpaceBehaviorScheduleType.ts");
  const typesIndex = readSource("../src/types/index.ts");

  assert.match(workspaceSource, /openInvocationLogDialog/);
  assert.match(workspaceSource, /BehaviorScheduleInvocationLogDialog/);
  assert.doesNotMatch(workspaceSource, /showPendingMessage\('调用日志'\)/);
  assert.match(workspaceSource, /2026-09-03 08:12:16/);
  assert.match(dialogSource, /class="aircas-dialog/);
  assert.match(dialogSource, /aircas-table/);
  assert.match(dialogSource, /aircas-tag/);
  assert.match(dialogSource, /aircas-button/);
  assert.match(dialogSource, /调用日志/);
  assert.match(dialogSource, /调用名称/);
  assert.match(dialogSource, /调用时间/);
  assert.match(dialogSource, /调用状态/);
  assert.match(dialogSource, /关闭/);
  assert.match(dialogSource, /close-on-click-modal/);
  assert.match(typeSource, /BehaviorScheduleInvocationLog/);
  assert.match(typeSource, /BehaviorScheduleInvocationStatus/);
  assert.match(typesIndex, /BehaviorScheduleInvocationLog/);
});

test("workspace opens delete confirm dialog and removes the pending delete message", () => {
  const workspaceSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/index.vue");
  const dialogSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleDeleteDialog.vue");

  assert.match(workspaceSource, /openDeleteScheduleDialog/);
  assert.match(workspaceSource, /confirmDeleteSchedule/);
  assert.match(workspaceSource, /BehaviorScheduleDeleteDialog/);
  assert.doesNotMatch(workspaceSource, /showPendingMessage\('删除'\)/);
  assert.match(dialogSource, /class="aircas-dialog/);
  assert.match(dialogSource, /删除调度确认/);
  assert.match(dialogSource, /确认删除调度/);
  assert.match(dialogSource, /此操作不可恢复/);
  assert.match(dialogSource, /确认删除/);
  assert.match(dialogSource, /aircas-button--tone-danger/);
  assert.match(dialogSource, /type="danger"/);
  assert.match(dialogSource, /close-on-click-modal/);
});

test("schedule types are exported and used by the create dialog", () => {
  const typesIndex = readSource("../src/types/index.ts");
  const typeSource = readSource("../src/types/pages/ontologySpaceBehaviorScheduleType.ts");
  const dialogSource = readSource("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleFormDialog.vue");

  assert.match(typesIndex, /ontologySpaceBehaviorScheduleType/);
  assert.match(typeSource, /export type BehaviorScheduleStrategy/);
  assert.match(typeSource, /export type BehaviorSchedulePeriodKind/);
  assert.match(dialogSource, /from "@\/types"/);
});
