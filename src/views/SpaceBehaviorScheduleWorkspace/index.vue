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
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-switch
              style="--el-switch-off-color: var(--aircas-color-danger)"
              :model-value="row.status"
              active-value="START"
              inactive-value="STOP"
              active-text="启用"
              inactive-text="停止"
              inline-prompt
              :width="60"
              ariaLabel="调度启停状态"
              :loading="pendingScheduleStatusIds.includes(row.id)"
              :disabled="(row.status !== 'START' && row.status !== 'STOP') || pendingScheduleStatusIds.includes(row.id)"
              @change="toggleScheduleStatus(row)"
            />
          </template>
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
    <BehaviorScheduleInvocationLogDialog
      v-model="logVisible"
      :schedule-name="logScheduleName"
      :logs="invocationLogs"
      :loading="logLoading"
      :error="logError"
      :page="logPage"
      :page-size="logPageSize"
      :total="logTotal"
      @retry="fetchInvocationLogs()"
      @change-page="changeInvocationLogPage"
      @change-page-size="changeInvocationLogPageSize"
    />
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
  deleteBehaviorSchedulingInterface,
  getBehaviorSchedulingDetailInterface,
  getBehaviorSchedulingResultInterface,
  getListBehaviorSchedulingInterface,
  getListOntologyActionInterface,
  putUpdateBehaviorSchedulingInterface,
  postStartBehaviorSchedulingInterface,
  postStopBehaviorSchedulingInterface,
  postCreateBehaviorScheduleInterface,
} from "@/apis";
import { restoreSchedulePeriod } from "./utils/restoreSchedulePeriod";
import { fetchBehaviorSchedules } from "./utils/fetchBehaviorSchedules";
import { fetchScheduleBehaviorOptions } from "@/views/SpaceBehaviorScheduleWorkspace/utils/fetchScheduleBehaviorOptions";
import { Plus, Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

import {
  type BehaviorScheduleCommandStatus,
  type BehaviorScheduleDraft,
  type BehaviorScheduleFormMode,
  type BehaviorSchedulingResultRecord,
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
const invocationLogs = ref<BehaviorSchedulingResultRecord[]>([]);
const logLoading = ref(false);
const logError = ref("");
const logPage = ref(1);
const logPageSize = ref(10);
const logTotal = ref(0);
const logScheduleId = ref("");
const logScheduleType = ref<"TASK" | "RULE">("TASK");
let logRequest = 0;
const deleteVisible = ref(false);
const deletingScheduleId = ref("");
const deletingScheduleName = ref("");
const deletingScheduleType = ref<"TASK" | "RULE">("TASK");
let scheduleDeleteRequest = 0;
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
const pendingScheduleStatusIds = ref<string[]>([]);
const pendingScheduleStatuses = new Map<string, { record: BehaviorScheduleRecord; originalStatus: "START" | "STOP" }>();
let scheduleStatusSession = 0;
const scheduleListLoading = ref(false);
const scheduleListError = ref("");

/** @description 获取真实调度列表，支持失败重试，阻止重复请求及过期响应覆盖。 @param force 是否替换正在进行的旧查询。 @returns 查询完成。 */
async function fetchScheduleList(force = false): Promise<void> {
  if (scheduleListLoading.value && !force) return;
  cancelScheduleStatusUpdates();
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

/** @description 刷新列表或卸载前恢复未确认状态，使旧响应失效。 */
function cancelScheduleStatusUpdates(): void {
  scheduleStatusSession += 1;
  for (const { record, originalStatus } of pendingScheduleStatuses.values()) record.status = originalStatus;
  pendingScheduleStatuses.clear();
  pendingScheduleStatusIds.value = [];
}

/** @description 乐观切换当前行启停状态，失败恢复原值；同一行防重复并忽略过期响应。 @param row 当前表格行。 @returns 状态操作完成。 */
async function toggleScheduleStatus(row: unknown): Promise<void> {
  const record = readScheduleTableRow(row);
  if (scheduleListLoading.value || pendingScheduleStatuses.has(record.id) || (record.status !== "START" && record.status !== "STOP")) return;
  const id = Number(record.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    ElMessage.error("调度标识无效，无法切换状态");
    return;
  }
  const session = scheduleStatusSession;
  const originalStatus = record.status;
  const nextStatus = originalStatus === "START" ? "STOP" : "START";
  pendingScheduleStatuses.set(record.id, { record, originalStatus });
  pendingScheduleStatusIds.value = [...pendingScheduleStatusIds.value, record.id];
  record.status = nextStatus;
  const params = { type: record.strategy === "周期调度" ? ("TASK" as const) : ("RULE" as const), id };
  try {
    const response = await (nextStatus === "START" ? postStartBehaviorSchedulingInterface(params) : postStopBehaviorSchedulingInterface(params));
    if (session !== scheduleStatusSession) return;
    if ((response.code !== 200 && response.code !== 0) || response.success === false) throw new Error(response.message?.trim() || "调度状态切换失败");
    ElMessage.success(response.message?.trim() || (nextStatus === "START" ? "启用调度成功" : "停用调度成功"));
  } catch (cause) {
    if (session !== scheduleStatusSession) return;
    record.status = originalStatus;
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "调度状态切换失败，请重试");
  } finally {
    if (session === scheduleStatusSession) {
      pendingScheduleStatuses.delete(record.id);
      pendingScheduleStatusIds.value = pendingScheduleStatusIds.value.filter((item) => item !== record.id);
    }
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
    logRequest += 1;
    logVisible.value = false;
    invocationLogs.value = [];
    logLoading.value = false;
    scheduleDeleteRequest += 1;
    deleteStatus.value = "idle";
    deleteVisible.value = false;
    deletingScheduleId.value = "";
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
  logRequest += 1;
  cancelScheduleStatusUpdates();
  scheduleDeleteRequest += 1;
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
    Object.assign(draft, restoreSchedulePeriod(detail.periodType || taskDetail?.periodType, taskDetail?.taskCronExpression || ""));
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

/** @description 打开调用日志并查询当前调度的最新第一页。 @param row 当前调度行。 */
function openInvocationLogDialog(row: unknown): void {
  const record = readScheduleTableRow(row);
  if (logVisible.value && logScheduleId.value === record.id && logLoading.value) return;
  logRequest += 1;
  logLoading.value = false;
  logScheduleName.value = record.name;
  logScheduleId.value = record.id;
  logScheduleType.value = record.strategy === "周期调度" ? "TASK" : "RULE";
  logPage.value = 1;
  logPageSize.value = 10;
  logTotal.value = 0;
  invocationLogs.value = [];
  logVisible.value = true;
  void fetchInvocationLogs(true);
}

watch(
  logVisible,
  (visible) => {
    if (!visible) {
      logRequest += 1;
      logLoading.value = false;
      invocationLogs.value = [];
      logError.value = "";
      logTotal.value = 0;
    }
  },
  { flush: "sync" },
);

/** @description 加载当前日志页，支持重试并防止重复请求及过期响应。 @param force 是否替换旧查询。 @returns 日志查询完成。 */
async function fetchInvocationLogs(force = false): Promise<void> {
  if (!logVisible.value || (logLoading.value && !force)) return;
  const requestId = ++logRequest;
  const id = Number(logScheduleId.value);
  invocationLogs.value = [];
  logError.value = "";
  if (!Number.isSafeInteger(id) || id <= 0) {
    logError.value = "调度标识无效，无法查询调用日志";
    logLoading.value = false;
    return;
  }
  logLoading.value = true;
  const page = logPage.value;
  try {
    const response = await getBehaviorSchedulingResultInterface({ id, type: logScheduleType.value, pageNum: page, pageSize: logPageSize.value });
    if (requestId !== logRequest || !logVisible.value) return;
    if ((response.code !== 200 && response.code !== 0) || response.success === false || !response.data)
      throw new Error(response.message?.trim() || "调用日志查询失败");
    const data = response.data;
    if (
      !Array.isArray(data.records) ||
      !Number.isSafeInteger(data.total) ||
      data.total < 0 ||
      !Number.isSafeInteger(data.size) ||
      data.size <= 0 ||
      data.current !== page
    )
      throw new Error("调用日志分页数据无效");
    invocationLogs.value = data.records;
    logTotal.value = data.total;
  } catch (cause) {
    if (requestId === logRequest && logVisible.value)
      logError.value = cause instanceof Error && cause.message.trim() ? cause.message : "调用日志查询失败，请重试";
  } finally {
    if (requestId === logRequest) logLoading.value = false;
  }
}

/** @description 日志翻页并保留目标调度。 @param page 页码。 */
function changeInvocationLogPage(page: number): void {
  if (!Number.isSafeInteger(page) || page < 1 || page === logPage.value) return;
  logPage.value = page;
  void fetchInvocationLogs(true);
}

/** @description 修改日志每页条数并回到第一页。 @param size 每页条数。 */
function changeInvocationLogPageSize(size: number): void {
  if (![10, 20, 50, 100].includes(size) || size === logPageSize.value) return;
  logPageSize.value = size;
  logPage.value = 1;
  void fetchInvocationLogs(true);
}

/**
 * @description 打开删除调度确认弹窗。
 * @param row 列表当前行。
 */
function openDeleteScheduleDialog(row: unknown) {
  if (deleteStatus.value === "submitting") return;
  const record = readScheduleTableRow(row);
  deleteStatus.value = "idle";
  deletingScheduleType.value = record.strategy === "周期调度" ? "TASK" : "RULE";
  deletingScheduleId.value = record.id;
  deletingScheduleName.value = record.name;
  deleteVisible.value = true;
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
    await submitEditSchedule(draft, request);
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

/** @description 保存周期调度编辑，失败保留草稿重试，成功刷新当前列表，忽略过期响应。 @param draft 已校验草稿。 @param request 完整周期配置。 @returns 保存和刷新完成。 */
async function submitEditSchedule(draft: BehaviorScheduleDraft, request?: CreateBehaviorScheduleParams): Promise<void> {
  if (createStatus.value === "submitting") return;
  if (draft.strategy !== "周期调度") {
    createStatus.value = "error";
    ElMessage.error("规则调度画布与接口条件尚无转换约定，暂不支持保存");
    return;
  }
  const targetId = Number(editingScheduleId.value);
  if (!Number.isSafeInteger(targetId) || targetId <= 0 || !request) {
    createStatus.value = "error";
    ElMessage.error(!request ? "缺少调度编辑参数，请检查行为参数后重试" : "未找到有效的待编辑调度");
    return;
  }
  const requestId = ++scheduleSaveRequest;
  createStatus.value = "submitting";
  try {
    const response = await putUpdateBehaviorSchedulingInterface({ ...request, id: targetId });
    if (requestId !== scheduleSaveRequest) return;
    if ((response.code !== 200 && response.code !== 0) || response.success === false) throw new Error(response.message?.trim() || "编辑调度失败");
    createStatus.value = "success";
    formVisible.value = false;
    editingScheduleId.value = "";
    ElMessage.success(response.message?.trim() || "编辑调度成功");
    createStatus.value = "idle";
    await fetchScheduleList(true);
  } catch (cause) {
    if (requestId !== scheduleSaveRequest) return;
    createStatus.value = "error";
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "编辑调度失败，请重试");
  }
}

/** @description 用户二次确认后删除调度并刷新分页，失败保留弹窗重试，忽略空间切换或卸载后的响应。 @returns 删除及列表刷新完成。 */
async function confirmDeleteSchedule(): Promise<void> {
  if (!deleteVisible.value || deleteStatus.value === "submitting") return;
  const targetId = Number(deletingScheduleId.value);
  if (!Number.isSafeInteger(targetId) || targetId <= 0) {
    deleteStatus.value = "error";
    ElMessage.error("未找到有效的待删除调度");
    return;
  }
  const requestId = ++scheduleDeleteRequest;
  deleteStatus.value = "submitting";
  try {
    const response = await deleteBehaviorSchedulingInterface({ type: deletingScheduleType.value, id: targetId });
    if (requestId !== scheduleDeleteRequest) return;
    if ((response.code !== 200 && response.code !== 0) || response.success === false) throw new Error(response.message?.trim() || "删除调度失败");
    deleteStatus.value = "success";
    deleteVisible.value = false;
    deletingScheduleId.value = "";
    deletingScheduleName.value = "";
    ElMessage.success(response.message?.trim() || "删除调度成功");
    if (schedules.value.length === 1 && schedulePage.value > 1) schedulePage.value -= 1;
    await fetchScheduleList(true);
  } catch (cause) {
    if (requestId !== scheduleDeleteRequest) return;
    deleteStatus.value = "error";
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "删除调度失败，请重试");
  } finally {
    if (requestId === scheduleDeleteRequest && deleteStatus.value === "success") deleteStatus.value = "idle";
  }
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
