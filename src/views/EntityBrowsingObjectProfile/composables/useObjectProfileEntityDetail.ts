import { computed, onScopeDispose, ref, watch, type Ref } from "vue";
import {
  getListOntologyActionInterface,
  getOntologyObjectArrTypeTreeInterface,
  postGetOntologyEntityRowDetailInterface,
  postOntologyEntityLinksInterface,
} from "@/apis";
import type {
  OntologyRelationClass,
  ListOntologyActionRecord,
  ObjectProfileEntityCategory,
  ObjectProfileEntityIdentity,
  ObjectProfileEntityProperty,
} from "@/types";
import {
  buildEntityRelationRows,
  buildEntityListPropertyRows,
  buildEntityCategoryTree,
  buildEntityPropertyRows,
  filterEntityPropertyRows,
  parseEntityPrimaryKey,
} from "../utils/entityDetailData";

/** @description 独立管理实体关系、属性、对象分类和对象行为请求，屏蔽重复请求、过期响应和卸载后的更新。 @param identity 当前实体身份。 @returns 详情各区域数据与重试方法。 */
export function useObjectProfileEntityDetail(identity: Ref<ObjectProfileEntityIdentity>) {
  const relations = ref<OntologyRelationClass[]>([]);
  const relationStatus = ref<"loading" | "ready" | "empty" | "error">("loading");
  const relationError = ref("");
  let relationPending = "";
  const properties = ref<ObjectProfileEntityProperty[]>([]);
  const categories = ref<ObjectProfileEntityCategory[]>([]);
  const behaviors = ref<ListOntologyActionRecord[]>([]);
  const selectedCategoryId = ref("all");
  const propertyStatus = ref<"loading" | "ready" | "empty" | "error">("loading");
  const categoryStatus = ref<"loading" | "ready" | "empty" | "error">("loading");
  const behaviorStatus = ref<"loading" | "ready" | "empty" | "error">("loading");
  const propertyError = ref("");
  const categoryError = ref("");
  const behaviorError = ref("");
  const behaviorPage = ref(1);
  const behaviorPageSize = 8;
  const behaviorTotal = ref(0);
  const usingListProperties = computed(() => propertyStatus.value === "error" && Boolean(identity.value.listProperties?.length));
  const displayProperties = computed(() =>
    usingListProperties.value ? buildEntityListPropertyRows(identity.value.listProperties ?? [], categories.value) : properties.value,
  );
  const filteredProperties = computed(() => filterEntityPropertyRows(displayProperties.value, categories.value, selectedCategoryId.value));
  let disposed = false;
  let generation = 0;
  let propertyPending = "";
  let categoryPending = "";
  let behaviorPending = "";
  let behaviorRevision = 0;

  /** @description 查询当前实体属性，重复调用时保留进行中的请求。 */
  async function loadEntityProperties(): Promise<void> {
    if (disposed) return;
    const current = { ...identity.value };
    const key = JSON.stringify(current);
    if (propertyPending === key) return;
    propertyPending = key;
    const request = generation;
    propertyStatus.value = "loading";
    propertyError.value = "";
    properties.value = [];
    try {
      if (!current.objectId.trim()) throw new Error("缺少对象标识");
      const response = await postGetOntologyEntityRowDetailInterface({
        ontologyUniqueIdentifier: current.objectId,
        entityPrimaryKey: current.entityPrimaryKey ?? parseEntityPrimaryKey(current.instanceId),
        sort: "DESC",
      });
      if (disposed || request !== generation) return;
      if (response.code !== 200) throw new Error(response.message || "实体属性加载失败");
      properties.value = buildEntityPropertyRows(response.data);
      propertyStatus.value = properties.value.length ? "ready" : "empty";
    } catch (cause) {
      if (disposed || request !== generation) return;
      propertyError.value = cause instanceof Error ? cause.message : "实体属性加载失败";
      propertyStatus.value = "error";
    } finally {
      if (request === generation) propertyPending = "";
    }
  }

  /** @description 查询实体所属对象的属性分类，失败不影响属性与行为展示。 */
  async function loadPropertyCategories(): Promise<void> {
    if (disposed) return;
    const objectId = identity.value.objectId.trim();
    if (categoryPending === objectId && categoryPending) return;
    categoryPending = objectId;
    const request = generation;
    categoryStatus.value = "loading";
    categoryError.value = "";
    categories.value = [];
    try {
      if (!objectId) throw new Error("缺少对象标识");
      const response = await getOntologyObjectArrTypeTreeInterface({ ontologyUniqueIdentifier: objectId });
      if (disposed || request !== generation) return;
      if (response.code !== 200) throw new Error(response.message || "属性分类加载失败");
      categories.value = buildEntityCategoryTree(response.data);
      categoryStatus.value = categories.value.length ? "ready" : "empty";
    } catch (cause) {
      if (disposed || request !== generation) return;
      categoryError.value = cause instanceof Error ? cause.message : "属性分类加载失败";
      categoryStatus.value = "error";
    } finally {
      if (request === generation) categoryPending = "";
    }
  }

  /** @description 按对象查询行为卡片，分页切换时仅接受最新响应。 @param page 行为页码。 */
  async function loadEntityBehaviors(page = behaviorPage.value): Promise<void> {
    if (disposed) return;
    const current = { ...identity.value };
    const key = JSON.stringify([current, page]);
    if (behaviorPending === key) return;
    behaviorPending = key;
    const request = generation;
    const revision = ++behaviorRevision;
    behaviorPage.value = page;
    behaviorStatus.value = "loading";
    behaviorError.value = "";
    behaviors.value = [];
    try {
      const spaceId = Number(current.spaceId);
      if (!current.spaceId.trim() || !Number.isFinite(spaceId) || !current.objectId.trim()) throw new Error("缺少有效空间或对象标识");
      const response = await getListOntologyActionInterface({
        ontologySpaceId: spaceId,
        ontologyId: current.objectId,
        status: 1,
        pageNum: page,
        pageSize: behaviorPageSize,
      });
      if (disposed || request !== generation || revision !== behaviorRevision) return;
      if (response.code !== 200) throw new Error(response.message || "对象行为加载失败");
      behaviors.value = response.data?.records ?? [];
      behaviorTotal.value = response.data?.total ?? 0;
      behaviorStatus.value = behaviors.value.length ? "ready" : "empty";
    } catch (cause) {
      if (disposed || request !== generation || revision !== behaviorRevision) return;
      behaviorError.value = cause instanceof Error ? cause.message : "对象行为加载失败";
      behaviorStatus.value = "error";
    } finally {
      if (request === generation && revision === behaviorRevision) behaviorPending = "";
    }
  }

  /** @description 查询当前实例所有关系，去重并拒绝切换实例或卸载后的旧响应。 */
  async function loadEntityRelations(): Promise<void> {
    if (disposed) return;
    const current = { ...identity.value };
    const key = JSON.stringify([current.objectId, current.instanceId, current.entityPrimaryKey]);
    if (relationPending === key) return;
    relationPending = key;
    const revision = generation;
    relationStatus.value = "loading";
    relationError.value = "";
    relations.value = [];
    try {
      if (!current.objectId.trim()) throw new Error("缺少对象标识");
      const response = await postOntologyEntityLinksInterface({
        ontologyUniqueIdentifier: current.objectId,
        entityPrimaryKey: current.entityPrimaryKey ?? parseEntityPrimaryKey(current.instanceId),
      });
      if (disposed || revision !== generation) return;
      if (response.code !== 200) throw new Error(response.message || "实体关系加载失败");
      if (response.data != null && !Array.isArray(response.data)) throw new Error("实体关系响应格式错误");
      relations.value = buildEntityRelationRows(response.data ?? []);
      relationStatus.value = relations.value.length ? "ready" : "empty";
    } catch (cause) {
      if (disposed || revision !== generation) return;
      relationError.value = cause instanceof Error ? cause.message : "实体关系加载失败";
      relationStatus.value = "error";
    } finally {
      if (revision === generation) relationPending = "";
    }
  }

  watch(
    identity,
    () => {
      generation += 1;
      propertyPending = categoryPending = behaviorPending = relationPending = "";
      selectedCategoryId.value = "all";
      behaviorPage.value = 1;
      behaviorTotal.value = 0;
      void loadEntityRelations();
      void loadEntityProperties();
      void loadPropertyCategories();
      void loadEntityBehaviors(1);
    },
    { immediate: true, deep: true, flush: "sync" },
  );
  onScopeDispose(() => {
    disposed = true;
    generation += 1;
    behaviorRevision += 1;
  });
  return {
    relations,
    relationStatus,
    relationError,
    loadEntityRelations,
    properties,
    categories,
    behaviors,
    selectedCategoryId,
    filteredProperties,
    displayProperties,
    usingListProperties,
    propertyStatus,
    categoryStatus,
    behaviorStatus,
    propertyError,
    categoryError,
    behaviorError,
    behaviorPage,
    behaviorPageSize,
    behaviorTotal,
    loadEntityProperties,
    loadPropertyCategories,
    loadEntityBehaviors,
  };
}
