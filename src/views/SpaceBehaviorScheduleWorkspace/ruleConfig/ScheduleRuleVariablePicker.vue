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
        <el-select v-model="selectedInstanceId" filterable ariaLabel="实例" placeholder="请选择实例" :loading="instanceLoading">
          <el-option v-for="item in instances" :key="item.id" :label="item.label" :value="item.id" />
        </el-select>
        <el-alert v-if="instanceError" :title="instanceError" type="error" :closable="false" />
        <el-button v-if="instanceError" @click="fetchVariableInstances(selected.objectId)">重新加载实例</el-button>
        <span v-if="!instanceLoading && !instanceError && !instances.length">暂无可选实例</span>
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
import { useRuleVariablePicker } from "../composables/useRuleVariablePicker";

const props = defineProps<{ modelValue: boolean; initial: RuleVariableValue | null }>();
const emit = defineEmits<{ "update:modelValue": [visible: boolean]; confirm: [value: RuleVariableValue] }>();
const route = useRoute();
const treeRef = ref<InstanceType<typeof ElTree> | null>(null);
const keyword = ref("");
const selected = ref<RuleVariableValue | null>(null);
const selectedInstanceId = ref("");
const {
  catalog,
  instances,
  catalogLoading,
  catalogError,
  instanceLoading,
  instanceError,
  fetchVariableCatalog,
  fetchVariableInstances,
  cancelVariableQueries,
} = useRuleVariablePicker(() => String(route.params.spaceId ?? ""));
const selectedKey = computed(() => (selected.value ? JSON.stringify([selected.value.objectId, selected.value.propertyId]) : ""));
const canConfirm = computed(
  () =>
    !!selected.value &&
    catalog.value.some(
      (object) => object.id === selected.value?.objectId && object.properties.some((property) => property.id === selected.value?.propertyId),
    ) &&
    instances.value.some((instance) => instance.id === selectedInstanceId.value) &&
    !catalogLoading.value &&
    !catalogError.value &&
    !instanceLoading.value &&
    !instanceError.value,
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

/** @description 选择真实目录中的属性，保留同对象已选实例。 @param data 树节点。 */
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
    };
    if (!sameObject) selectedInstanceId.value = "";
    void fetchVariableInstances(object.id);
    return;
  }
}
/** @description 关闭弹窗并使未完成的查询失效。 */
function closeVariablePicker(): void {
  cancelVariableQueries();
  emit("update:modelValue", false);
}
/** @description 提交仅包含一个具体实例的选择副本。 */
function confirmVariableSelection(): void {
  if (!selected.value || !canConfirm.value) return;
  emit("confirm", { ...selected.value, instanceIds: [selectedInstanceId.value] });
  closeVariablePicker();
}
watch(() => route.params.spaceId, closeVariablePicker);
watch(
  () => props.modelValue,
  () => {
    cancelVariableQueries();
    selected.value = null;
    selectedInstanceId.value = "";
    keyword.value = "";
    if (!props.modelValue) return;
    selected.value = props.initial ? { ...props.initial, instanceIds: [...props.initial.instanceIds] } : null;
    selectedInstanceId.value = props.initial?.instanceIds[0] ?? "";
    void fetchVariableCatalog();
    if (selected.value?.objectId) void fetchVariableInstances(selected.value.objectId);
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
