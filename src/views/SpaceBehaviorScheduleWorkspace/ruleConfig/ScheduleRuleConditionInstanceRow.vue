<template>
  <div class="condition-instance-row">
    <div class="condition-instance-row__heading">
      <strong>{{ value.objectName || "未命名对象" }} · {{ value.propertyName || "未命名字段" }}</strong>
      <span>{{ label }}</span>
    </div>
    <div v-if="readonly" class="condition-instance-row__fields">
      <span>实例：{{ value.instanceNames?.join("、") || value.instanceIds.join("、") || "未配置" }}</span>
      <span v-if="requiresDataRow"
        >数据行：{{
          value.dataPrimaryKeyLabel || (value.dataPrimaryKey != null && value.dataPrimaryKey !== "" ? String(value.dataPrimaryKey) : "未配置")
        }}</span
      >
    </div>
    <div v-else class="condition-instance-row__fields">
      <div class="condition-instance-row__field">
        <span class="condition-instance-row__field-label">实例</span>
        <el-select
          :model-value="value.instanceIds[0] || ''"
          :ariaLabel="`${label} ${value.objectName} ${value.propertyName}实例`"
          placeholder="请选择实例"
          filterable
          clearable
          :loading="instanceLoading"
          @update:model-value="changeConditionInstance"
        >
          <el-option v-for="item in instances" :key="item.id" :value="item.id" :label="item.label" />
        </el-select>
        <div v-if="instanceError" class="condition-instance-row__error">
          <el-alert title="实例加载失败，请重试" type="error" :closable="false" />
          <div class="condition-instance-row__error-actions">
            <el-button link type="primary" @click="refreshConditionInstances">重新加载实例</el-button>
            <el-popover trigger="click" :width="320" placement="top" :content="instanceError">
              <template #reference><el-button link>查看详情</el-button></template>
            </el-popover>
          </div>
        </div>
        <span v-else-if="!instanceLoading && !instances.length">暂无可选实例</span>
        <span v-else-if="value.instanceIds.length && !instanceLoading && !instances.some((item) => item.id === value.instanceIds[0])"
          >原实例已不可用，请重新选择</span
        >
      </div>
      <div v-if="requiresDataRow" class="condition-instance-row__field">
        <span class="condition-instance-row__field-label">数据行</span>
        <el-select
          :model-value="selectedDataRowId"
          :ariaLabel="`${label} ${value.objectName} ${value.propertyName}数据行`"
          placeholder="请选择数据行"
          filterable
          clearable
          :disabled="!hasAvailableInstance || instanceLoading || !!instanceError"
          :loading="dataRowLoading"
          @update:model-value="changeConditionDataRow"
        >
          <el-option v-for="item in dataRows" :key="item.id" :value="item.id" :label="item.label" />
        </el-select>
        <div v-if="dataRowError" class="condition-instance-row__error">
          <el-alert title="数据行加载失败，请重试" type="error" :closable="false" />
          <div class="condition-instance-row__error-actions">
            <el-button link type="primary" @click="refreshConditionDataRows">重新加载数据行</el-button>
            <el-popover trigger="click" :width="320" placement="top" :content="dataRowError">
              <template #reference><el-button link>查看详情</el-button></template>
            </el-popover>
          </div>
        </div>
        <span v-else-if="hasAvailableInstance && !dataRowLoading && !dataRows.length">暂无可选数据行</span>
        <span v-else-if="hasAvailableInstance && !dataRowLoading && !selectedDataRowId && value.dataPrimaryKey != null">原数据行已不可用，请重新选择</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import type { RuleVariableValue } from "@/types";
import { needsRuleVariableDataRow, useRuleVariablePicker } from "../composables/useRuleVariablePicker";

const props = defineProps<{ value: RuleVariableValue; label: string; readonly?: boolean }>();
const emit = defineEmits<{ validity: [ready: boolean] }>();
const route = useRoute();
const {
  instances,
  dataRows,
  instanceLoading,
  instanceError,
  dataRowLoading,
  dataRowError,
  fetchVariableInstances,
  fetchVariableDataRows,
  clearVariableDataRows,
  cancelVariableQueries,
} = useRuleVariablePicker(() => String(route.params.spaceId ?? ""));
const requiresDataRow = computed(() => needsRuleVariableDataRow(props.value.storageGroup));
const hasAvailableInstance = computed(() => props.value.instanceIds.length === 1 && instances.value.some((item) => item.id === props.value.instanceIds[0]));
const selectedDataRowId = computed(
  () => dataRows.value.find((item) => JSON.stringify(item.dataPrimaryKey) === JSON.stringify(props.value.dataPrimaryKey))?.id || "",
);
const ready = computed(
  () =>
    !!props.readonly ||
    (!instanceLoading.value &&
      !instanceError.value &&
      hasAvailableInstance.value &&
      (!requiresDataRow.value || (!!selectedDataRowId.value && !dataRowLoading.value && !dataRowError.value))),
);
watch(ready, (valid) => emit("validity", valid), { immediate: true });

/** @description 重新查询当前字段的实例，保留草稿选择用于失效提示。 @returns 查询结束。 */
async function refreshConditionInstances(): Promise<void> {
  await fetchVariableInstances(props.value.objectId);
}
/** @description 加载当前实例对应的子表数据行。 @returns 查询结束。 */
async function refreshConditionDataRows(): Promise<void> {
  if (!requiresDataRow.value || !hasAvailableInstance.value) return;
  await fetchVariableDataRows(props.value.objectId, props.value.instanceIds[0] || "", props.value.storageGroup || "");
}
/** @description 切换实例时同步共享草稿并清空旧数据行。 @param selected 实例标识。 */
function changeConditionInstance(selected: unknown): void {
  const id = typeof selected === "string" || typeof selected === "number" ? String(selected) : "";
  props.value.instanceIds = id ? [id] : [];
  props.value.instanceNames = instances.value.filter((item) => item.id === id).map((item) => item.label);
  delete props.value.dataPrimaryKey;
  delete props.value.dataPrimaryKeyLabel;
  clearVariableDataRows();
}
/** @description 保存所选子表行的原始主键及展示名。 @param selected 数据行选项标识。 */
function changeConditionDataRow(selected: unknown): void {
  const row = dataRows.value.find((item) => item.id === selected);
  if (row) {
    props.value.dataPrimaryKey = row.dataPrimaryKey;
    props.value.dataPrimaryKeyLabel = row.label;
  } else {
    delete props.value.dataPrimaryKey;
    delete props.value.dataPrimaryKeyLabel;
  }
}
watch(
  () => [route.params.spaceId, props.value.objectId, props.readonly],
  async () => {
    cancelVariableQueries();
    clearVariableDataRows();
    if (props.readonly) return;
    await refreshConditionInstances();
  },
  { immediate: true },
);
watch(
  () => [props.value.instanceIds[0], props.value.storageGroup, hasAvailableInstance.value],
  () => {
    clearVariableDataRows();
    if (!props.readonly) void refreshConditionDataRows();
  },
  { immediate: true },
);
</script>
<style scoped lang="scss">
.condition-instance-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
  min-width: 0;
}
.condition-instance-row__heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  overflow-wrap: anywhere;
  line-height: 1.5;
}
.condition-instance-row__heading strong {
  font-size: 14px;
  font-weight: 500;
}
.condition-instance-row__heading span {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.condition-instance-row__fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  padding-left: 16px;
  min-width: 0;
}
.condition-instance-row__field {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  flex: 0 1 300px;
  min-width: 0;
}
.condition-instance-row__field-label {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.condition-instance-row__field > .condition-instance-row__error,
.condition-instance-row__field > span:not(.condition-instance-row__field-label) {
  grid-column: 2;
  overflow-wrap: anywhere;
}
.condition-instance-row__error {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.condition-instance-row__error-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
@media (max-width: 760px) {
  .condition-instance-row__fields {
    padding-left: 0;
  }
  .condition-instance-row__field {
    flex-basis: 100%;
  }
}
</style>
