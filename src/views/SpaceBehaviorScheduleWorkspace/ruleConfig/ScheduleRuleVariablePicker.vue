<template>
  <el-dialog :model-value="modelValue" title="选择变量" width="520px" append-to-body destroy-on-close :z-index="5200" @close="closeVariablePicker">
    <div class="rule-variable-picker">
      <el-input v-model="keyword" clearable ariaLabel="搜索变量或键" placeholder="搜索变量或键" />
      <el-alert title="这里只选择对象和字段；实例及数据行在双击行为后的弹窗中统一配置。" type="info" :closable="false" />
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
      <p v-if="selected">已选字段：{{ selected.objectName }} · {{ selected.propertyName }}</p>
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
const { catalog, catalogLoading, catalogError, fetchVariableCatalog, cancelVariableQueries } = useRuleVariablePicker(() => String(route.params.spaceId ?? ""));
const selectedKey = computed(() => (selected.value ? JSON.stringify([selected.value.objectId, selected.value.propertyId]) : ""));
const canConfirm = computed(
  () =>
    !!selected.value &&
    catalog.value.some(
      (object) => object.id === selected.value?.objectId && object.properties.some((property) => property.id === selected.value?.propertyId),
    ) &&
    !catalogLoading.value &&
    !catalogError.value,
);
const variableTree = computed(() =>
  catalog.value
    .map((object) => ({
      id: JSON.stringify([object.id]),
      label: object.name,
      children: object.properties
        .filter((property) => `${object.name} ${property.name} ${property.id}`.toLowerCase().includes(keyword.value.toLowerCase()))
        .map((property) => ({ id: JSON.stringify([object.id, property.id]), label: property.name })),
    }))
    .filter((object) => object.children.length),
);
watch([variableTree, selectedKey, treeRef], async () => {
  await nextTick();
  treeRef.value?.setCurrentKey(selectedKey.value || null, false);
});
/** @description 选择对象字段；重复选择原字段保留共享实例，改变字段则清空绑定，交由行为弹窗重新配置。 @param data 树节点。 */
function selectVariableProperty(data: unknown): void {
  if (!data || typeof data !== "object" || !("id" in data)) return;
  for (const object of catalog.value) {
    const property = object.properties.find((item) => JSON.stringify([object.id, item.id]) === data.id);
    if (!property) continue;
    const sameProperty =
      selected.value?.objectId === object.id && selected.value.propertyId === property.id && selected.value.storageGroup === (property.storageGroup ?? "");
    selected.value = {
      ...(sameProperty ? selected.value : {}),
      kind: "variable",
      objectId: object.id,
      objectName: object.name,
      objectKind: object.kind,
      propertyId: property.id,
      propertyName: property.name,
      instanceIds: sameProperty ? [...(selected.value?.instanceIds ?? [])] : [],
      storageGroup: property.storageGroup ?? "",
    };
    return;
  }
}
/** @description 关闭字段选择并使未完成查询失效。 */
function closeVariablePicker(): void {
  cancelVariableQueries();
  emit("update:modelValue", false);
}
/** @description 确认字段副本，无需预先选择实例或子表行。 */
function confirmVariableSelection(): void {
  if (!selected.value || !canConfirm.value) return;
  emit("confirm", { ...selected.value, instanceIds: [...selected.value.instanceIds] });
  closeVariablePicker();
}
watch(() => route.params.spaceId, closeVariablePicker);
watch(
  () => props.modelValue,
  () => {
    cancelVariableQueries();
    keyword.value = "";
    selected.value = props.initial ? { ...props.initial, instanceIds: [...props.initial.instanceIds] } : null;
    if (props.modelValue) void fetchVariableCatalog();
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
