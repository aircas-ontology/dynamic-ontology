<template>
  <el-dialog :model-value="modelValue" title="删除行为" width="520px" :close-on-click-modal="false" @update:model-value="emit('update:modelValue', $event)">
    <el-alert type="warning" :closable="false" title="影响范围" description="当前无行为树或调度引用。" /><el-form label-position="top"
      ><el-form-item label="请输入行为名称确认删除" required><el-input v-model="confirmation" :placeholder="behavior?.displayName || ''" /></el-form-item
    ></el-form>
    <template #footer
      ><el-button @click="emit('update:modelValue', false)">取消</el-button
      ><el-button type="danger" :disabled="confirmation !== behavior?.displayName" @click="confirmDelete">确认删除</el-button></template
    >
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import type { SpaceBehaviorItem } from "@/types";
const props = defineProps<{ modelValue: boolean; behavior: SpaceBehaviorItem | null }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; confirm: [] }>();
const confirmation = ref("");
/** @description 确认匹配名称的删除命令。 */ function confirmDelete(): void {
  if (confirmation.value === props.behavior?.displayName) emit("confirm");
}
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) confirmation.value = "";
  },
);
</script>
