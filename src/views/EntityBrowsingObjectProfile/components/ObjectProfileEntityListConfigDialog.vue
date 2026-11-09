<template>
  <el-dialog
    :model-value="modelValue"
    title="配置显示字段"
    width="480px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="object-profile-entity-list-config">
      <div class="object-profile-entity-list-config__actions">
        <el-button link type="primary" @click="selectAllColumns">全选</el-button>
        <el-button link type="primary" @click="clearAllColumns">清空</el-button>
      </div>
      <el-checkbox-group v-if="columns.length" :model-value="draftColumns" class="object-profile-entity-list-config__group" @update:model-value="handleDraftColumnsChange">
        <el-checkbox v-for="column in columns" :key="column" :value="column">{{ column }}</el-checkbox>
      </el-checkbox-group>
      <el-empty v-else description="暂无可配置字段" :image-size="64" />
    </div>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :disabled="!columns.length" @click="confirmColumnConfig">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps<{
  modelValue: boolean;
  columns: string[];
  selectedColumns: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [columns: string[]];
}>();

const draftColumns = ref<string[]>([]);

watch(
  () => [props.modelValue, props.columns, props.selectedColumns] as const,
  ([visible]) => {
    if (!visible) return;
    draftColumns.value = props.selectedColumns.length ? [...props.selectedColumns] : [...props.columns];
  },
);

/**
 * @description 同步弹窗内勾选值，仅保留字符串列名。
 * @param value 复选框组原始值。
 */
function handleDraftColumnsChange(value: string | number | boolean | Array<string | number>): void {
  const selected = Array.isArray(value) ? value : [];
  draftColumns.value = props.columns.filter((column) => selected.includes(column));
}

/**
 * @description 勾选全部可用列。
 */
function selectAllColumns(): void {
  draftColumns.value = [...props.columns];
}

/**
 * @description 清空当前勾选。
 */
function clearAllColumns(): void {
  draftColumns.value = [];
}

/**
 * @description 确认列配置；至少保留一列。
 */
function confirmColumnConfig(): void {
  if (!draftColumns.value.length) {
    ElMessage.warning("请至少保留一个显示字段");
    return;
  }
  const selected = new Set(draftColumns.value);
  emit(
    "confirm",
    props.columns.filter((column) => selected.has(column)),
  );
}
</script>

<style scoped lang="scss">
.object-profile-entity-list-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.object-profile-entity-list-config__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.object-profile-entity-list-config__group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  max-height: 360px;
  overflow: auto;
}
</style>
