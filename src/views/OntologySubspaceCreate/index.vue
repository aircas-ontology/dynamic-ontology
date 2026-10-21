<template>
  <section class="ontology-subspace-create" aria-label="创建主题">
    <button
      v-if="isThemeSpaceCreation"
      class="ontology-subspace-create__help"
      type="button"
      aria-label="打开新手引导"
      title="新手引导"
      @click="openOnboardingGuide()"
    >
      <el-icon><QuestionFilled /></el-icon>
    </button>
    <SubspaceCreateTreePanel :current-step-index="currentStepIndex" :guide-mode="isGuideDemoMode" @update:selected-objects="selectedObjects = $event" />
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
    <OnboardingGuideOverlay
      v-if="isThemeSpaceCreation"
      v-model="guideVisible"
      :steps="themeOnboardingGuideSteps"
      :start-id="guideStartId"
      @step-change="handleGuideStepChange"
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
import OnboardingGuideOverlay from "@/components/OnboardingGuide/OnboardingGuideOverlay.vue";
import { useOnboardingGuide } from "@/composables/shared/useOnboardingGuide";
import type { OnboardingGuideStep } from "@/composables/shared/useOnboardingGuide";
import {
  queryGuideOntologyEntities,
  queryGuideOntologyProperties,
  queryGuideOntologyRelationTree,
} from "@/mocks/ontologySubspaceCreateGuideMock/ontologySubspaceCreateGuideMock";
import { ONBOARDING_GUIDE_ENTRY_IDS, THEME_ONBOARDING_GUIDE_STEPS } from "@/views/onboardingGuideSteps";
import { QuestionFilled } from "@element-plus/icons-vue";
import type { ApiResponse, OntologyRelationCategoryTreeData } from "@/types";
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
const parentSpaceId = computed(() => String(route.params.spaceId || route.query.spaceId || "").trim());
const isThemeSpaceCreation = computed(() => route.query.from === "theme-space-management");
/**
 * @description 引导演示模式：仅当从主题管理页的新手引导进入（query 携带 guide=1）时生效；
 *              真实「新建主题」入口不带 guide 参数，仍走真实接口与真实创建。
 */
const isGuideDemoMode = computed(() => isThemeSpaceCreation.value && route.query.guide === "1");
const spaceName = ref(`${String(route.query.spaceName || "海军对象空间")}${isThemeSpaceCreation.value ? "主题" : "子空间"}`);
const apiName = ref(`subspace_${Date.now()}`);
const parentSpaceName = computed(() => String(route.query.spaceName || "海军对象空间"));
const themeOnboardingGuideSteps = THEME_ONBOARDING_GUIDE_STEPS;
const {
  visible: guideVisible,
  startId: guideStartId,
  openOnboardingGuide,
} = useOnboardingGuide({
  steps: themeOnboardingGuideSteps,
  page: "theme-create",
  entryStepId: ONBOARDING_GUIDE_ENTRY_IDS["theme-create"],
});

/** 演示流程退出导航进行中标志，避免创建成功与引导关闭两条路径重复触发路由跳转。 */
let guideDemoLeaving = false;

/**
 * @description 退出创建主题演示流程并直接回到主题管理页；使用 replace 替换当前记录，不留历史回退。
 */
async function leaveGuideDemoToThemeManagement() {
  if (guideDemoLeaving || route.name === "ThemeSpaceManagement") return;
  guideDemoLeaving = true;
  await router.replace({ name: "ThemeSpaceManagement" });
}

/**
 * @description 引导步骤变化时同步页面导航：演示模式下引导切到其他页面的步骤（如跳过新建主题、进入创建对象步骤）时，
 *              回到主题管理页让引导在同一页面续接；不清空续接状态，保证后续大步骤自动继续。
 * @param step 切换后的引导步骤。
 */
function handleGuideStepChange(step: OnboardingGuideStep) {
  if (isGuideDemoMode.value && step.page !== "theme-create") void leaveGuideDemoToThemeManagement();
}

watch(guideVisible, (value, previous) => {
  if (previous && !value && isGuideDemoMode.value) void leaveGuideDemoToThemeManagement();
});

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
 * @description 按路由历史返回进入主题创建页之前的页面；演示模式下直接回到主题管理页。
 */
function goBackToSpaceList() {
  if (isGuideDemoMode.value) {
    void leaveGuideDemoToThemeManagement();
    return;
  }
  void router.back();
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
    ElMessage.warning("请填写主题名称和 API 名称");
    return;
  }
  if (currentStepIndex.value === 0) {
    if (!selectedCount.value) {
      ElMessage.warning("请至少选择一个对象");
      return;
    }
    if (instanceLoadStatus.value === "loading") return;
    await loadSelectedObjectInstances();
    if (instanceLoadStatus.value === "error") return;
    if (isGuideDemoMode.value) selectAllObjectInstances();
    currentStepIndex.value = 1;
    return;
  }
  if (currentStepIndex.value === 1) {
    if (propertyLoadStatus.value === "loading") return;
    await loadSelectedObjectProperties();
    if (propertyLoadStatus.value === "error") return;
    if (isGuideDemoMode.value) selectAllObjectProperties();
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
    if (isGuideDemoMode.value) selectAllObjectRelations();
    currentStepIndex.value = 3;
  }
}

/** @description 演示模式下默认勾选当前已加载的全部对象实例。 */
function selectAllObjectInstances() {
  selectedInstanceIds.value = instanceGroups.value.flatMap((group) => group.instances.map((instance) => instance.id));
}

/** @description 演示模式下默认勾选当前已加载的全部关系。 */
function selectAllObjectRelations() {
  selectedRelationIds.value = relationRows.value.map((row) => row.id);
}

/**
 * @description 查询父空间关系列表并筛选来源、目标均属于已选对象的关系。
 */
async function loadParentSpaceRelations() {
  const requestGeneration = ++relationRequestGeneration;
  const spaceId = parentSpaceId.value;
  relationLoadStatus.value = "loading";
  relationLoadError.value = "";
  relationRows.value = [];
  selectedRelationIds.value = [];
  if (!spaceId) {
    relationLoadStatus.value = "empty";
    return;
  }
  try {
    const results = await Promise.allSettled(selectedObjects.value.map((object) => querySpaceRelationTree(spaceId, object.id)));
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
 * @description 查询父空间关系分类树；演示模式返回演示关系数据。
 * @param spaceId 父空间 id。
 * @param objectId 关系起点对象 id。
 * @returns 关系分类树响应。
 */
function querySpaceRelationTree(spaceId: string, objectId: string): Promise<ApiResponse<OntologyRelationCategoryTreeData>> {
  if (isGuideDemoMode.value) {
    return Promise.resolve(queryGuideOntologyRelationTree({ spaceId, ontologyUniqueIdentifierFrom: objectId }));
  }
  return getOntologyRelationCategoryTreeInterface({ spaceId, ontologyUniqueIdentifierFrom: objectId });
}

/**
 * @description 重试父空间关系列表查询。
 */
async function retryParentSpaceRelations() {
  await loadParentSpaceRelations();
  if (relationLoadStatus.value !== "error") {
    if (isGuideDemoMode.value) selectAllObjectRelations();
    currentStepIndex.value = 3;
  }
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

/** @description 查询指定对象的属性列表；演示模式返回演示属性数据。 @param object 对象。 @returns 属性分组。 */
async function queryObjectProperties(object: SubspaceCreateSelectedObject): Promise<SubspaceCreateObjectPropertyGroup> {
  const response = isGuideDemoMode.value
    ? queryGuideOntologyProperties({ ontologyUniqueIdentifier: object.id })
    : await getOntologyPropertyByOntologyIdInterface({ ontologyUniqueIdentifier: object.id });
  if (response.code !== 200) throw new Error(response.message || "属性查询失败");
  return mapSubspaceCreateObjectPropertyGroup(Array.isArray(response.data) ? response.data : [], object);
}

/**
 * @description 重试对象属性查询，成功后继续进入属性配置步骤。
 */
async function retryObjectProperties() {
  await loadSelectedObjectProperties();
  if (propertyLoadStatus.value !== "error") {
    if (isGuideDemoMode.value) selectAllObjectProperties();
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

/** @description 查询指定对象的一页实体实例并映射为页面分组；演示模式返回演示实例数据。 */
async function queryObjectInstances(objectId: string, objectLabel: string, page: number, pageSize: number): Promise<SubspaceCreateInstanceGroup> {
  const response = isGuideDemoMode.value
    ? queryGuideOntologyEntities({ ontologyUniqueIdentifier: objectId, pageNum: page, pageSize })
    : await getOntologyEntitiesInterface({ ontologyUniqueIdentifier: objectId, pageNum: page, pageSize });
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
 * @description 校验已选关系后完成子空间创建，并返回进入本页之前的路由；
 *              演示模式不调用创建接口，仅提示演示完成并回到主题管理页。
 */
async function createSubspace() {
  if (!spaceName.value.trim() || !apiName.value.trim()) {
    ElMessage.warning("请填写主题名称和 API 名称");
    return;
  }
  if (creating.value) return;
  const parentSpaceId = String(route.params.spaceId ?? route.query.spaceId ?? "").trim();
  if (!parentSpaceId) {
    ElMessage.error("缺少父空间标识，无法创建子空间");
    return;
  }
  if (isGuideDemoMode.value) {
    ElMessage.success("引导演示已完成，未真实创建主题");
    // 不清空引导续接状态：引导在主题管理页继续「创建对象」大步骤。
    await leaveGuideDemoToThemeManagement();
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

.ontology-subspace-create__help {
  position: fixed;
  top: 53px;
  right: 18px;
  z-index: 4;
  display: inline-flex;
  padding: 6px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-panel-background);
  cursor: pointer;
}
.ontology-subspace-create__help:hover {
  color: var(--aircas-color-primary);
}
.ontology-subspace-create__help:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 2px;
}

@media (max-width: 1000px) {
  .ontology-subspace-create {
    height: auto;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(280px, 38vh) minmax(520px, auto);
  }
}
</style>
