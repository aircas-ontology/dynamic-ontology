<template>
  <section class="ontology-subspace-create" aria-label="创建子空间">
    <SubspaceCreateTreePanel @update:selected-objects="selectedObjects = $event" />
    <SubspaceCreateWorkspacePanel
      v-model:space-name="spaceName"
      v-model:api-name="apiName"
      v-model:selected-instance-ids="selectedInstanceIds"
      :parent-space-name="parentSpaceName"
      :selected-count="selectedCount"
      :selected-objects="selectedObjects"
      :current-step-index="currentStepIndex"
      :instance-rows="instanceRows"
      :property-groups="propertyGroups"
      :selected-property-ids="selectedPropertyIds"
      v-model:selected-relation-ids="selectedRelationIds"
      :relation-rows="relationRows"
      @back="goBackToSpaceList"
      @previous="retreatSubspaceCreateStep"
      @next="advanceSubspaceCreateStep"
      @create="createSubspace"
      @select-object-properties="selectObjectProperties"
      @select-all-properties="selectAllObjectProperties"
      @clear-properties="clearSelectedObjectProperties"
      @toggle-property="toggleObjectProperty"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import SubspaceCreateTreePanel from "./components/SubspaceCreateTreePanel.vue";
import SubspaceCreateWorkspacePanel from "./components/SubspaceCreateWorkspacePanel.vue";
import { mapSubspaceCreateObjectPropertyGroups } from "./utils/mapSubspaceCreateObjectProperty";
import { mapSubspaceCreateSelectedInstances } from "./utils/mapSubspaceCreateSelectedInstance";
import { mapSubspaceCreateSelectedRelations } from "./utils/mapSubspaceCreateSelectedRelation";
import type { SubspaceCreateSelectedObject } from "./utils/mapSubspaceCreateSelectedObject";

const route = useRoute();
const router = useRouter();
const currentStepIndex = ref(0);
const selectedObjects = ref<SubspaceCreateSelectedObject[]>([]);
const selectedInstanceIds = ref<string[]>([]);
const selectedPropertyIds = ref<string[]>([]);
const selectedRelationIds = ref<string[]>([]);
const selectedCount = computed(() => selectedObjects.value.length);
const instanceRows = computed(() => mapSubspaceCreateSelectedInstances(selectedObjects.value));
const propertyGroups = computed(() => mapSubspaceCreateObjectPropertyGroups(selectedObjects.value));
const relationRows = computed(() => mapSubspaceCreateSelectedRelations(selectedObjects.value));
const spaceName = ref(`${String(route.query.spaceName || "海军本体空间")}子空间`);
const apiName = ref(`subspace_${Date.now()}`);
const parentSpaceName = computed(() => String(route.query.spaceName || "海军本体空间"));

watch(
  instanceRows,
  (rows, previousRows) => {
    const previousIds = new Set((previousRows ?? []).map((row) => row.id));
    const nextIds = rows.map((row) => row.id);
    const nextIdSet = new Set(nextIds);
    const kept = selectedInstanceIds.value.filter((id) => nextIdSet.has(id));
    const added = nextIds.filter((id) => !previousIds.has(id));
    selectedInstanceIds.value = [...kept, ...added];
  },
  { immediate: true },
);

watch(
  relationRows,
  (rows, previousRows) => {
    const previousIds = new Set((previousRows ?? []).map((row) => row.id));
    const nextIds = rows.map((row) => row.id);
    const nextIdSet = new Set(nextIds);
    const kept = selectedRelationIds.value.filter((id) => nextIdSet.has(id));
    const added = nextIds.filter((id) => !previousIds.has(id));
    selectedRelationIds.value = [...kept, ...added];
  },
  { immediate: true },
);

watch(propertyGroups, (groups) => {
  const validIds = new Set(groups.flatMap((group) => group.properties.map((item) => item.id)));
  selectedPropertyIds.value = selectedPropertyIds.value.filter((id) => validIds.has(id));
});

/**
 * @description 返回本体空间管理列表。
 */
function goBackToSpaceList() {
  void router.push({ name: "OntologySpaceManagement" });
}

/**
 * @description 从当前步骤回退到上一步。
 */
function retreatSubspaceCreateStep() {
  if (currentStepIndex.value <= 0) {
    return;
  }
  currentStepIndex.value -= 1;
}

/**
 * @description 勾选某个对象下的全部属性。
 * @param objectId 对象 id。
 */
function selectObjectProperties(objectId: string) {
  const ids = propertyGroups.value.find((group) => group.objectId === objectId)?.properties.map((item) => item.id) ?? [];
  selectedPropertyIds.value = [...new Set([...selectedPropertyIds.value, ...ids])];
}

/**
 * @description 勾选当前全部对象属性。
 */
function selectAllObjectProperties() {
  selectedPropertyIds.value = propertyGroups.value.flatMap((group) => group.properties.map((item) => item.id));
}

/**
 * @description 取消全部属性勾选。
 */
function clearSelectedObjectProperties() {
  selectedPropertyIds.value = [];
}

/**
 * @description 切换单条属性的勾选状态。
 * @param propertyId 属性 id。
 * @param checked 是否勾选。
 */
function toggleObjectProperty(propertyId: string, checked: boolean) {
  if (checked) {
    if (!selectedPropertyIds.value.includes(propertyId)) {
      selectedPropertyIds.value = [...selectedPropertyIds.value, propertyId];
    }
    return;
  }
  selectedPropertyIds.value = selectedPropertyIds.value.filter((id) => id !== propertyId);
}

/**
 * @description 校验当前步骤后进入下一步；关系选择是最后一步。
 */
function advanceSubspaceCreateStep() {
  if (!spaceName.value.trim() || !apiName.value.trim()) {
    ElMessage.warning("请填写子空间名称和 API 名称");
    return;
  }
  if (currentStepIndex.value === 0) {
    if (!selectedCount.value) {
      ElMessage.warning("请至少选择一个本体对象");
      return;
    }
    currentStepIndex.value = 1;
    return;
  }
  if (currentStepIndex.value === 1) {
    if (!selectedInstanceIds.value.length) {
      ElMessage.warning("请至少选择一个对象实例");
      return;
    }
    currentStepIndex.value = 2;
    return;
  }
  if (currentStepIndex.value === 2) {
    currentStepIndex.value = 3;
  }
}

/**
 * @description 校验已选关系后完成子空间创建，并返回进入本页之前的路由。
 */
function createSubspace() {
  if (!spaceName.value.trim() || !apiName.value.trim()) {
    ElMessage.warning("请填写子空间名称和 API 名称");
    return;
  }
  if (!selectedRelationIds.value.length) {
    ElMessage.warning("请至少选择一个对象关系");
    return;
  }
  ElMessage.success(`已选择 ${selectedRelationIds.value.length} 个关系，可继续创建子空间`);
  void router.back();
}
</script>

<style scoped lang="scss">
.ontology-subspace-create {
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex: 1;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 8px;
}

@media (max-width: 1000px) {
  .ontology-subspace-create {
    height: auto;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(280px, 38vh) minmax(520px, auto);
  }
}
</style>
