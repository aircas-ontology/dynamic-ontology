<template>
  <el-dialog
    :model-value="modelValue"
    title="行为状态管理"
    width="480px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form v-if="behavior" label-position="top">
      <el-form-item label="目标操作">
        <el-select v-model="operation" style="width: 100%">
          <el-option v-for="item in operationOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="loading" @click="emit('update:modelValue', false)">关闭</el-button>
      <el-button :loading="loading" :disabled="!operationOptions.length" @click="submitStatusChange">确认变更</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { SpaceBehaviorItem, SpaceBehaviorStatusChangeDraft, SpaceBehaviorStatusOperation } from "@/types";
import { SPACE_BEHAVIOR_STATUS_OPERATION_OPTIONS } from "@/types";
import { listAvailableSpaceBehaviorStatusOperations } from "../utils/spaceBehaviorOperations";

const props = defineProps<{
  modelValue: boolean;
  behavior: SpaceBehaviorItem | null;
  loading: boolean;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [draft: SpaceBehaviorStatusChangeDraft];
}>();

const operation = ref<SpaceBehaviorStatusOperation>("publish");

const availableOperations = computed(() => (props.behavior ? listAvailableSpaceBehaviorStatusOperations(props.behavior.status) : []));
const operationOptions = computed(() => SPACE_BEHAVIOR_STATUS_OPERATION_OPTIONS.filter((item) => availableOperations.value.includes(item.value)));

/**
 * @description 重置弹窗并写入当前状态对应的默认操作。
 */
function resetStatusDialog(): void {
  operation.value = availableOperations.value[0] ?? "publish";
}

/**
 * @description 直接提交状态变更；reason 固定空串以保持契约。
 */
function submitStatusChange(): void {
  if (props.loading || !operationOptions.value.length) return;
  emit("confirm", { operation: operation.value, reason: "" });
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) resetStatusDialog();
  },
);
</script>
