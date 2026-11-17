<template>
  <el-dialog :model-value="modelValue" title="选择变量" width="520px" append-to-body destroy-on-close :z-index="5200" @close="closeVariablePicker">
    <div class="rule-variable-picker">
      <el-input v-model="keyword" clearable ariaLabel="搜索变量或键" placeholder="搜索变量或键" />
      <el-alert v-if="catalogError" :title="catalogError" type="error" :closable="false" />
      <el-button v-if="catalogError" @click="fetchVariableCatalog">重新加载</el-button>
      <span v-if="catalogLoading">正在加载变量…</span>
      <el-tree
        ref="treeRef"
        :data="variableTree"
        node-key="id"
        highlight-current
        :expand-on-click-node="false"
        :props="{ label: 'label', children: 'children' }"
        empty-text="暂无可选变量"
        @node-click="selectVariableProperty"
      />
      <template v-if="selected">
        <label>实例</label>
        <el-select
          :model-value="selectedInstanceId"
          filterable
          ariaLabel="实例"
          placeholder="请选择实例"
          :loading="instanceLoading"
          @update:model-value="changeSelectedInstance"
        >
          <el-option v-for="item in instances" :key="item.id" :label="item.label" :value="item.id" />
        </el-select>
        <el-alert v-if="instanceError" :title="instanceError" type="error" :closable="false" />
        <el-button v-if="instanceError" @click="fetchVariableInstances(selected.objectId)">重新加载实例</el-button>
        <span v-if="!instanceLoading && !instanceError && !instances.length">暂无可选实例</span>
        <template v-if="requiresDataRow">
          <label>数据行</label>
          <el-select
            v-model="selectedDataRowId"
            filterable
            ariaLabel="数据行"
            placeholder="请选择数据行"
            :loading="dataRowLoading"
            :disabled="!selectedInstanceId"
          >
            <el-option v-for="item in dataRows" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
          <el-alert v-if="dataRowError" :title="dataRowError" type="error" :closable="false" />
          <el-button v-if="dataRowError" @click="reloadSelectedDataRows">重新加载数据行</el-button>
          <span v-if="selectedInstanceId && !dataRowLoading && !dataRowError && !dataRows.length">暂无可选数据行</span>
        </template>
      </template>
    </div>
    <template #footer>
      <el-button @click="closeVariablePicker">取消</el-button>
      <el-button type="primary" :disabled="!canConfirm" @click="confirmVariableSelection">确认</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { ElTree } from "element-plus";
import { useRoute } from "vue-router";
import type { RuleVariableValue } from "@/types";
import { needsRuleVariableDataRow, useRuleVariablePicker } from "../composables/useRuleVariablePicker";

const props = defineProps<{ modelValue: boolean; initial: RuleVariableValue | null }>();
const emit = defineEmits<{ "update:modelValue": [visible: boolean]; confirm: [value: RuleVariableValue] }>();
const route = useRoute();
const treeRef = ref<InstanceType<typeof ElTree> | null>(null);
const keyword = ref("");
const selected = ref<RuleVariableValue | null>(null);
const selectedInstanceId = ref("");
const selectedDataRowId = ref("");
const {
  catalog,
  instances,
  dataRows,
  catalogLoading,
  catalogError,
  instanceLoading,
  instanceError,
  dataRowLoading,
  dataRowError,
  fetchVariableCatalog,
  fetchVariableInstances,
  fetchVariableDataRows,
  clearVariableDataRows,
  cancelVariableQueries,
} = useRuleVariablePicker(() => String(route.params.spaceId ?? ""));
const selectedKey = computed(() => (selected.value ? JSON.stringify([selected.value.objectId, selected.value.propertyId]) : ""));
const requiresDataRow = computed(() => needsRuleVariableDataRow(selected.value?.storageGroup));
const selectedDataRow = computed(() => dataRows.value.find((item) => item.id === selectedDataRowId.value));
const canConfirm = computed(
  () =>
    !!selected.value &&
    catalog.value.some(
      (object) => object.id === selected.value?.objectId && object.properties.some((property) => property.id === selected.value?.propertyId),
    ) &&
    instances.value.some((instance) => instance.id === selectedInstanceId.value) &&
    (!requiresDataRow.value || !!selectedDataRow.value) &&
    !catalogLoading.value &&
    !catalogError.value &&
    !instanceLoading.value &&
    !instanceError.value &&
    !dataRowLoading.value &&
    !dataRowError.value,
);
const variableTree = computed(() =>
  catalog.value
    .map((object) => ({
      id: JSON.stringify([object.id]),
      label: object.name,
      children: object.properties
        .filter((property) => `${object.name} ${property.name} ${property.id}`.toLowerCase().includes(keyword.value.toLowerCase()))
        .map((property) => ({
          id: JSON.stringify([object.id, property.id]),
          label: property.name,
        })),
    }))
    .filter((object) => object.children.length),
);
watch([variableTree, selectedKey, treeRef], async () => {
  await nextTick();
  treeRef.value?.setCurrentKey(selectedKey.value || null, false);
});

/** @description 选择真实目录中的属性，保留同对象已选实例，并按存储分组决定是否加载数据行。 @param data 树节点。 */
function selectVariableProperty(data: unknown): void {
  if (!data || typeof data !== "object" || !("id" in data)) return;
  for (const object of catalog.value) {
    const property = object.properties.find((item) => JSON.stringify([object.id, item.id]) === data.id);
    if (!property) continue;
    const sameObject = selected.value?.objectId === object.id;
    selected.value = {
      kind: "variable",
      objectId: object.id,
      objectName: object.name,
      objectKind: object.kind,
      propertyId: property.id,
      propertyName: property.name,
      instanceIds: [],
      storageGroup: property.storageGroup ?? "",
    };
    selectedDataRowId.value = "";
    clearVariableDataRows();
    if (!sameObject) selectedInstanceId.value = "";
    void fetchVariableInstances(object.id);
    if (sameObject && selectedInstanceId.value && needsRuleVariableDataRow(property.storageGroup))
      void fetchVariableDataRows(object.id, selectedInstanceId.value, property.storageGroup ?? "");
    return;
  }
}

/** @description 切换实例并清空或重载子表数据行。 @param value 实例标识。 */
function changeSelectedInstance(value: string | number | boolean | undefined): void {
  selectedInstanceId.value = typeof value === "string" || typeof value === "number" ? String(value) : "";
  selectedDataRowId.value = "";
  clearVariableDataRows();
  if (selected.value && selectedInstanceId.value && needsRuleVariableDataRow(selected.value.storageGroup))
    void fetchVariableDataRows(selected.value.objectId, selectedInstanceId.value, selected.value.storageGroup ?? "");
}

/** @description 按当前属性与实例重新加载数据行。 */
function reloadSelectedDataRows(): void {
  if (!selected.value || !selectedInstanceId.value) return;
  void fetchVariableDataRows(selected.value.objectId, selectedInstanceId.value, selected.value.storageGroup ?? "");
}

/**
 * @description 按已保存主键在选项中匹配数据行。
 * @param dataPrimaryKey 已保存主键。
 * @returns 选项标识；未匹配为空。
 */
function matchDataRowId(dataPrimaryKey: unknown): string {
  if (dataPrimaryKey === undefined || dataPrimaryKey === null || dataPrimaryKey === "") return "";
  const matched = dataRows.value.find((item) => {
    try {
      return JSON.stringify(item.dataPrimaryKey) === JSON.stringify(dataPrimaryKey);
    } catch {
      return String(item.dataPrimaryKey) === String(dataPrimaryKey);
    }
  });
  return matched?.id ?? "";
}

/** @description 关闭弹窗并使未完成的查询失效。 */
function closeVariablePicker(): void {
  cancelVariableQueries();
  emit("update:modelValue", false);
}

/** @description 提交仅包含一个具体实例（及必要数据行）的选择副本。 */
function confirmVariableSelection(): void {
  if (!selected.value || !canConfirm.value) return;
  const next: RuleVariableValue = {
    ...selected.value,
    instanceIds: [selectedInstanceId.value],
  };
  if (requiresDataRow.value && selectedDataRow.value) {
    next.dataPrimaryKey = selectedDataRow.value.dataPrimaryKey;
    next.dataPrimaryKeyLabel = selectedDataRow.value.label;
  } else {
    delete next.dataPrimaryKey;
    delete next.dataPrimaryKeyLabel;
  }
  emit("confirm", next);
  closeVariablePicker();
}

watch(() => route.params.spaceId, closeVariablePicker);
watch(
  () => props.modelValue,
  async () => {
    cancelVariableQueries();
    selected.value = null;
    selectedInstanceId.value = "";
    selectedDataRowId.value = "";
    keyword.value = "";
    if (!props.modelValue) return;
    selected.value = props.initial
      ? {
          ...props.initial,
          instanceIds: [...props.initial.instanceIds],
          storageGroup: props.initial.storageGroup ?? "",
        }
      : null;
    selectedInstanceId.value = props.initial?.instanceIds[0] ?? "";
    await fetchVariableCatalog();
    if (selected.value?.objectId) {
      const object = catalog.value.find((item) => item.id === selected.value?.objectId);
      const property = object?.properties.find((item) => item.id === selected.value?.propertyId);
      if (property && selected.value) selected.value = { ...selected.value, storageGroup: property.storageGroup ?? selected.value.storageGroup ?? "" };
      await fetchVariableInstances(selected.value.objectId);
    }
    if (selected.value && selectedInstanceId.value && needsRuleVariableDataRow(selected.value.storageGroup)) {
      await fetchVariableDataRows(selected.value.objectId, selectedInstanceId.value, selected.value.storageGroup ?? "");
      selectedDataRowId.value = matchDataRowId(props.initial?.dataPrimaryKey);
    }
  },
  { immediate: true },
);
</script>
<style scoped lang="scss">
.rule-variable-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rule-variable-picker .el-tree {
  min-height: 160px;
  max-height: 320px;
  overflow: auto;
}
</style>
