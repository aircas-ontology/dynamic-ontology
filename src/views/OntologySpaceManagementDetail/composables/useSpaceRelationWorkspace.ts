import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import type {
  OntologyRelationCategoryNode,
  OntologyRelationClass,
  OntologySpaceRelationLoadStatus,
  RelationCategoryUpdatePayload,
  RelationCategoryWritePayload,
  RelationClassUpdatePayload,
  RelationClassWritePayload,
  RelationViewMode,
  SpaceRelationFilterState,
  SpaceRelationObjectOption,
  SpaceRelationWorkspaceData,
} from "@/types";
import { ROOT_RELATION_CATEGORY_ID } from "@/types";
import { getOntologyCategoryTreeInterface, getOntologyRelationCategoryTreeInterface } from "@/apis";
import { filterRelationsByHop } from "../utils/spaceRelationGraph";
import { mapOntologyObjectsToRelationOptions } from "../utils/mapOntologyObjectsToRelationOptions";
import { mapOntologyRelationCategoryTree, mapOntologyRelationLinks } from "../utils/mapOntologyRelationCategoryTree";
import {
  addRelation,
  addRelationCategory,
  filterRelationsByCategory,
  findRelationCategoryNode,
  removeRelation,
  removeRelationCategory,
  updateRelation,
  updateRelationCategory,
} from "../utils/relationOperations";

/**
 * @description 判断关系分类树接口是否没有返回 data。
 * @param data 接口响应中的 data 字段。
 * @returns 未返回分类树时为 true。
 */
function isMissingOntologyRelationCategoryTreeData(data: unknown): boolean {
  return data == null;
}

/**
 * @description 创建没有分类和关系的工作区。
 * @returns 空关系工作区。
 */
function createEmptySpaceRelationWorkspaceData(): SpaceRelationWorkspaceData {
  return { categoryTree: [], relations: [], objectOptions: [] };
}

/**
 * @description 按空间 id 查询对象分类树，提取本体对象作为关系源/目标可选列表；失败时返回空列表。
 * @param spaceId 路由空间 id。
 * @returns 去重后的本体对象选项。
 */
async function loadRelationObjectOptionsFromObjectTree(spaceId: string): Promise<SpaceRelationObjectOption[]> {
  try {
    const response = await getOntologyCategoryTreeInterface({ spaceId });
    if (response.code !== 200 || response.data == null) return [];
    return mapOntologyObjectsToRelationOptions(response.data);
  } catch {
    return [];
  }
}

/**
 * @description 按空间 id 查询关系分类树，并并行加载对象树上的本体对象选项；无关系树 data 时分类为空，对象选项仍可独立加载。
 * @param spaceId 路由空间 id。
 * @returns 关系工作区数据。
 */
async function loadSpaceRelationWorkspaceFromApi(spaceId: string): Promise<SpaceRelationWorkspaceData> {
  const id = spaceId.trim();
  if (!id) return createEmptySpaceRelationWorkspaceData();
  const [relationResponse, objectOptions] = await Promise.all([
    getOntologyRelationCategoryTreeInterface({ spaceId: id }),
    loadRelationObjectOptionsFromObjectTree(id),
  ]);
  if (relationResponse.code !== 200) throw new Error(relationResponse.message || "关系分类体系树查询失败");
  if (isMissingOntologyRelationCategoryTreeData(relationResponse.data)) {
    return { categoryTree: [], relations: [], objectOptions };
  }
  return {
    categoryTree: mapOntologyRelationCategoryTree(relationResponse.data),
    relations: mapOntologyRelationLinks(relationResponse.data),
    objectOptions,
  };
}

export function useSpaceRelationWorkspace() {
  const route = useRoute();
  const status = ref<OntologySpaceRelationLoadStatus>("loading");
  const errorMessage = ref("");
  const workspace = ref<SpaceRelationWorkspaceData | null>(null);
  const selectedRelationCategoryId = ref(ROOT_RELATION_CATEGORY_ID);
  const relationViewMode = ref<RelationViewMode>("graph");
  const relationFilter = ref<SpaceRelationFilterState>({
    seedNames: [],
    maxHop: 1,
    applied: false,
  });
  let generation = 0;

  const spaceId = computed(() => String(route.params.spaceId || "").trim());
  const relationCategoryTree = computed(() => workspace.value?.categoryTree ?? []);
  const relations = computed(() => workspace.value?.relations ?? []);
  const relationObjectOptions = computed<SpaceRelationObjectOption[]>(() => workspace.value?.objectOptions ?? []);
  const selectedRelationCategoryLabel = computed(
    () => findRelationCategoryNode(relationCategoryTree.value, selectedRelationCategoryId.value)?.label || "全部关系",
  );
  const relationCategoryOptions = computed(() => relationCategoryTree.value[0]?.children ?? []);
  const visibleSpaceRelations = computed(() => {
    const byCategory = filterRelationsByCategory(relations.value, relationCategoryTree.value, selectedRelationCategoryId.value);
    if (!relationFilter.value.applied) return byCategory;
    return filterRelationsByHop(byCategory, relationFilter.value.seedNames, relationFilter.value.maxHop);
  });
  const graphSeedNames = computed(() => relationFilter.value.seedNames);
  const graphMaxHop = computed(() => relationFilter.value.maxHop);

  /**
   * @description 按当前空间 id 加载关系分类树；无空间 id 时进入空状态，加载失败时保留错误信息。
   */
  async function loadSpaceRelationWorkspace() {
    const request = ++generation;
    status.value = "loading";
    errorMessage.value = "";
    try {
      if (!spaceId.value) {
        if (request !== generation) return;
        workspace.value = null;
        status.value = "empty";
        return;
      }
      const next = await loadSpaceRelationWorkspaceFromApi(spaceId.value);
      if (request !== generation) return;
      workspace.value = next;
      selectedRelationCategoryId.value = next.categoryTree[0]?.id || ROOT_RELATION_CATEGORY_ID;
      status.value = "ready";
    } catch (cause) {
      if (request !== generation) return;
      workspace.value = null;
      errorMessage.value = cause instanceof Error ? cause.message : "关系数据加载失败";
      status.value = "error";
    }
  }

  function selectRelationCategory(categoryId: string) {
    selectedRelationCategoryId.value = categoryId;
  }

  function setRelationViewMode(mode: RelationViewMode) {
    relationViewMode.value = mode;
  }

  function applyRelationFilter(seedNames: string[]) {
    const primary = seedNames.map((name) => name.trim()).find(Boolean);
    relationFilter.value = {
      seedNames: primary ? [primary] : [],
      maxHop: 1,
      applied: Boolean(primary),
    };
  }

  function findRelationCategoryLabel(categoryId: string): string {
    return findRelationCategoryNode(relationCategoryTree.value, categoryId)?.label || "";
  }

  function mutate(updater: (data: SpaceRelationWorkspaceData) => SpaceRelationWorkspaceData): string | null {
    if (!workspace.value) return "关系数据尚未加载";
    try {
      workspace.value = updater(workspace.value);
      return null;
    } catch (cause) {
      return cause instanceof Error ? cause.message : "操作失败";
    }
  }

  function createCategory(payload: RelationCategoryWritePayload): string | null {
    const error = mutate((data) => addRelationCategory(data, payload));
    if (!error && workspace.value?.categoryTree[0]) {
      const rootId = workspace.value.categoryTree[0].id;
      if (
        selectedRelationCategoryId.value === ROOT_RELATION_CATEGORY_ID ||
        !findRelationCategoryNode(relationCategoryTree.value, selectedRelationCategoryId.value)
      ) {
        selectedRelationCategoryId.value = rootId;
      }
    }
    return error;
  }

  function editCategory(payload: RelationCategoryUpdatePayload): string | null {
    return mutate((data) => updateRelationCategory(data, payload));
  }

  function deleteCategory(categoryId: string): string | null {
    const error = mutate((data) => removeRelationCategory(data, categoryId));
    if (
      !error &&
      (selectedRelationCategoryId.value === categoryId || !findRelationCategoryNode(relationCategoryTree.value, selectedRelationCategoryId.value))
    ) {
      selectedRelationCategoryId.value = relationCategoryTree.value[0]?.id || ROOT_RELATION_CATEGORY_ID;
    }
    return error;
  }

  function createRelationClass(payload: RelationClassWritePayload): string | null {
    return mutate((data) => addRelation(data, payload));
  }

  function editRelationClass(payload: RelationClassUpdatePayload): string | null {
    return mutate((data) => updateRelation(data, payload));
  }

  function deleteRelationClass(relationId: string): string | null {
    return mutate((data) => removeRelation(data, relationId));
  }

  onMounted(() => {
    void loadSpaceRelationWorkspace();
  });

  return {
    status,
    errorMessage,
    relationCategoryTree,
    relations,
    relationObjectOptions,
    selectedRelationCategoryId,
    selectedRelationCategoryLabel,
    relationCategoryOptions,
    visibleSpaceRelations,
    relationViewMode,
    relationFilter,
    graphSeedNames,
    graphMaxHop,
    loadSpaceRelationWorkspace,
    selectRelationCategory,
    setRelationViewMode,
    applyRelationFilter,
    findRelationCategoryLabel,
    createCategory,
    editCategory,
    deleteCategory,
    createRelationClass,
    editRelationClass,
    deleteRelationClass,
  };
}

export type { OntologyRelationCategoryNode, OntologyRelationClass };
