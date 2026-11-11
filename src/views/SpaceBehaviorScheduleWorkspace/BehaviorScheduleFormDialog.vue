<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog behavior-schedule-form-dialog"
    :title="dialogTitle"
    width="min(960px, 94vw)"
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
          <p class="behavior-schedule-form-dialog__hint">支持标准 5 段或 Quartz 6 / 7 段，提交时统一为 Quartz 7 段；日期与星期不可同时约束</p>
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
        <el-form-item label="行为">
          <el-select
            :model-value="selectedBehaviorValue"
            filterable
            @update:model-value="selectScheduleBehavior"
            class="aircas-select"
            popper-class="aircas-select-popper"
            placeholder="请选择行为"
            :loading="behaviorLoading"
            :no-data-text="behaviorError || '当前空间暂无已发布的非基础行为'"
            style="width: 100%"
            :disabled="formDisabled"
          >
            <el-option
              v-if="draft.behaviorActionApi && !selectedBehaviorOption"
              :label="`${draft.behavior || draft.behaviorActionApi} (${draft.behaviorActionApi})`"
              :value="selectedBehaviorValue"
              disabled
            />
            <el-option v-for="item in behaviorOptions" :key="item.id" :label="`${item.displayName} (${item.actionApi})`" :value="item.id" />
          </el-select>
          <p v-if="behaviorError" role="alert" class="behavior-schedule-form-dialog__error">
            {{ behaviorError }} <el-button link @click="emit('retry-behaviors')">重试</el-button>
          </p>
        </el-form-item>
        <section class="behavior-schedule-form-dialog__parameters" aria-label="行为参数">
          <h3 class="behavior-schedule-form-dialog__parameters-title">行为参数</h3>
          <BehaviorParameterConfig v-if="draft.behaviorActionApi" :controller="parameterConfig" :readonly="formDisabled" />
        </section>
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
    <el-button v-if="parameterRestoreError" link @click="initializeScheduleParameters">重新加载行为参数</el-button>
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
import BehaviorParameterConfig from "@/components/BehaviorParameterConfig/BehaviorParameterConfig.vue";
import { useBehaviorParameters } from "@/composables/behavior/useBehaviorParameters";
import { cloneBehaviorParameterSnapshot } from "@/utils/behaviorParameters/cloneBehaviorParameterSnapshot";
import {
  getOntologyActionInfoInterface,
  getOntologyEntitiesInterface,
  getOntologyLinkByUniqueIdentifierInterface,
  postGetOntologyEntityRowDetailPageInterface,
} from "@/apis";
import type { CreateBehaviorScheduleParams, ScheduleBehaviorOption } from "@/types";
import { restoreScheduleBehaviorParameters } from "./utils/restoreScheduleBehaviorParameters";
import { buildBehaviorScheduleCreateParams } from "./utils/buildBehaviorScheduleCreateParams";
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
  spaceId: string;
  mode: BehaviorScheduleFormMode;
  initialDraft: BehaviorScheduleDraft | null;
  behaviorOptions: readonly ScheduleBehaviorOption[];
  behaviorLoading: boolean;
  behaviorError: string;
  submitting: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [draft: BehaviorScheduleDraft, request?: CreateBehaviorScheduleParams];
  "retry-behaviors": [];
}>();

const draft = reactive<BehaviorScheduleDraft>(createEmptyScheduleDraft());
const selectedBehaviorOption = computed(() =>
  props.behaviorOptions.find((item) => (draft.behaviorActionApi ? item.actionApi === draft.behaviorActionApi : item.id === draft.behaviorId)),
);
const selectedBehaviorValue = computed(() => selectedBehaviorOption.value?.id ?? (draft.behaviorActionApi ? `saved:${draft.behaviorActionApi}` : ""));
const parameterRestoreError = ref("");
const parameterContext = reactive({
  /** @description 提供当前空间，保持参数加载上下文随页面更新。 @returns 空间标识。 */
  get spaceId() {
    return props.spaceId;
  },
  /** @description 将调度选择转换为共用参数配置上下文。 @returns 当前行为或空值。 */
  get behavior() {
    if (!draft.behaviorActionApi) return null;
    const option = selectedBehaviorOption.value;
    return {
      id: draft.behaviorId ?? "",
      kind: "application" as const,
      valueType: "attributeValue" as const,
      basicAction: "" as const,
      behaviorApiName: draft.behaviorActionApi,
      ontologyUniqIdentifier: option?.ontologyUniqIdentifier || draft.behaviorOntologyIdentifier || "",
    };
  },
});
const parameterConfig = useBehaviorParameters(parameterContext, {
  getOntologyActionInfoInterface,
  getOntologyEntitiesInterface,
  getOntologyLinkByUniqueIdentifierInterface,
  postGetOntologyEntityRowDetailPageInterface,
});
let parameterSession = 0;
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

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      parameterSession += 1;
      parameterConfig.cancelParameterRequests();
      parameterConfig.clearDetailParamState();
      parameterConfig.clearRelationTestState();
      return;
    }
    validationError.value = "";
    hydratingScheduleDraft.value = true;
    Object.assign(draft, cloneScheduleDraft(props.mode === "create" ? null : props.initialDraft));
    void initializeScheduleParameters();
    void nextTick(() => {
      hydratingScheduleDraft.value = false;
    });
  },
  { immediate: true },
);

/** @description 按稳定标识切换调度行为，并丢弃旧行为参数。 @param value 行为标识。 */
function selectScheduleBehavior(value: string | number | boolean | undefined): void {
  if (formDisabled.value) return;
  const option = props.behaviorOptions.find((item) => item.id === value);
  if (!option || option.actionApi === draft.behaviorActionApi) return;
  draft.behaviorId = option.id;
  draft.behavior = option.displayName;
  draft.behaviorActionApi = option.actionApi;
  draft.behaviorOntologyIdentifier = option.ontologyUniqIdentifier;
  draft.behaviorParameters = null;
  draft.savedEntityJson = "";
  void initializeScheduleParameters();
}
/** @description 加载参数并恢复相同行为的配置，关闭或切换时忽略过期会话。 */
async function initializeScheduleParameters(): Promise<void> {
  const session = ++parameterSession;
  parameterConfig.cancelParameterRequests();
  parameterConfig.clearDetailParamState();
  parameterConfig.clearRelationTestState();
  parameterRestoreError.value = "";
  validationError.value = "";
  if (!props.modelValue || !draft.behaviorActionApi) return;
  const snapshot = draft.behaviorParameters;
  const savedJson = draft.savedEntityJson;
  await parameterConfig.loadApplicationTestForm();
  if (session !== parameterSession || !props.modelValue) return;
  if (parameterConfig.detailError.value) parameterRestoreError.value = parameterConfig.detailError.value;
  else if (snapshot) {
    if (!parameterConfig.restoreParameterSnapshot(snapshot)) parameterRestoreError.value = "已保存参数与当前行为不匹配，请重新配置";
  } else if (savedJson) parameterRestoreError.value = restoreScheduleBehaviorParameters(parameterConfig, savedJson, props.spaceId, draft.behaviorActionApi);
  validationError.value = parameterRestoreError.value;
}

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
    behaviorId: "",
    behaviorActionApi: "",
    behaviorParameters: null,
    savedEntityJson: "",
    behaviorOntologyIdentifier: "",
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
    behaviorParameters: value.behaviorParameters ? cloneBehaviorParameterSnapshot(value.behaviorParameters) : null,
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
  if (!value.behavior) return "请选择行为";
  return "";
}

/**
 * @description 校验调度草稿及行为参数，新建周期调度输出参数后提交；查看模式或提交中忽略。
 */
function submitCreateScheduleForm() {
  if (props.mode === "view" || props.submitting) return;
  const error = parameterRestoreError.value || readCreateScheduleFormError(draft);
  validationError.value = error;
  if (error) return;
  let createRequest: CreateBehaviorScheduleParams | undefined;
  if (draft.strategy === "周期调度") {
    if (props.mode === "create") {
      const unfilledParam = parameterConfig.paramRows.value.find((row) => !(parameterConfig.paramValues[row.paramName] ?? "").trim());
      if (unfilledParam) {
        validationError.value = `请填写行为参数「${unfilledParam.propertyDisplayName || unfilledParam.paramName}」`;
        return;
      }
    }
    const result = parameterConfig.createParameterSnapshot();
    if (!result.ok) {
      validationError.value = result.error;
      return;
    }
    draft.behaviorParameters = result.snapshot;
    draft.behaviorId = selectedBehaviorOption.value?.id ?? draft.behaviorId;
    draft.savedEntityJson = "";
    if (props.mode === "create") {
      const option = selectedBehaviorOption.value;
      const assembled = buildBehaviorScheduleCreateParams(
        draft,
        parameterConfig.resolvedOntologyUniqIdentifier.value.trim() || option?.ontologyUniqIdentifier || "",
        result.snapshot.request,
      );
      if (!assembled.ok) {
        validationError.value = assembled.error;
        return;
      }
      createRequest = assembled.request;
      console.log("行为调度创建参数", createRequest);
    }
  }
  emit(
    "confirm",
    {
      ...draft,
      behaviorParameters: draft.behaviorParameters ? cloneBehaviorParameterSnapshot(draft.behaviorParameters) : null,
      weekdays: [...draft.weekdays],
      ruleFlow: draft.ruleFlow ? cloneScheduleRuleFlow(draft.ruleFlow) : null,
    },
    createRequest,
  );
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

.behavior-schedule-form-dialog__parameters {
  width: 100%;
  min-width: 0;
  margin: 4px 0 16px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
  box-sizing: border-box;
}

.behavior-schedule-form-dialog__parameters-title {
  margin: 0 0 12px;
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
