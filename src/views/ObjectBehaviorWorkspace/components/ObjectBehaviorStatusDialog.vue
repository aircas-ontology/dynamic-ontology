<template>
  <el-dialog
    :model-value="modelValue"
    title="本体行为状态管理"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form v-if="behavior" label-position="top"
      ><el-form-item label="目标操作" required
        ><el-select v-model="operation"
          ><el-option v-for="item in operations" :key="item" :label="SPACE_BEHAVIOR_STATUS_OPERATION_LABELS[item]" :value="item" /></el-select></el-form-item
      ><el-form-item label="操作原因" required
        ><el-input v-model="reason" type="textarea" :rows="4" maxlength="2400" placeholder="说明发布、停用或转草稿的原因" /></el-form-item
      ><el-alert title="引用检查通过" type="success" :closable="false" description="当前无行为树或调度引用。"
    /></el-form>
    <template #footer
      ><el-button @click="emit('update:modelValue', false)">取消</el-button
      ><el-button :disabled="!reason.trim()" @click="submitStatusChange">确认变更</el-button></template
    >
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { SpaceBehaviorItem, SpaceBehaviorStatusOperation } from "@/types";
import { SPACE_BEHAVIOR_STATUS_OPERATION_LABELS } from "@/types";
import { listObjectBehaviorStatusOperations } from "../utils/objectBehaviorOperations";
const props = defineProps<{ modelValue: boolean; behavior: SpaceBehaviorItem | null }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; submit: [draft: { operation: SpaceBehaviorStatusOperation; reason: string }] }>();
const operation = ref<SpaceBehaviorStatusOperation>("publish");
const reason = ref("");
const operations = computed(() => (props.behavior ? listObjectBehaviorStatusOperations(props.behavior.status) : []));
/** @description 提交状态变更。 */ function submitStatusChange(): void {
  if (reason.value.trim()) emit("submit", { operation: operation.value, reason: reason.value.trim() });
}
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      operation.value = operations.value[0] ?? "publish";
      reason.value = "";
    }
  },
);
</script>
