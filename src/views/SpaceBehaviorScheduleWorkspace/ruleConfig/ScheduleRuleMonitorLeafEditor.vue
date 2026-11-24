<template>
  <div class="rule-monitor-leaf-editor">
    <el-select
      :model-value="node.objectId || undefined"
      class="rule-monitor-leaf-editor__object"
      filterable
      clearable
      ariaLabel="监测对象"
      placeholder="选择对象"
      :loading="catalogLoading"
      :disabled="readonly"
      @update:model-value="applyMonitorObject"
    >
      <el-option v-for="item in catalog" :key="item.id" :label="item.name" :value="item.id" />
    </el-select>
    <el-select
      :model-value="node.storageGroup || undefined"
      class="rule-monitor-leaf-editor__group"
      filterable
      ariaLabel="存储分组"
      placeholder="选择分组"
      :disabled="readonly || !node.objectId"
      @update:model-value="applyMonitorStorageGroup"
    >
      <el-option v-for="group in storageGroups" :key="group.value" :label="group.label" :value="group.value" />
    </el-select>
    <el-alert v-if="catalogError" :title="catalogError" type="error" :closable="false" />
    <el-button v-if="catalogError" :disabled="readonly" @click="fetchVariableCatalog">重新加载</el-button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import type { RuleMonitorLeafCondition } from "@/types";
import { useRuleVariablePicker } from "../composables/useRuleVariablePicker";

const props = withDefaults(defineProps<{ node: RuleMonitorLeafCondition; readonly?: boolean }>(), { readonly: false });
const route = useRoute();
const { catalog, catalogLoading, catalogError, fetchVariableCatalog, cancelVariableQueries } = useRuleVariablePicker(() => String(route.params.spaceId ?? ""));

const storageGroups = computed(() => {
  const object = catalog.value.find((item) => item.id === props.node.objectId);
  const groups = new Set<string>(["main"]);
  object?.properties.forEach((property) => {
    const group = property.storageGroup?.trim();
    if (group) groups.add(group);
  });
  return [...groups].map((value) => ({ value, label: value === "main" ? "主表 (main)" : value }));
});

/**
 * @description 选择监测对象并校正分组选项。
 * @param objectId 对象标识。
 */
function applyMonitorObject(objectId: string | undefined): void {
  const selected = catalog.value.find((item) => item.id === objectId);
  props.node.objectId = selected?.id ?? "";
  props.node.objectName = selected?.name ?? "";
  const allowed = new Set<string>(["main"]);
  selected?.properties.forEach((property) => {
    const group = property.storageGroup?.trim();
    if (group) allowed.add(group);
  });
  if (!allowed.has(props.node.storageGroup)) props.node.storageGroup = "main";
}

/**
 * @description 写入监测存储分组。
 * @param storageGroup 分组名。
 */
function applyMonitorStorageGroup(storageGroup: string | undefined): void {
  props.node.storageGroup = storageGroup?.trim() || "main";
}

onMounted(() => {
  void fetchVariableCatalog();
});

watch(
  () => route.params.spaceId,
  () => {
    cancelVariableQueries();
    void fetchVariableCatalog();
  },
);
</script>

<style scoped lang="scss">
.rule-monitor-leaf-editor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.rule-monitor-leaf-editor__object {
  width: 180px;
}

.rule-monitor-leaf-editor__group {
  width: 160px;
}
</style>
