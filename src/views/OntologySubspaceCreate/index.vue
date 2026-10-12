<template>
  <section class="ontology-subspace-create" aria-label="创建子空间">
    <SubspaceCreateTreePanel :current-step-index="currentStepIndex" @update:selected-objects="selectedObjects = $event" />
    <SubspaceCreateWorkspacePanel
      v-model:space-name="spaceName"
      v-model:api-name="apiName"
      v-model:selected-instance-ids="selectedInstanceIds"
      :parent-space-name="parentSpaceName"
      :selected-count="selectedCount"
      :selected-objects="selectedObjects"
      :current-step-index="currentStepIndex"
      :instance-groups="instanceGroups"
      :instance-load-status="instanceLoadStatus"
      :instance-load-error="instanceLoadError"
      :property-groups="propertyGroups"
      :property-load-status="propertyLoadStatus"
      :property-load-error="propertyLoadError"
      :selected-property-ids="selectedPropertyIds"
      :property-filters="propertyFilters"
      v-model:selected-relation-ids="selectedRelationIds"
      :relation-rows="relationRows"
      :relation-load-status="relationLoadStatus"
      :relation-load-error="relationLoadError"
      :creating="creating"
      @back="goBackToSpaceList"
      @previous="retreatSubspaceCreateStep"
      @next="advanceSubspaceCreateStep"
      @create="createSubspace"
      @select-object-properties="selectObjectProperties"
      @select-all-properties="selectAllObjectProperties"
      @clear-properties="clearSelectedObjectProperties"
      @toggle-property="toggleObjectProperty"
      @property-retry="retryObjectProperties"
      @instance-page-change="loadObjectInstancePage"
      @instance-page-size-change="loadObjectInstancePageSize"
      @instance-retry="retryObjectInstancePage"
      @relation-retry="retryParentSpaceRelations"
      @update:property-filters="propertyFilters = $event"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import {
  createOntologySubspaceInterface,
  getOntologyEntitiesInterface,
  getOntologyPropertyByOntologyIdInterface,
  getOntologyRelationCategoryTreeInterface,
} from "@/apis";
import SubspaceCreateTreePanel from "./components/SubspaceCreateTreePanel.vue";
import SubspaceCreateWorkspacePanel from "./components/SubspaceCreateWorkspacePanel.vue";
import { listSubspaceCreateObjectsMissingProperties, mapSubspaceCreateObjectPropertyGroup } from "./utils/mapSubspaceCreateObjectProperty";
import type { SubspaceCreateObjectPropertyGroup } from "./utils/mapSubspaceCreateObjectProperty";
import { mapSubspaceCreateSelectedInstances, SUBSPACE_CREATE_INSTANCE_PAGE_SIZE } from "./utils/mapSubspaceCreateSelectedInstance";
import type { SubspaceCreateInstanceGroup } from "./utils/mapSubspaceCreateSelectedInstance";
import { mapSubspaceCreateRelationsFromTree } from "./utils/mapSubspaceCreateSelectedRelation";
import type { SubspaceCreateSelectedRelation } from "./utils/mapSubspaceCreateSelectedRelation";
import type { SubspaceCreateSelectedObject } from "./utils/mapSubspaceCreateSelectedObject";
import { mapSubspaceCreateRequest } from "./utils/mapSubspaceCreateRequest";
import type { SubspaceCreatePropertyFilterState } from "./utils/mapSubspaceCreateRequest";

const route = useRoute();
const router = useRouter();
const currentStepIndex = ref(0);
const selectedObjects = ref<SubspaceCreateSelectedObject[]>([]);
const selectedInstanceIds = ref<string[]>([]);
const selectedPropertyIds = ref<string[]>([]);
const propertyFilters = ref<Record<string, SubspaceCreatePropertyFilterState>>({});
const selectedRelationIds = ref<string[]>([]);
const instanceGroups = ref<SubspaceCreateInstanceGroup[]>([]);
const instanceLoadStatus = ref<"idle" | "loading" | "success" | "empty" | "error">("idle");
const instanceLoadError = ref("");
let instanceRequestGeneration = 0;
const instancePageRequestGenerations = new Map<string, number>();
const selectedCount = computed(() => selectedObjects.value.length);
const propertyGroups = ref<SubspaceCreateObjectPropertyGroup[]>([]);
const propertyLoadStatus = ref<"idle" | "loading" | "success" | "empty" | "error">("idle");
const propertyLoadError = ref("");
let propertyRequestGeneration = 0;
const relationRows = ref<SubspaceCreateSelectedRelation[]>([]);
const relationLoadStatus = ref<"idle" | "loading" | "success" | "empty" | "error">("idle");
const relationLoadError = ref("");
let relationRequestGeneration = 0;
const creating = ref(false);
const spaceName = ref(`${String(route.query.spaceName || "海军本体空间")}子空间`);
const apiName = ref(`subspace_${Date.now()}`);
const parentSpaceName = computed(() => String(route.query.spaceName || "海军本体空间"));

watch(selectedObjects, () => {
  instanceRequestGeneration += 1;
  instancePageRequestGenerations.clear();
  if (currentStepIndex.value === 0) {
    instanceGroups.value = [];
    selectedInstanceIds.value = [];
    instanceLoadStatus.value = "idle";
    instanceLoadError.value = "";
    propertyGroups.value = [];
    propertyLoadStatus.value = "idle";
    propertyLoadError.value = "";
    propertyFilters.value = {};
  }
  relationRequestGeneration += 1;
  relationRows.value = [];
  selectedRelationIds.value = [];
  relationLoadStatus.value = "idle";
  relationLoadError.value = "";
});

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
async function advanceSubspaceCreateStep() {
  if (!spaceName.value.trim() || !apiName.value.trim()) {
    ElMessage.warning("请填写子空间名称和 API 名称");
    return;
  }
  if (currentStepIndex.value === 0) {
    if (!selectedCount.value) {
      ElMessage.warning("请至少选择一个本体对象");
      return;
    }
    if (instanceLoadStatus.value === "loading") return;
    await loadSelectedObjectInstances();
    if (instanceLoadStatus.value === "error") return;
    currentStepIndex.value = 1;
    return;
  }
  if (currentStepIndex.value === 1) {
    if (propertyLoadStatus.value === "loading") return;
    await loadSelectedObjectProperties();
    if (propertyLoadStatus.value === "error") return;
    currentStepIndex.value = 2;
    return;
  }
  if (currentStepIndex.value === 2) {
    const missingObjectLabels = listSubspaceCreateObjectsMissingProperties(propertyGroups.value, selectedPropertyIds.value);
    if (missingObjectLabels.length) {
      ElMessage.warning(`请为对象「${missingObjectLabels.join("、")}」选择属性`);
      return;
    }
    if (relationLoadStatus.value === "loading") return;
    await loadParentSpaceRelations();
    if (relationLoadStatus.value === "error") return;
    currentStepIndex.value = 3;
  }
}

/**
 * @description 查询父空间关系列表并筛选来源、目标均属于已选对象的关系。
 */
async function loadParentSpaceRelations() {
  const requestGeneration = ++relationRequestGeneration;
  const spaceId = String(route.params.spaceId ?? "").trim();
  relationLoadStatus.value = "loading";
  relationLoadError.value = "";
  relationRows.value = [];
  selectedRelationIds.value = [];
  if (!spaceId) {
    relationLoadStatus.value = "empty";
    return;
  }
  try {
    const results = await Promise.allSettled(
      selectedObjects.value.map((object) =>
        getOntologyRelationCategoryTreeInterface({
          spaceId,
          ontologyUniqueIdentifierFrom: object.id,
        }),
      ),
    );
    if (requestGeneration !== relationRequestGeneration) return;
    const failedResult = results.find((result) => result.status === "rejected");
    if (failedResult?.status === "rejected") {
      throw failedResult.reason instanceof Error ? failedResult.reason : new Error("父空间关系列表查询失败");
    }
    const relationRowsById = new Map<string, SubspaceCreateSelectedRelation>();
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      if (result.value.code !== 200) throw new Error(result.value.message || "父空间关系列表查询失败");
      for (const row of mapSubspaceCreateRelationsFromTree(result.value.data, selectedObjects.value)) {
        relationRowsById.set(row.id, row);
      }
    }
    relationRows.value = [...relationRowsById.values()];
    relationLoadStatus.value = relationRows.value.length ? "success" : "empty";
  } catch (cause) {
    if (requestGeneration !== relationRequestGeneration) return;
    relationLoadStatus.value = "error";
    relationLoadError.value = cause instanceof Error && cause.message.trim() ? cause.message : "父空间关系列表查询失败，请重试。";
  }
}

/**
 * @description 重试父空间关系列表查询。
 */
async function retryParentSpaceRelations() {
  await loadParentSpaceRelations();
  if (relationLoadStatus.value !== "error") currentStepIndex.value = 3;
}

/** @description 按选中对象逐个查询对象属性列表。 */
async function loadSelectedObjectProperties() {
  const generation = ++propertyRequestGeneration;
  const objects = selectedObjects.value.slice();
  propertyLoadStatus.value = "loading";
  propertyLoadError.value = "";
  propertyGroups.value = objects.map((object) => ({ objectId: object.id, objectLabel: object.label, properties: [] }));
  const results = await Promise.allSettled(objects.map((object) => queryObjectProperties(object)));
  if (generation !== propertyRequestGeneration) return;
  const groups = results.map((result, index) => {
    const object = objects[index];
    if (!object) throw new Error("属性查询结果与对象不匹配");
    return result.status === "fulfilled"
      ? { group: result.value, error: "" }
      : { group: { objectId: object.id, objectLabel: object.label, properties: [] }, error: resolveInstanceError(result.reason) };
  });
  const hasError = groups.some((item) => item.error);
  propertyGroups.value = groups.map((item) => item.group);
  propertyLoadStatus.value = hasError ? "error" : groups.some((item) => item.group.properties.length > 0) ? "success" : "empty";
  if (hasError) propertyLoadError.value = "部分对象属性查询失败，请重试。";
}

/** @description 查询指定对象的属性列表。 @param object 本体对象。 @returns 属性分组。 */
async function queryObjectProperties(object: SubspaceCreateSelectedObject): Promise<SubspaceCreateObjectPropertyGroup> {
  const response = await getOntologyPropertyByOntologyIdInterface({ ontologyUniqueIdentifier: object.id });
  if (response.code !== 200) throw new Error(response.message || "属性查询失败");
  return mapSubspaceCreateObjectPropertyGroup(Array.isArray(response.data) ? response.data : [], object);
}

/**
 * @description 重试对象属性查询，成功后继续进入属性配置步骤。
 */
async function retryObjectProperties() {
  await loadSelectedObjectProperties();
  if (propertyLoadStatus.value !== "error") {
    currentStepIndex.value = 2;
  }
}

/** @description 按选中对象逐个查询第一页实体实例。 */
async function loadSelectedObjectInstances() {
  const generation = ++instanceRequestGeneration;
  const objects = selectedObjects.value.slice();
  instancePageRequestGenerations.clear();
  instanceLoadStatus.value = "loading";
  instanceLoadError.value = "";
  selectedInstanceIds.value = [];
  instanceGroups.value = objects.map((object) => createInstanceGroup(object.id, object.label));
  try {
    const results = await Promise.allSettled(objects.map((object) => queryObjectInstances(object.id, object.label, 1, SUBSPACE_CREATE_INSTANCE_PAGE_SIZE)));
    if (generation !== instanceRequestGeneration) return;
    const groups = results.map((result, index) => {
      const object = objects[index];
      if (!object) throw new Error("实例查询结果与对象不匹配");
      if (result.status === "fulfilled") return result.value;
      return {
        ...createInstanceGroup(object.id, object.label),
        status: "error" as const,
        error: resolveInstanceError(result.reason),
      };
    });
    instanceGroups.value = groups;
    const hasError = groups.some((group) => group.status === "error");
    instanceLoadStatus.value = hasError ? "error" : groups.some((group) => group.instances.length > 0) ? "success" : "empty";
    if (hasError) instanceLoadError.value = "部分对象实例查询失败，请重试。";
  } catch (cause) {
    if (generation !== instanceRequestGeneration) {
      return;
    }
    instanceLoadStatus.value = "error";
    instanceLoadError.value = resolveInstanceError(cause);
  }
}

/** @description 查询指定对象的一页实体实例并映射为页面分组。 */
async function queryObjectInstances(objectId: string, objectLabel: string, page: number, pageSize: number): Promise<SubspaceCreateInstanceGroup> {
  const response = await getOntologyEntitiesInterface({ ontologyUniqueIdentifier: objectId, pageNum: page, pageSize });
  if (response.code !== 200) throw new Error(response.message || "实例查询失败");
  const data = response.data;
  const records = Array.isArray(data.records) ? data.records : [];
  return {
    objectId,
    objectLabel,
    instances: mapSubspaceCreateSelectedInstances(records, { id: objectId, label: objectLabel, apiName: objectId }),
    total: Number(data.total) || records.length,
    page: Number(data.current) || page,
    pageSize: Number(data.size) || pageSize,
    status: records.length ? "success" : "empty",
    error: "",
  };
}

/** @description 创建对象实例分组的加载占位数据。 */
function createInstanceGroup(objectId: string, objectLabel: string): SubspaceCreateInstanceGroup {
  return { objectId, objectLabel, instances: [], total: 0, page: 1, pageSize: SUBSPACE_CREATE_INSTANCE_PAGE_SIZE, status: "loading", error: "" };
}

/** @description 查询对象指定页的实例。 */
async function loadObjectInstancePage(objectId: string, page: number, requestedPageSize?: number) {
  const object = selectedObjects.value.find((item) => item.id === objectId);
  if (!object) return;
  const current = instanceGroups.value.find((group) => group.objectId === objectId);
  const pageSize = requestedPageSize ?? current?.pageSize ?? SUBSPACE_CREATE_INSTANCE_PAGE_SIZE;
  const loadGeneration = instanceRequestGeneration;
  const requestGeneration = (instancePageRequestGenerations.get(objectId) ?? 0) + 1;
  instancePageRequestGenerations.set(objectId, requestGeneration);
  instanceGroups.value = instanceGroups.value.map((group) =>
    group.objectId === objectId ? { ...group, page, pageSize, status: "loading", error: "" } : group,
  );
  try {
    const next = await queryObjectInstances(object.id, object.label, page, pageSize);
    if (instancePageRequestGenerations.get(objectId) !== requestGeneration || instanceRequestGeneration !== loadGeneration) return;
    instanceGroups.value = instanceGroups.value.map((group) => (group.objectId === objectId ? next : group));
  } catch (cause) {
    if (instancePageRequestGenerations.get(objectId) !== requestGeneration || instanceRequestGeneration !== loadGeneration) return;
    instanceGroups.value = instanceGroups.value.map((group) =>
      group.objectId === objectId ? { ...group, status: "error", error: resolveInstanceError(cause) } : group,
    );
    instanceLoadError.value = "实例查询失败，请重试。";
  }
}

/**
 * @description 将未知异常转换为页面可展示的实例查询错误。
 * @param cause 异常值。
 * @returns 页面错误文案。
 */
function resolveInstanceError(cause: unknown): string {
  return cause instanceof Error && cause.message.trim() ? cause.message : "实例查询失败，请重试。";
}

/** @description 根据页大小变化重新查询对象实例第一页。 */
function loadObjectInstancePageSize(objectId: string, pageSize: number) {
  void loadObjectInstancePage(objectId, 1, pageSize);
}

/** @description 重试对象实例当前页查询。 */
function retryObjectInstancePage(objectId: string) {
  if (instanceLoadStatus.value === "error") {
    void loadSelectedObjectInstances();
    return;
  }
  const group = instanceGroups.value.find((item) => item.objectId === objectId);
  if (group) void loadObjectInstancePage(objectId, group.page);
}

/**
 * @description 校验已选关系后完成子空间创建，并返回进入本页之前的路由。
 */
async function createSubspace() {
  if (!spaceName.value.trim() || !apiName.value.trim()) {
    ElMessage.warning("请填写子空间名称和 API 名称");
    return;
  }
  if (creating.value) return;
  const parentSpaceId = String(route.params.spaceId ?? "").trim();
  if (!parentSpaceId) {
    ElMessage.error("缺少父空间标识，无法创建子空间");
    return;
  }
  creating.value = true;
  try {
    const response = await createOntologySubspaceInterface(
      mapSubspaceCreateRequest({
        parentSpaceId,
        displayName: spaceName.value,
        apiName: apiName.value,
        selectedObjects: selectedObjects.value,
        instanceGroups: instanceGroups.value,
        selectedInstanceIds: selectedInstanceIds.value,
        selectedPropertyIds: selectedPropertyIds.value,
        propertyGroups: propertyGroups.value,
        propertyFilters: propertyFilters.value,
        selectedRelationIds: selectedRelationIds.value,
        relationRows: relationRows.value,
      }),
    );
    if (response.code !== 200) throw new Error(response.message || "子空间创建失败");
    ElMessage.success("子空间创建成功");
    await router.back();
  } catch (cause) {
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "子空间创建失败，请重试");
  } finally {
    creating.value = false;
  }
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
