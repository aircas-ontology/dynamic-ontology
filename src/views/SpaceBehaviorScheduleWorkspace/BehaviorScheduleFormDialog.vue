<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog behavior-schedule-form-dialog"
    :title="dialogTitle"
    width="min(640px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form class="aircas-form behavior-schedule-form-dialog__form" label-position="top" :disabled="formDisabled" @submit.prevent>
      <el-form-item label="调度名称" required>
        <el-input v-model="draft.name" class="aircas-input" maxlength="64" placeholder="请输入调度名称" :disabled="formDisabled" />
      </el-form-item>
      <el-form-item label="调度策略" required>
        <el-radio-group :model-value="draft.strategy" class="aircas-radio-group" :disabled="formDisabled" @update:model-value="setScheduleStrategy">
          <el-radio class="aircas-radio" value="规则调度">规则调度</el-radio>
          <el-radio class="aircas-radio" value="周期调度">周期调度</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="draft.strategy === '规则调度'" label="规则配置">
        <el-button class="aircas-button aircas-button--tone-primary" native-type="button" :disabled="formDisabled" @click.stop="openRuleConfigDialog">
          {{ draft.ruleFlow ? "规则配置（已应用）" : "规则配置" }}
        </el-button>
      </el-form-item>

      <section v-else class="behavior-schedule-form-dialog__period" aria-label="周期配置">
        <h3 class="behavior-schedule-form-dialog__period-title">周期配置</h3>
        <el-form-item label="执行周期">
          <el-radio-group :model-value="draft.periodKind" class="aircas-radio-group" :disabled="formDisabled" @update:model-value="setSchedulePeriodKind">
            <el-radio-button v-for="kind in BEHAVIOR_SCHEDULE_PERIOD_KINDS" :key="kind" :value="kind">{{ kind }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="draft.periodKind === '每周'" label="执行日" required>
          <el-checkbox-group
            :model-value="draft.weekdays"
            class="behavior-schedule-form-dialog__weekdays"
            :disabled="formDisabled"
            @update:model-value="setScheduleWeekdays"
          >
            <el-checkbox v-for="day in BEHAVIOR_SCHEDULE_WEEKDAYS" :key="day" class="aircas-checkbox" :value="day">{{ day }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="draft.periodKind === '每月'" label="执行日期" required>
          <el-select
            v-model="draft.monthDay"
            class="aircas-select"
            popper-class="aircas-select-popper"
            placeholder="请选择每月执行日期"
            style="width: 100%"
            :disabled="formDisabled"
          >
            <el-option v-for="day in BEHAVIOR_SCHEDULE_MONTH_DAYS" :key="day" :label="`${day}日`" :value="day" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="draft.periodKind === 'Cron'" label="Cron 表达式" required>
          <el-input v-model="draft.cronExpression" class="aircas-input" placeholder="例如：0 8 * * *（每天 08:00）" :disabled="formDisabled" />
          <p class="behavior-schedule-form-dialog__hint">标准 5 段：分 时 日 月 周；兼容 6 段（含秒）</p>
        </el-form-item>
        <el-form-item v-else label="执行时间" required>
          <el-time-picker
            v-model="draft.executeTime"
            class="aircas-input behavior-schedule-form-dialog__time"
            popper-class="aircas-picker"
            format="HH:mm:ss"
            value-format="HH:mm:ss"
            :disabled="formDisabled"
          />
        </el-form-item>
      </section>

      <template v-if="draft.strategy === '周期调度'">
        <el-form-item label="关联对象">
          <el-select
            v-model="draft.target"
            class="aircas-select"
            popper-class="aircas-select-popper"
            placeholder="请选择关联对象"
            style="width: 100%"
            :disabled="formDisabled"
            @change="clearScheduleInstance"
          >
            <el-option v-for="item in objectOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="实例">
          <el-select
            v-model="draft.instance"
            class="aircas-select"
            popper-class="aircas-select-popper"
            placeholder="请先选择关联对象"
            style="width: 100%"
            :disabled="formDisabled || !draft.target"
          >
            <el-option v-for="item in visibleInstanceOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="行为">
          <el-select
            v-model="draft.behavior"
            class="aircas-select"
            popper-class="aircas-select-popper"
            placeholder="请选择行为"
            style="width: 100%"
            :disabled="formDisabled"
          >
            <el-option v-for="item in behaviorOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </template>

      <el-form-item label="描述">
        <el-input
          v-model="draft.description"
          class="aircas-input"
          type="textarea"
          :rows="3"
          maxlength="240"
          placeholder="可选，调度描述"
          :disabled="formDisabled"
        />
      </el-form-item>
    </el-form>
    <p v-if="validationError" class="behavior-schedule-form-dialog__error" role="alert">{{ validationError }}</p>
    <template #footer>
      <el-button class="aircas-button aircas-button--tone-ghost" :disabled="submitting" :icon="Close" @click="emit('update:modelValue', false)">{{
        closeButtonLabel
      }}</el-button>
      <el-button v-if="mode !== 'view'" class="aircas-button aircas-button--tone-primary" :loading="submitting" :icon="Plus" @click="submitCreateScheduleForm">
        确认
      </el-button>
    </template>
  </el-dialog>
  <BehaviorScheduleRuleConfigDialog v-model="ruleConfigVisible" :initial-flow="draft.ruleFlow" @apply="applyRuleFlowDocument" />
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { Close, Plus } from "@element-plus/icons-vue";

import {
  BEHAVIOR_SCHEDULE_MONTH_DAYS,
  BEHAVIOR_SCHEDULE_PERIOD_KINDS,
  BEHAVIOR_SCHEDULE_WEEKDAYS,
  DEFAULT_BEHAVIOR_SCHEDULE_EXECUTE_TIME,
  type BehaviorScheduleDraft,
  type BehaviorScheduleFormMode,
  type ScheduleRuleFlowDocument,
} from "@/types";
import { cloneScheduleRuleFlow } from "./utils/scheduleRuleFlowFactory";
import BehaviorScheduleRuleConfigDialog from "./BehaviorScheduleRuleConfigDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  mode: BehaviorScheduleFormMode;
  initialDraft: BehaviorScheduleDraft | null;
  objectOptions: readonly string[];
  instancesByTarget: Readonly<Record<string, readonly string[]>>;
  behaviorOptions: readonly string[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [draft: BehaviorScheduleDraft];
}>();

const draft = reactive<BehaviorScheduleDraft>(createEmptyScheduleDraft());
const validationError = ref("");
const hydratingScheduleDraft = ref(false);
const ruleConfigVisible = ref(false);
const formDisabled = computed(() => props.mode === "view" || props.submitting);
const dialogTitle = computed(() => {
  if (props.mode === "view") return "查看调度";
  if (props.mode === "edit") return "编辑调度";
  return "新建调度";
});
const closeButtonLabel = computed(() => (props.mode === "view" ? "关闭" : "取消"));

const visibleInstanceOptions = computed(() => props.instancesByTarget[draft.target] ?? []);

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    validationError.value = "";
    hydratingScheduleDraft.value = true;
    Object.assign(draft, cloneScheduleDraft(props.mode === "create" ? null : props.initialDraft));
    void nextTick(() => {
      hydratingScheduleDraft.value = false;
    });
  },
  { immediate: true },
);

/**
 * @description 生成空白新建调度草稿。
 * @returns 空白草稿。
 */
function createEmptyScheduleDraft(): BehaviorScheduleDraft {
  return {
    name: "",
    strategy: "规则调度",
    periodKind: "每天",
    weekdays: [],
    monthDay: null,
    executeTime: DEFAULT_BEHAVIOR_SCHEDULE_EXECUTE_TIME,
    cronExpression: "",
    target: "",
    instance: "",
    behavior: "",
    description: "",
    ruleFlow: null,
  };
}

/**
 * @description 复制调度草稿，避免查看弹窗与列表记录共用数组引用。
 * @param value 打开查看或编辑时的草稿；新建时为空。
 * @returns 可写入表单的草稿副本。
 */
function cloneScheduleDraft(value: BehaviorScheduleDraft | null): BehaviorScheduleDraft {
  if (!value) return createEmptyScheduleDraft();
  return {
    ...value,
    weekdays: [...value.weekdays],
    ruleFlow: value.ruleFlow ? cloneScheduleRuleFlow(value.ruleFlow) : null,
  };
}

/**
 * @description 将单选值写入调度策略。
 * @param value 单选组当前值。
 */
function setScheduleStrategy(value: string | number | boolean | undefined) {
  if (value === "规则调度" || value === "周期调度") {
    draft.strategy = value;
  }
}

/**
 * @description 将单选值写入执行周期。
 * @param value 单选组当前值。
 */
function setSchedulePeriodKind(value: string | number | boolean | undefined) {
  const nextKind = BEHAVIOR_SCHEDULE_PERIOD_KINDS.find((kind) => kind === value);
  if (nextKind) {
    draft.periodKind = nextKind;
  }
}

/**
 * @description 将复选值写入每周执行日。
 * @param value 复选组当前值。
 */
function setScheduleWeekdays(value: string | number | boolean | Array<string | number>) {
  const selected = Array.isArray(value) ? value : [];
  draft.weekdays = BEHAVIOR_SCHEDULE_WEEKDAYS.filter((day) => selected.includes(day));
}

/**
 * @description 用户切换关联对象时清空已选实例；回填草稿时跳过，避免冲掉回显实例。
 */
function clearScheduleInstance() {
  if (hydratingScheduleDraft.value) return;
  draft.instance = "";
}

/**
 * @description 打开规则配置全屏画布；查看模式忽略。
 */
function openRuleConfigDialog() {
  if (formDisabled.value) return;
  ruleConfigVisible.value = true;
}

/**
 * @description 把画布保存结果写入当前调度草稿。
 * @param doc 规则流文档。
 */
function applyRuleFlowDocument(doc: ScheduleRuleFlowDocument) {
  draft.ruleFlow = cloneScheduleRuleFlow(doc);
}

/**
 * @description 校验新建调度草稿并返回可展示错误文案。
 * @param value 当前草稿。
 * @returns 错误文案；通过时为空字符串。
 */
function readCreateScheduleFormError(value: BehaviorScheduleDraft): string {
  if (!value.name.trim()) return "请输入调度名称";
  if (value.strategy !== "周期调度") return "";
  if (value.periodKind === "每周" && value.weekdays.length === 0) return "请选择执行日";
  if (value.periodKind === "每月" && value.monthDay === null) return "请选择每月执行日期";
  if (value.periodKind === "Cron" && !value.cronExpression.trim()) return "请输入 Cron 表达式";
  if (value.periodKind !== "Cron" && !value.executeTime) return "请选择执行时间";
  if (!value.target) return "请选择关联对象";
  if (!value.behavior) return "请选择行为";
  return "";
}

/**
 * @description 校验通过后向父组件提交调度草稿，查看模式或提交中忽略。
 */
function submitCreateScheduleForm() {
  if (props.mode === "view" || props.submitting) return;
  const error = readCreateScheduleFormError(draft);
  validationError.value = error;
  if (error) return;
  emit("confirm", {
    ...draft,
    weekdays: [...draft.weekdays],
    ruleFlow: draft.ruleFlow ? cloneScheduleRuleFlow(draft.ruleFlow) : null,
  });
}
</script>

<style scoped lang="scss">
.behavior-schedule-form-dialog__form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.behavior-schedule-form-dialog__period {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
}

.behavior-schedule-form-dialog__period-title {
  margin: 0 0 4px;
  color: var(--aircas-color-title);
  font-size: 16px;
  font-weight: 700;
}

.behavior-schedule-form-dialog__weekdays {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
}

.behavior-schedule-form-dialog__time {
  width: 100%;
}

.behavior-schedule-form-dialog__hint {
  margin: 8px 0 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.behavior-schedule-form-dialog__error {
  margin: 8px 0 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
}
</style>
