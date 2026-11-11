<template>
  <section class="behavior-schedule-workspace" aria-label="行为调度管理">
    <div class="behavior-schedule-workspace__toolbar">
      <div class="behavior-schedule-workspace__filters">
        <el-input v-model="keyword" class="aircas-input behavior-schedule-workspace__keyword" clearable placeholder="调度名称">
          <template #prefix
            ><el-icon><Search /></el-icon
          ></template>
        </el-input>
        <el-select
          v-model="strategy"
          class="aircas-select behavior-schedule-workspace__strategy"
          popper-class="aircas-select-popper"
          clearable
          placeholder="调度策略"
        >
          <el-option v-for="item in strategies" :key="item" :label="item" :value="item" />
        </el-select>
        <el-button class="aircas-button aircas-button--tone-primary" @click="applyFilters">查询</el-button>
        <el-button class="aircas-button aircas-button--tone-ghost" @click="resetFilters">重置</el-button>
      </div>
      <el-button class="aircas-button aircas-button--tone-primary" :icon="Plus" @click="openCreateScheduleDialog">新建调度</el-button>
    </div>

    <div class="behavior-schedule-workspace__table-wrap">
      <p v-if="scheduleListLoading" role="status">正在加载调度列表…</p>
      <div v-if="scheduleListError" role="alert">
        {{ scheduleListError }} <el-button :disabled="scheduleListLoading" @click="fetchScheduleList()">重试</el-button>
      </div>
      <el-table
        v-else-if="!scheduleListLoading"
        :data="filteredSchedules"
        class="aircas-table aircas-table--flat behavior-schedule-workspace__table"
        height="100%"
        stripe
      >
        <el-table-column label="调度名称" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="behavior-schedule-workspace__name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="调度策略" width="110">
          <template #default="{ row }">
            <el-tag class="aircas-tag" size="small" effect="plain">{{ row.strategy }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="关联对象" min-width="140" show-overflow-tooltip />
        <el-table-column prop="behavior" label="行为" min-width="140" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">{{ row.status === "START" ? "已启动" : row.status === "STOP" ? "已停止" : "-" }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="300">
          <template #default="{ row }">
            <div class="behavior-schedule-workspace__row-actions">
              <el-button
                class="aircas-button aircas-button--tone-ghost"
                size="small"
                :disabled="createStatus === 'submitting'"
                @click="openViewScheduleDialog(row)"
                >查看</el-button
              >
              <el-button
                class="aircas-button aircas-button--tone-secondary"
                size="small"
                :disabled="createStatus === 'submitting'"
                @click="openEditScheduleDialog(row)"
                >编辑</el-button
              >
              <el-button class="aircas-button aircas-button--tone-ghost" size="small" @click="openInvocationLogDialog(row)">调用日志</el-button>
              <el-button class="aircas-button aircas-button--tone-danger" type="danger" size="small" @click="openDeleteScheduleDialog(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无调度" :image-size="72" /></template>
      </el-table>
    </div>

    <el-pagination
      class="behavior-schedule-workspace__pagination"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :current-page="schedulePage"
      :page-size="schedulePageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="scheduleTotal"
      @update:current-page="changeSchedulePage"
      @update:page-size="changeSchedulePageSize"
    />

    <BehaviorScheduleFormDialog
      v-model="formVisible"
      :mode="formMode"
      :initial-draft="formDraft"
      :space-id="scheduleSpaceId"
      :behavior-options="behaviorOptions"
      :behavior-loading="behaviorLoading"
      :behavior-error="behaviorError"
      @retry-behaviors="fetchBehaviorOptions"
      :submitting="createStatus === 'submitting'"
      @confirm="submitScheduleForm"
    />
    <BehaviorScheduleInvocationLogDialog v-model="logVisible" :schedule-name="logScheduleName" :logs="invocationLogs" />
    <BehaviorScheduleDeleteDialog
      v-model="deleteVisible"
      :schedule-name="deletingScheduleName"
      :submitting="deleteStatus === 'submitting'"
      @confirm="confirmDeleteSchedule"
    />
  </section>
</template>

<script setup lang="ts">
import type { CreateBehaviorScheduleParams, ListBehaviorSchedulingParams, ScheduleBehaviorOption } from "@/types";
import { cloneBehaviorParameterSnapshot } from "@/utils/behaviorParameters/cloneBehaviorParameterSnapshot";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  getBehaviorSchedulingDetailInterface,
  getListBehaviorSchedulingInterface,
  getListOntologyActionInterface,
  postCreateBehaviorScheduleInterface,
} from "@/apis";
import { fetchBehaviorSchedules } from "./utils/fetchBehaviorSchedules";
import { fetchScheduleBehaviorOptions } from "@/views/SpaceBehaviorScheduleWorkspace/utils/fetchScheduleBehaviorOptions";
import { Plus, Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

import {
  BEHAVIOR_SCHEDULE_INVOCATION_STATUSES,
  type BehaviorScheduleCommandStatus,
  type BehaviorScheduleDraft,
  type BehaviorScheduleFormMode,
  type BehaviorScheduleInvocationLog,
  type BehaviorScheduleRecord,
  type BehaviorScheduleStrategy,
} from "@/types";
import { cloneScheduleRuleFlow } from "./utils/scheduleRuleFlowFactory";

import BehaviorScheduleDeleteDialog from "./BehaviorScheduleDeleteDialog.vue";
import BehaviorScheduleFormDialog from "./BehaviorScheduleFormDialog.vue";
import BehaviorScheduleInvocationLogDialog from "./BehaviorScheduleInvocationLogDialog.vue";

const schedules = ref<BehaviorScheduleRecord[]>([]);

const keyword = ref("");
const strategy = ref("");
const appliedKeyword = ref("");
const appliedStrategy = ref("");
const formVisible = ref(false);
const formMode = ref<BehaviorScheduleFormMode>("create");
const formDraft = ref<BehaviorScheduleDraft | null>(null);
const editingScheduleId = ref("");
const createStatus = ref<BehaviorScheduleCommandStatus>("idle");
const logVisible = ref(false);
const logScheduleName = ref("");
const emptyInvocationLogs: BehaviorScheduleInvocationLog[] = [];
const invocationLogs = ref(emptyInvocationLogs);
const deleteVisible = ref(false);
const deletingScheduleId = ref("");
const deletingScheduleName = ref("");
const deleteStatus = ref<BehaviorScheduleCommandStatus>("idle");
const strategies: BehaviorScheduleStrategy[] = ["规则调度", "周期调度"];
const route = useRoute();
const scheduleSpaceId = computed(() => String(route.params.spaceId ?? ""));
const behaviorOptions = ref<ScheduleBehaviorOption[]>([]);
const behaviorLoading = ref(false);
const behaviorError = ref("");
let behaviorRequest = 0;
let scheduleSaveRequest = 0;
let scheduleListRequest = 0;
let scheduleDetailRequest = 0;
const schedulePage = ref(1);
const schedulePageSize = ref(10);
const scheduleTotal = ref(0);
const scheduleListLoading = ref(false);
const scheduleListError = ref("");

/** @description 获取真实调度列表，支持失败重试，阻止重复请求及过期响应覆盖。 @param force 是否替换正在进行的旧查询。 @returns 查询完成。 */
async function fetchScheduleList(force = false): Promise<void> {
  if (scheduleListLoading.value && !force) return;
  const requestId = ++scheduleListRequest;
  scheduleListLoading.value = true;
  scheduleListError.value = "";
  try {
    const params: ListBehaviorSchedulingParams = { pageNum: schedulePage.value, pageSize: schedulePageSize.value };
    if (appliedKeyword.value) params.name = appliedKeyword.value;
    if (appliedStrategy.value) params.type = appliedStrategy.value === "周期调度" ? "TASK" : "RULE";
    const result = await fetchBehaviorSchedules(getListBehaviorSchedulingInterface, () => requestId === scheduleListRequest, params);
    if (requestId === scheduleListRequest && result) {
      schedules.value = result.records;
      scheduleTotal.value = result.total;
    }
  } catch (cause) {
    if (requestId === scheduleListRequest) scheduleListError.value = cause instanceof Error ? cause.message : "调度列表加载失败";
  } finally {
    if (requestId === scheduleListRequest) scheduleListLoading.value = false;
  }
}

/** @description 获取当前空间全部非基础行为，阻止重复请求及过期响应覆盖。 */
async function fetchBehaviorOptions() {
  if (behaviorLoading.value) return;
  const requestId = ++behaviorRequest;
  const spaceId = Number(route.params.spaceId);
  behaviorOptions.value = [];
  behaviorError.value = "";
  if (!Number.isSafeInteger(spaceId) || spaceId <= 0) {
    behaviorError.value = "空间标识无效";
    return;
  }
  behaviorLoading.value = true;
  try {
    const options = await fetchScheduleBehaviorOptions(spaceId, getListOntologyActionInterface);
    if (requestId === behaviorRequest) behaviorOptions.value = options;
  } catch (cause) {
    if (requestId === behaviorRequest) behaviorError.value = cause instanceof Error ? cause.message : "行为列表加载失败";
  } finally {
    if (requestId === behaviorRequest) behaviorLoading.value = false;
  }
}

watch(
  () => route.params.spaceId,
  () => {
    scheduleSaveRequest += 1;
    scheduleDetailRequest += 1;
    createStatus.value = "idle";
    behaviorRequest += 1;
    behaviorLoading.value = false;
    void fetchBehaviorOptions();
    schedules.value = [];
    schedulePage.value = 1;
    scheduleTotal.value = 0;
    void fetchScheduleList(true);
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  scheduleSaveRequest += 1;
  scheduleDetailRequest += 1;
  behaviorRequest += 1;
  scheduleListRequest += 1;
});
const filteredSchedules = computed(() => schedules.value);

/** @description 应用调度名称和策略筛选条件。 */
function applyFilters() {
  appliedKeyword.value = keyword.value.trim();
  appliedStrategy.value = strategy.value;
  schedulePage.value = 1;
  void fetchScheduleList(true);
}
/** @description 清空调度列表筛选条件。 */
function resetFilters() {
  keyword.value = "";
  strategy.value = "";
  applyFilters();
}
/** @description 翻页时保留已应用的筛选条件并替换旧查询。 @param page 目标页码。 */
function changeSchedulePage(page: number): void {
  if (!Number.isSafeInteger(page) || page < 1 || page === schedulePage.value) return;
  schedulePage.value = page;
  void fetchScheduleList(true);
}
/** @description 修改每页条数并回到第一页。 @param size 每页条数。 */
function changeSchedulePageSize(size: number): void {
  if (![10, 20, 50, 100].includes(size) || size === schedulePageSize.value) return;
  schedulePageSize.value = size;
  schedulePage.value = 1;
  void fetchScheduleList(true);
}
/**
 * @description 打开新建调度弹窗。
 */
function openCreateScheduleDialog() {
  if (createStatus.value === "submitting") return;
  createStatus.value = "idle";
  formMode.value = "create";
  formDraft.value = null;
  editingScheduleId.value = "";
  formVisible.value = true;
}

/**
 * @description 从表格行解析出当前调度记录。
 * @param row Element Plus 表格当前行。
 * @returns 列表中的调度记录。
 */
function readScheduleTableRow(row: unknown): BehaviorScheduleRecord {
  if (row && typeof row === "object" && "id" in row && typeof row.id === "string") {
    const matched = schedules.value.find((item) => item.id === row.id);
    if (matched) return matched;
  }
  throw new Error("无效的调度数据行。");
}

/**
 * @description 打开只读查看调度弹窗，回填当前行数据。
 * @param row 列表当前行。
 * @returns 详情加载完成。
 */
async function openViewScheduleDialog(row: unknown): Promise<void> {
  if (createStatus.value === "submitting") return;
  await loadScheduleDetail(readScheduleTableRow(row), "view");
}

/**
 * @description 打开编辑调度弹窗，回填当前行数据。
 * @param row 列表当前行。
 * @returns 详情加载完成。
 */
async function openEditScheduleDialog(row: unknown): Promise<void> {
  if (createStatus.value === "submitting") return;
  await loadScheduleDetail(readScheduleTableRow(row), "edit");
}

/** @description 查询详情后打开查看或编辑弹窗，忽略过期响应。 @param record 列表记录。 @param mode 弹窗模式。 @returns 查询完成。 */
async function loadScheduleDetail(record: BehaviorScheduleRecord, mode: "view" | "edit"): Promise<void> {
  if (record.detailsAvailable !== false) {
    formMode.value = mode;
    formDraft.value = mapScheduleRecordToDraft(record);
    editingScheduleId.value = mode === "edit" ? record.id : "";
    formVisible.value = true;
    return;
  }
  const requestId = ++scheduleDetailRequest;
  createStatus.value = "submitting";
  try {
    const response = await getBehaviorSchedulingDetailInterface({ id: Number(record.id), type: record.strategy === "周期调度" ? "TASK" : "RULE" });
    if (requestId !== scheduleDetailRequest) return;
    if ((response.code !== 200 && response.code !== 0) || response.success === false || !response.data)
      throw new Error(response.message?.trim() || "调度详情加载失败");
    const detail = response.data;
    const taskDetail = detail.taskVO ?? detail.ruleVO;
    const draft = mapScheduleRecordToDraft({
      ...record,
      name: detail.schedulingName,
      description: detail.description,
      target: detail.ontologyName || record.target,
      behavior: detail.actionName,
      behaviorActionApi: detail.actionApi,
      behaviorOntologyIdentifier: detail.ontologyIdentifier,
      cronExpression: taskDetail?.taskCronExpression || "",
      detailsAvailable: true,
    });
    draft.periodKind = "Cron";
    draft.savedEntityJson = taskDetail?.entityJson || "";
    formMode.value = mode;
    formDraft.value = draft;
    editingScheduleId.value = mode === "edit" ? record.id : "";
    formVisible.value = true;
  } catch (cause) {
    if (requestId === scheduleDetailRequest) ElMessage.error(cause instanceof Error ? cause.message : "调度详情加载失败");
  } finally {
    if (requestId === scheduleDetailRequest) createStatus.value = "idle";
  }
}

/**
 * @description 打开当前调度的调用日志弹窗。
 * @param row 列表当前行。
 */
function openInvocationLogDialog(row: unknown) {
  const record = readScheduleTableRow(row);
  logScheduleName.value = record.name;
  invocationLogs.value = record.detailsAvailable === false ? [] : createMockInvocationLogs(record);
  logVisible.value = true;
}

/**
 * @description 打开删除调度确认弹窗。
 * @param row 列表当前行。
 */
function openDeleteScheduleDialog(row: unknown) {
  const record = readScheduleTableRow(row);
  deleteStatus.value = "idle";
  deletingScheduleId.value = record.id;
  deletingScheduleName.value = record.name;
  deleteVisible.value = true;
}

/**
 * @description 按调度生成调用日志样例；首条调度使用原型中的三条记录。
 * @param record 当前调度记录。
 * @returns 调用日志列表。
 */
function createMockInvocationLogs(record: BehaviorScheduleRecord): BehaviorScheduleInvocationLog[] {
  if (record.id === "schedule-1") {
    return [
      { id: "log-1-1", name: "威胁响应行为树", invokedAt: "2026-09-03 08:12:16", status: "成功" },
      { id: "log-1-2", name: "威胁响应行为树", invokedAt: "2026-09-03 10:05:41", status: "失败" },
      { id: "log-1-3", name: "威胁响应行为树", invokedAt: "2026-09-03 14:20:08", status: "执行中" },
    ];
  }
  if (!record.behavior) return [];
  const invokedAtSamples = ["2026-09-03 08:12:16", "2026-09-03 10:05:41", "2026-09-03 14:20:08"] as const;
  return BEHAVIOR_SCHEDULE_INVOCATION_STATUSES.map((status, index) => ({
    id: `${record.id}-log-${index + 1}`,
    name: record.behavior,
    invokedAt: invokedAtSamples[index] ?? invokedAtSamples[0],
    status,
  }));
}

/**
 * @description 将列表记录转换为表单草稿，避免与列表共用数组引用。
 * @param record 当前调度记录。
 * @returns 查看或编辑弹窗草稿。
 */
function mapScheduleRecordToDraft(record: BehaviorScheduleRecord): BehaviorScheduleDraft {
  return {
    savedEntityJson: record.savedEntityJson,
    behaviorOntologyIdentifier: record.behaviorOntologyIdentifier,
    name: record.name,
    strategy: record.strategy,
    periodKind: record.periodKind,
    weekdays: [...record.weekdays],
    monthDay: record.monthDay,
    executeTime: record.executeTime,
    cronExpression: record.cronExpression,
    target: record.target,
    instance: record.instance,
    behavior: record.behavior,
    behaviorId: record.behaviorId,
    behaviorActionApi: record.behaviorActionApi,
    behaviorParameters: record.behaviorParameters ? cloneBehaviorParameterSnapshot(record.behaviorParameters) : null,
    description: record.description,
    ruleFlow: record.ruleFlow ? cloneScheduleRuleFlow(record.ruleFlow) : null,
  };
}

/**
 * @description 将日期格式化为列表使用的创建时间文案。
 * @param date 当前时间。
 * @returns `YYYY-MM-DD HH:mm`。
 */
function formatScheduleCreatedAt(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}`;
}

/**
 * @description 按模式处理调度，周期新建等待保存接口，其他模式保留现有流程。
 * @param draft 弹窗提交的草稿。
 * @param request 周期新建时的完整创建参数。
 * @returns 操作完成。
 */
async function submitScheduleForm(draft: BehaviorScheduleDraft, request?: CreateBehaviorScheduleParams): Promise<void> {
  if (formMode.value === "edit") {
    submitEditSchedule(draft);
    return;
  }
  await submitCreateSchedule(draft, request);
}

/**
 * @description 周期调度保存成功后刷新真实列表；失败保留表单并展示后端提示，忽略过期响应。
 * @param draft 弹窗提交的草稿。
 * @param request 周期调度创建参数。
 * @returns 操作完成。
 */
async function submitCreateSchedule(draft: BehaviorScheduleDraft, request?: CreateBehaviorScheduleParams): Promise<void> {
  if (createStatus.value === "submitting") return;
  if (draft.strategy === "周期调度" && !request) {
    createStatus.value = "error";
    ElMessage.error("缺少调度创建参数，请检查行为参数后重试");
    return;
  }
  createStatus.value = "submitting";
  const requestId = ++scheduleSaveRequest;
  let successMessage = "新建调度成功";
  if (draft.strategy === "周期调度" && request) {
    try {
      const response = await postCreateBehaviorScheduleInterface(request);
      if (requestId !== scheduleSaveRequest) return;
      if (response.code !== 200 || response.success === false) throw new Error(response.message?.trim() || "新建调度失败");
      successMessage = response.message?.trim() || successMessage;
    } catch (cause) {
      if (requestId !== scheduleSaveRequest) return;
      createStatus.value = "error";
      ElMessage.error(cause instanceof Error ? cause.message : "新建调度失败，请稍后重试");
      return;
    }
  }
  if (draft.strategy !== "周期调度") {
    const nextRecord: BehaviorScheduleRecord = {
      ...draft,
      id: `schedule-${Date.now()}`,
      name: draft.name.trim(),
      weekdays: [...draft.weekdays],
      description: draft.description.trim(),
      ruleFlow: draft.ruleFlow ? cloneScheduleRuleFlow(draft.ruleFlow) : null,
      createdAt: formatScheduleCreatedAt(new Date()),
    };
    schedules.value = [nextRecord, ...schedules.value];
  }
  createStatus.value = "success";
  formVisible.value = false;
  ElMessage.success(successMessage);
  createStatus.value = "idle";
  if (draft.strategy === "周期调度") await fetchScheduleList(true);
}

/**
 * @description 校验通过后用草稿覆盖当前调度记录，保留标识和创建时间。
 * @param draft 弹窗提交的草稿。
 */
function submitEditSchedule(draft: BehaviorScheduleDraft) {
  if (createStatus.value === "submitting") return;
  const targetId = editingScheduleId.value;
  if (!targetId) {
    createStatus.value = "error";
    ElMessage.error("未找到待编辑的调度");
    return;
  }
  createStatus.value = "submitting";
  schedules.value = schedules.value.map((item) => {
    if (item.id !== targetId) return item;
    return {
      ...item,
      ...draft,
      id: item.id,
      createdAt: item.createdAt,
      name: draft.name.trim(),
      weekdays: [...draft.weekdays],
      description: draft.description.trim(),
      ruleFlow: draft.ruleFlow ? cloneScheduleRuleFlow(draft.ruleFlow) : null,
    };
  });
  createStatus.value = "success";
  formVisible.value = false;
  editingScheduleId.value = "";
  ElMessage.success("编辑调度成功");
  createStatus.value = "idle";
}

/**
 * @description 确认后从本地列表移除当前调度，避免重复提交。
 */
function confirmDeleteSchedule() {
  if (deleteStatus.value === "submitting") return;
  const targetId = deletingScheduleId.value;
  if (!targetId) {
    deleteStatus.value = "error";
    ElMessage.error("未找到待删除的调度");
    return;
  }
  deleteStatus.value = "submitting";
  schedules.value = schedules.value.filter((item) => item.id !== targetId);
  deleteStatus.value = "success";
  deleteVisible.value = false;
  deletingScheduleId.value = "";
  deletingScheduleName.value = "";
  ElMessage.success("删除调度成功");
  deleteStatus.value = "idle";
}
</script>

<style scoped lang="scss">
.behavior-schedule-workspace__pagination {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.behavior-schedule-workspace {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  width: 100%;
  height: 100%;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.behavior-schedule-workspace__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 8px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow: inset 0 0 18px var(--aircas-color-page-glow);
}

:root:not(.dark) .behavior-schedule-workspace__toolbar {
  background: linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}
.behavior-schedule-workspace__filters {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  gap: 8px;
}
.behavior-schedule-workspace__keyword {
  width: min(220px, 24vw);
}
.behavior-schedule-workspace__strategy {
  width: 140px;
}
.behavior-schedule-workspace__table-wrap {
  min-width: 0;
  min-height: 0;
  flex: 1;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
}
.behavior-schedule-workspace__table {
  width: 100%;
  height: 100%;
}
.behavior-schedule-workspace__name {
  color: var(--aircas-color-text-primary);
  font-weight: 600;
}
.behavior-schedule-workspace__row-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}
</style>
