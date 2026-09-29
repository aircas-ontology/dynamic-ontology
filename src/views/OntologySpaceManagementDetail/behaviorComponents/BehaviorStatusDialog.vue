<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog"
    title="本体行为状态管理"
    width="720px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="behavior">
      <header class="behavior-status-dialog__header">
        <strong>{{ behavior.displayName }}</strong>
        <el-tag class="aircas-tag" size="small" :type="statusTagType(behavior.status)">{{ SPACE_BEHAVIOR_STATUS_LABELS[behavior.status] }}</el-tag>
        <span class="behavior-status-dialog__version">{{ behavior.version }}</span>
      </header>
      <p class="behavior-status-dialog__hint">仅管理已保存配置的状态，不修改行为 ID、参数和引用；当前为 Mockup 生命周期，不执行真实调度控制或生产审批。</p>

      <template v-if="step === 'form'">
        <el-form class="aircas-form" label-position="top">
          <el-form-item label="目标操作">
            <el-select v-model="operation" class="aircas-select" popper-class="aircas-select-popper" style="width: 100%">
              <el-option v-for="item in operationOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作原因" required>
            <el-input
              v-model="reason"
              class="aircas-input"
              type="textarea"
              :rows="3"
              maxlength="2400"
              show-word-limit
              placeholder="说明发布、停用或转草稿的原因"
            />
          </el-form-item>
        </el-form>

        <section class="behavior-status-dialog__panel">
          <h3>{{ checkResult.passed ? "检查通过" : "检查未通过" }}</h3>
          <p>当前引用模型未发现依赖，切换后此行为不再作为已发布供行为树选择。</p>
          <p>停用不会删除行为或历史记录。恢复使用需重新发布；修改配置需先转草稿。</p>
        </section>
        <section class="behavior-status-dialog__panel">
          <h3>引用检查 {{ checkResult.count }}项</h3>
          <p>{{ checkResult.summary }}</p>
          <p>停用、撤回和转草稿均需先解除引用；此弹窗仅覆盖当前 Mockup 引用模型。</p>
        </section>
      </template>

      <template v-else>
        <section class="behavior-status-dialog__panel">
          <h3>确认变更</h3>
          <p>
            将「{{ behavior.displayName }}」从{{ SPACE_BEHAVIOR_STATUS_LABELS[behavior.status] }}变更为{{ SPACE_BEHAVIOR_STATUS_OPERATION_LABELS[operation] }}。
          </p>
          <p>操作原因：{{ reason.trim() }}</p>
        </section>
      </template>
    </template>

    <template #footer>
      <template v-if="step === 'form'">
        <el-button class="aircas-button aircas-button--tone-ghost" :loading="checking" @click="refreshReferenceCheck">重新检查</el-button>
        <el-button class="aircas-button aircas-button--tone-ghost" @click="emit('update:modelValue', false)">关闭</el-button>
        <el-button class="aircas-button aircas-button--tone-primary" :disabled="!checkResult.passed" @click="openConfirmStep">下一步：确认变更</el-button>
      </template>
      <template v-else>
        <el-button class="aircas-button aircas-button--tone-ghost" @click="step = 'form'">上一步</el-button>
        <el-button class="aircas-button aircas-button--tone-ghost" @click="emit('update:modelValue', false)">关闭</el-button>
        <el-button class="aircas-button aircas-button--tone-primary" :loading="loading" @click="submitStatusChange">确认变更</el-button>
      </template>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type {
  SpaceBehaviorItem,
  SpaceBehaviorReferenceCheckResult,
  SpaceBehaviorStatus,
  SpaceBehaviorStatusChangeDraft,
  SpaceBehaviorStatusOperation,
} from "@/types";
import { SPACE_BEHAVIOR_STATUS_LABELS, SPACE_BEHAVIOR_STATUS_OPERATION_LABELS, SPACE_BEHAVIOR_STATUS_OPERATION_OPTIONS } from "@/types";
import { createEmptySpaceBehaviorReferenceCheck, listAvailableSpaceBehaviorStatusOperations } from "../utils/spaceBehaviorOperations";

const props = defineProps<{
  modelValue: boolean;
  behavior: SpaceBehaviorItem | null;
  loading: boolean;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [draft: SpaceBehaviorStatusChangeDraft];
}>();

const step = ref<"form" | "confirm">("form");
const operation = ref<SpaceBehaviorStatusOperation>("disable");
const reason = ref("");
const checking = ref(false);
const checkResult = ref<SpaceBehaviorReferenceCheckResult>(createEmptySpaceBehaviorReferenceCheck());

const availableOperations = computed(() => (props.behavior ? listAvailableSpaceBehaviorStatusOperations(props.behavior.status) : []));
const operationOptions = computed(() => SPACE_BEHAVIOR_STATUS_OPERATION_OPTIONS.filter((item) => availableOperations.value.includes(item.value)));

/**
 * @description 将行为状态映射为标签颜色。
 * @param status 行为状态。
 * @returns Element Plus 标签类型。
 */
function statusTagType(status: SpaceBehaviorStatus): "success" | "info" | "warning" {
  if (status === "published") return "success";
  if (status === "disabled") return "warning";
  return "info";
}

/**
 * @description 重置弹窗到表单步，并写入当前状态对应的默认操作。
 */
function resetStatusDialog(): void {
  step.value = "form";
  reason.value = "";
  checking.value = false;
  checkResult.value = createEmptySpaceBehaviorReferenceCheck();
  operation.value = availableOperations.value[0] ?? "disable";
}

/**
 * @description 重新执行本地引用检查。
 */
function refreshReferenceCheck(): void {
  checking.value = true;
  checkResult.value = createEmptySpaceBehaviorReferenceCheck();
  checking.value = false;
}

/**
 * @description 校验原因后进入确认步。
 */
function openConfirmStep(): void {
  if (!reason.value.trim()) {
    ElMessage.warning("请填写操作原因");
    return;
  }
  step.value = "confirm";
}

/**
 * @description 提交状态变更草稿。
 */
function submitStatusChange(): void {
  emit("confirm", { operation: operation.value, reason: reason.value.trim() });
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) resetStatusDialog();
  },
);
</script>

<style scoped lang="scss">
.behavior-status-dialog__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--aircas-color-text-primary);
}
.behavior-status-dialog__version {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
.behavior-status-dialog__hint {
  margin: 0 0 16px;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  line-height: 1.6;
}
.behavior-status-dialog__panel {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
}
.behavior-status-dialog__panel h3 {
  margin: 0 0 8px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}
.behavior-status-dialog__panel p {
  margin: 0 0 6px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}
.behavior-status-dialog__panel p:last-child {
  margin-bottom: 0;
}
</style>
