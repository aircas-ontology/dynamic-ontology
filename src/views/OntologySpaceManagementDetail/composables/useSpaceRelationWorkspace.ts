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
import { createOntologySpaceRelationWorkspaceData } from "@/mocks/ontologySpaceRelationMock/ontologySpaceRelationMock";
import { filterRelationsByHop } from "../utils/spaceRelationGraph";
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

  const spaceId = computed(() => String(route.params.spaceId || "").trim());
  const relationCategoryTree = computed(() => workspace.value?.categoryTree ?? []);
  const relations = computed(() => workspace.value?.relations ?? []);
  const relationObjectOptions = computed<SpaceRelationObjectOption[]>(
    () => workspace.value?.objectOptions ?? [],
  );
  const selectedRelationCategoryLabel = computed(
    () => findRelationCategoryNode(relationCategoryTree.value, selectedRelationCategoryId.value)?.label || "全部关系",
  );
  const relationCategoryOptions = computed(
    () => relationCategoryTree.value[0]?.children ?? [],
  );
  const visibleSpaceRelations = computed(() => {
    const byCategory = filterRelationsByCategory(
      relations.value,
      relationCategoryTree.value,
      selectedRelationCategoryId.value,
    );
    if (!relationFilter.value.applied) return byCategory;
    return filterRelationsByHop(byCategory, relationFilter.value.seedNames, relationFilter.value.maxHop);
  });
  const graphSeedNames = computed(() => relationFilter.value.seedNames);
  const graphMaxHop = computed(() => relationFilter.value.maxHop);

  function load() {
    status.value = "loading";
    errorMessage.value = "";
    try {
      if (!spaceId.value) {
        workspace.value = null;
        status.value = "empty";
        return;
      }
      workspace.value = createOntologySpaceRelationWorkspaceData();
      selectedRelationCategoryId.value =
        workspace.value.categoryTree[0]?.id || ROOT_RELATION_CATEGORY_ID;
      status.value = "ready";
    } catch (cause) {
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
    return mutate((data) => addRelationCategory(data, payload));
  }

  function editCategory(payload: RelationCategoryUpdatePayload): string | null {
    return mutate((data) => updateRelationCategory(data, payload));
  }

  function deleteCategory(categoryId: string): string | null {
    const error = mutate((data) => removeRelationCategory(data, categoryId));
    if (
      !error &&
      (selectedRelationCategoryId.value === categoryId ||
        !findRelationCategoryNode(relationCategoryTree.value, selectedRelationCategoryId.value))
    ) {
      selectedRelationCategoryId.value =
        relationCategoryTree.value[0]?.id || ROOT_RELATION_CATEGORY_ID;
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

  onMounted(load);

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
    load,
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
