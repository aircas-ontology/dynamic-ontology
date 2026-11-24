import { computed, onScopeDispose, reactive, ref, watch, type Ref } from "vue";
import {
  getListOntologyActionInterface,
  getOntologyObjectArrTypeTreeInterface,
  getOntologyPropertyByOntologyIdInterface,
  postGetOntologyEntityRowDetailPageInterface,
  postOntologyEntityIdsQueryInterface,
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
  buildEntityMainPropertyRows,
  buildEntityPagedGroupPropertyRows,
  filterEntityPropertyRows,
  listNonMainStorageGroups,
  parseEntityPrimaryKey,
} from "../utils/entityDetailData";

/** 子表分页默认每页条数。 */
const SUBTABLE_PAGE_SIZE = 10;

/** 单个子表分页状态。 */
export interface ObjectProfileSubtableState {
  page: number;
  pageSize: number;
  total: number;
  status: "loading" | "ready" | "empty" | "error";
  error: string;
  rows: ObjectProfileEntityProperty[];
}

/**
 * @description 独立管理实体关系、属性、对象分类和对象行为请求，屏蔽重复请求、过期响应和卸载后的更新。
 * @param identity 当前实体身份。
 * @returns 详情各区域数据与重试方法。
 */
export function useObjectProfileEntityDetail(identity: Ref<ObjectProfileEntityIdentity>) {
  const relations = ref<OntologyRelationClass[]>([]);
  const relationStatus = ref<"loading" | "ready" | "empty" | "error">("loading");
  const relationError = ref("");
  let relationPending = "";
  const mainProperties = ref<ObjectProfileEntityProperty[]>([]);
  const subtables = reactive<Record<string, ObjectProfileSubtableState>>({});
  const storageGroups = ref<string[]>([]);
  const properties = computed(() => [...mainProperties.value, ...storageGroups.value.flatMap((group) => subtables[group]?.rows ?? [])]);
  const categories = ref<ObjectProfileEntityCategory[]>([]);
  const behaviors = ref<ListOntologyActionRecord[]>([]);
  const selectedCategoryId = ref("all");
  const selectedBehaviorCategoryId = ref("all");
  const propertyStatus = ref<"loading" | "ready" | "empty" | "error">("loading");
  const categoryStatus = ref<"loading" | "ready" | "empty" | "error">("loading");
  const behaviorStatus = ref<"loading" | "ready" | "empty" | "error">("loading");
  const propertyError = ref("");
  const categoryError = ref("");
  const behaviorError = ref("");
  const behaviorPage = ref(1);
  const behaviorPageSize = 12;
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
  const subtablePending = new Map<string, string>();

  /**
   * @description 清空主表与子表属性状态，保留传入的分组名列表。
   * @param groups 待保留的子表分组。
   */
  function resetPropertyState(groups: string[] = []): void {
    mainProperties.value = [];
    storageGroups.value = groups;
    for (const key of Object.keys(subtables)) delete subtables[key];
    for (const group of groups) {
      subtables[group] = {
        page: 1,
        pageSize: SUBTABLE_PAGE_SIZE,
        total: 0,
        status: "loading",
        error: "",
        rows: [],
      };
    }
  }

  /**
   * @description 解析当前实体主键，优先使用列表保留的原始主键。
   * @param current 实体身份。
   * @returns 接口主键。
   */
  function resolveEntityPrimaryKey(current: ObjectProfileEntityIdentity) {
    return current.entityPrimaryKey ?? parseEntityPrimaryKey(current.instanceId);
  }

  /**
   * @description 加载单个子表指定页，拒绝过期响应并更新该组状态。
   * @param storageGroup 存储分组名。
   * @param page 页码。
   * @param requestGeneration 发起时的 generation。
   */
  async function loadSubtablePageInternal(storageGroup: string, page: number, requestGeneration: number): Promise<void> {
    const current = { ...identity.value };
    const key = JSON.stringify([current.objectId, current.instanceId, current.entityPrimaryKey, storageGroup, page]);
    if (subtablePending.get(storageGroup) === key) return;
    subtablePending.set(storageGroup, key);
    if (!subtables[storageGroup]) {
      subtables[storageGroup] = {
        page,
        pageSize: SUBTABLE_PAGE_SIZE,
        total: 0,
        status: "loading",
        error: "",
        rows: [],
      };
    } else {
      subtables[storageGroup].status = "loading";
      subtables[storageGroup].error = "";
      subtables[storageGroup].page = page;
    }
    try {
      const response = await postGetOntologyEntityRowDetailPageInterface({
        ontologyUniqueIdentifier: current.objectId,
        entityPrimaryKey: resolveEntityPrimaryKey(current),
        sort: "DESC",
        storageGroup,
        pageNum: page,
        pageSize: SUBTABLE_PAGE_SIZE,
      });
      if (disposed || requestGeneration !== generation) return;
      if (response.code !== 200) throw new Error(response.message || `子表 ${storageGroup} 加载失败`);
      const rows = buildEntityPagedGroupPropertyRows(storageGroup, response.data);
      subtables[storageGroup].rows = rows;
      subtables[storageGroup].total = response.data?.total ?? 0;
      subtables[storageGroup].page = response.data?.current ?? page;
      subtables[storageGroup].pageSize = response.data?.size ?? SUBTABLE_PAGE_SIZE;
      subtables[storageGroup].status = rows.length ? "ready" : "empty";
      subtables[storageGroup].error = "";
    } catch (cause) {
      if (disposed || requestGeneration !== generation) return;
      subtables[storageGroup].rows = [];
      subtables[storageGroup].status = "error";
      subtables[storageGroup].error = cause instanceof Error ? cause.message : `子表 ${storageGroup} 加载失败`;
    } finally {
      if (subtablePending.get(storageGroup) === key) subtablePending.delete(storageGroup);
    }
  }

  /**
   * @description 切换子表分页并刷新当前分组。
   * @param storageGroup 存储分组名。
   * @param page 目标页码。
   */
  async function loadSubtablePage(storageGroup: string, page: number): Promise<void> {
    if (disposed || !storageGroup.trim() || page < 1) return;
    await loadSubtablePageInternal(storageGroup, page, generation);
  }

  /** @description 查询当前实体主表属性与子表首屏，重复调用时保留进行中的请求。 */
  async function loadEntityProperties(): Promise<void> {
    if (disposed) return;
    const current = { ...identity.value };
    const key = JSON.stringify(current);
    if (propertyPending === key) return;
    propertyPending = key;
    const request = generation;
    propertyStatus.value = "loading";
    propertyError.value = "";
    resetPropertyState();
    subtablePending.clear();
    try {
      if (!current.objectId.trim()) throw new Error("缺少对象标识");
      const primaryKey = resolveEntityPrimaryKey(current);
      const [mainResponse, propertyMetaResponse] = await Promise.all([
        postOntologyEntityIdsQueryInterface([
          {
            ontologyUniqueIdentifier: current.objectId,
            entityPrimaryKeys: [primaryKey],
          },
        ]),
        getOntologyPropertyByOntologyIdInterface({ ontologyUniqueIdentifier: current.objectId }),
      ]);
      if (disposed || request !== generation) return;
      if (mainResponse.code !== 200) throw new Error(mainResponse.message || "实体属性加载失败");
      const matchedGroup = (mainResponse.data ?? []).find((item) => item.ontologyUniqueIdentifier === current.objectId) ?? mainResponse.data?.[0];
      const matchedEntity =
        matchedGroup?.entityList?.find((item) => Object.is(item.primaryKey, primaryKey)) ??
        matchedGroup?.entityList?.find((item) => String(item.primaryKey) === String(primaryKey)) ??
        matchedGroup?.entityList?.[0];
      if (propertyMetaResponse.code !== 200) throw new Error(propertyMetaResponse.message || "对象属性定义加载失败");
      const propertyDefinitions = propertyMetaResponse.data ?? [];
      mainProperties.value = buildEntityMainPropertyRows(matchedEntity, propertyDefinitions);
      const groups = listNonMainStorageGroups(propertyDefinitions);
      storageGroups.value = groups;
      for (const group of groups) {
        subtables[group] = {
          page: 1,
          pageSize: SUBTABLE_PAGE_SIZE,
          total: 0,
          status: "loading",
          error: "",
          rows: [],
        };
      }
      await Promise.all(groups.map((group) => loadSubtablePageInternal(group, 1, request)));
      if (disposed || request !== generation) return;
      const hasSubtableError = groups.some((group) => subtables[group]?.status === "error");
      if (hasSubtableError && !mainProperties.value.length) {
        propertyError.value = groups.map((group) => subtables[group]?.error).find(Boolean) || "实体属性加载失败";
        propertyStatus.value = "error";
        return;
      }
      propertyStatus.value = mainProperties.value.length || groups.some((group) => (subtables[group]?.rows.length ?? 0) > 0) ? "ready" : "empty";
      propertyError.value = "";
    } catch (cause) {
      if (disposed || request !== generation) return;
      propertyError.value = cause instanceof Error ? cause.message : "实体属性加载失败";
      propertyStatus.value = "error";
      mainProperties.value = [];
      storageGroups.value = [];
      for (const keyName of Object.keys(subtables)) delete subtables[keyName];
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

  /**
   * @description 按对象查询行为卡片，分页切换时仅接受最新响应。
   * @param page 行为页码。
   */
  async function loadEntityBehaviors(page = behaviorPage.value): Promise<void> {
    if (disposed) return;
    const current = { ...identity.value };
    const key = JSON.stringify([current, page, selectedBehaviorCategoryId.value]);
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
        ...(selectedBehaviorCategoryId.value !== "all" ? { categoryId: Number(selectedBehaviorCategoryId.value) } : {}),
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
        entityPrimaryKey: resolveEntityPrimaryKey(current),
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
      subtablePending.clear();
      selectedCategoryId.value = "all";
      selectedBehaviorCategoryId.value = "all";
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
  watch(selectedBehaviorCategoryId, () => {
    void loadEntityBehaviors(1);
  });
  return {
    relations,
    relationStatus,
    relationError,
    loadEntityRelations,
    properties,
    mainProperties,
    subtables,
    storageGroups,
    categories,
    behaviors,
    selectedCategoryId,
    selectedBehaviorCategoryId,
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
    loadSubtablePage,
    loadPropertyCategories,
    loadEntityBehaviors,
  };
}
