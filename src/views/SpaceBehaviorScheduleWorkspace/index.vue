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
      <el-table :data="filteredSchedules" class="aircas-table aircas-table--flat behavior-schedule-workspace__table" height="100%" stripe>
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
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="300">
          <template #default="{ row }">
            <div class="behavior-schedule-workspace__row-actions">
              <el-button class="aircas-button aircas-button--tone-ghost" size="small" @click="openViewScheduleDialog(row)">查看</el-button>
              <el-button class="aircas-button aircas-button--tone-secondary" size="small" @click="openEditScheduleDialog(row)">编辑</el-button>
              <el-button class="aircas-button aircas-button--tone-ghost" size="small" @click="openInvocationLogDialog(row)">调用日志</el-button>
              <el-button class="aircas-button aircas-button--tone-danger" type="danger" size="small" @click="openDeleteScheduleDialog(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无调度" :image-size="72" /></template>
      </el-table>
    </div>

    <BehaviorScheduleFormDialog
      v-model="formVisible"
      :mode="formMode"
      :initial-draft="formDraft"
      :object-options="objectOptions"
      :instances-by-target="instancesByTarget"
      :behavior-options="behaviorOptions"
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
import { computed, ref } from "vue";
import { Plus, Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

import {
  BEHAVIOR_SCHEDULE_INVOCATION_STATUSES,
  DEFAULT_BEHAVIOR_SCHEDULE_EXECUTE_TIME,
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

const initialSchedules: BehaviorScheduleRecord[] = [
  createMockScheduleRecord({
    id: "schedule-1",
    name: "舰艇威胁响应调度",
    strategy: "规则调度",
    target: "驱逐舰 DDG-105",
    behavior: "威胁响应行为树",
    description: "检测到高威胁目标时触发响应策略",
    createdAt: "2026-08-12 09:30",
  }),
  createMockScheduleRecord({
    id: "schedule-2",
    name: "巡逻航线周期刷新",
    strategy: "周期调度",
    target: "驱逐舰 DDG-105",
    instance: "驱逐舰 DDG-105 实例-1",
    behavior: "巡逻航线规划",
    description: "按日周期刷新巡逻航线方案",
    createdAt: "2026-08-15 14:20",
  }),
  createMockScheduleRecord({
    id: "schedule-3",
    name: "高轨监视任务调度",
    strategy: "规则调度",
    target: "GSSAP-6 卫星",
    behavior: "高轨监视计划",
    description: "接近事件触发后启动监视任务",
    createdAt: "2026-08-18 11:05",
  }),
  createMockScheduleRecord({
    id: "schedule-4",
    name: "通信能力评估周期任务",
    strategy: "周期调度",
    periodKind: "每周",
    weekdays: ["周一"],
    target: "驱逐舰 DDG-105",
    instance: "驱逐舰 DDG-105 实例-1",
    behavior: "通信能力评估",
    description: "每周执行通信链路评估",
    createdAt: "2026-08-22 16:40",
  }),
  createMockScheduleRecord({
    id: "schedule-5",
    name: "轨迹关联规则调度",
    strategy: "规则调度",
    target: "驱逐舰 DDG-105",
    behavior: "轨迹关联",
    description: "多源航迹中实时触发关联算子",
    createdAt: "2026-08-26 10:15",
  }),
  createMockScheduleRecord({
    id: "schedule-6",
    name: "环境场周期采集",
    strategy: "周期调度",
    periodKind: "Cron",
    cronExpression: "0 * * * *",
    target: "海洋环境场",
    instance: "海洋环境场 实例-1",
    behavior: "海表风场采集",
    description: "按小时周期采集海表风场数据",
    createdAt: "2026-08-28 08:00",
  }),
  createMockScheduleRecord({
    id: "schedule-7",
    name: "机动事件响应调度",
    strategy: "规则调度",
    target: "USA-325 卫星",
    behavior: "机动事件分析",
    description: "检测到轨道机动后启动分析流程",
    createdAt: "2026-09-01 13:25",
  }),
];
const schedules = ref(initialSchedules);

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
const objectOptions = computed(() => [...new Set(schedules.value.map((item) => item.target))].filter(Boolean));
const behaviorOptions = computed(() => [...new Set(schedules.value.map((item) => item.behavior))].filter(Boolean));
const instancesByTarget = computed(() => {
  const options: Record<string, string[]> = {};
  for (const target of objectOptions.value) {
    options[target] = [`${target} 实例-1`, `${target} 实例-2`];
  }
  return options;
});
const filteredSchedules = computed(() =>
  schedules.value.filter(
    (item) => (!appliedKeyword.value || item.name.includes(appliedKeyword.value)) && (!appliedStrategy.value || item.strategy === appliedStrategy.value),
  ),
);

/** @description 应用调度名称和策略筛选条件。 */
function applyFilters() {
  appliedKeyword.value = keyword.value.trim();
  appliedStrategy.value = strategy.value;
}
/** @description 清空调度列表筛选条件。 */
function resetFilters() {
  keyword.value = "";
  strategy.value = "";
  applyFilters();
}
/**
 * @description 补齐样例调度记录中查看弹窗所需的表单字段。
 * @param record 列表展示字段及可选周期配置。
 * @returns 完整调度记录。
 */
function createMockScheduleRecord(
  record: Omit<BehaviorScheduleRecord, "periodKind" | "weekdays" | "monthDay" | "executeTime" | "cronExpression" | "instance" | "ruleFlow"> &
    Partial<Pick<BehaviorScheduleRecord, "periodKind" | "weekdays" | "monthDay" | "executeTime" | "cronExpression" | "instance" | "ruleFlow">>,
): BehaviorScheduleRecord {
  return {
    periodKind: "每天",
    weekdays: [],
    monthDay: null,
    executeTime: DEFAULT_BEHAVIOR_SCHEDULE_EXECUTE_TIME,
    cronExpression: "",
    instance: "",
    ruleFlow: null,
    ...record,
  };
}

/**
 * @description 打开新建调度弹窗。
 */
function openCreateScheduleDialog() {
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
 */
function openViewScheduleDialog(row: unknown) {
  formMode.value = "view";
  formDraft.value = mapScheduleRecordToDraft(readScheduleTableRow(row));
  editingScheduleId.value = "";
  formVisible.value = true;
}

/**
 * @description 打开编辑调度弹窗，回填当前行数据。
 * @param row 列表当前行。
 */
function openEditScheduleDialog(row: unknown) {
  createStatus.value = "idle";
  const record = readScheduleTableRow(row);
  formMode.value = "edit";
  formDraft.value = mapScheduleRecordToDraft(record);
  editingScheduleId.value = record.id;
  formVisible.value = true;
}

/**
 * @description 打开当前调度的调用日志弹窗。
 * @param row 列表当前行。
 */
function openInvocationLogDialog(row: unknown) {
  const record = readScheduleTableRow(row);
  logScheduleName.value = record.name;
  invocationLogs.value = createMockInvocationLogs(record);
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
 * @description 按弹窗模式把草稿写入本地列表，避免重复提交。
 * @param draft 弹窗提交的草稿。
 */
function submitScheduleForm(draft: BehaviorScheduleDraft) {
  if (formMode.value === "edit") {
    submitEditSchedule(draft);
    return;
  }
  submitCreateSchedule(draft);
}

/**
 * @description 校验通过后把新建调度写入本地列表，避免重复提交。
 * @param draft 弹窗提交的草稿。
 */
function submitCreateSchedule(draft: BehaviorScheduleDraft) {
  if (createStatus.value === "submitting") return;
  createStatus.value = "submitting";
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
  createStatus.value = "success";
  formVisible.value = false;
  ElMessage.success("新建调度成功");
  createStatus.value = "idle";
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

:root[theme="light"] .behavior-schedule-workspace__toolbar {
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
