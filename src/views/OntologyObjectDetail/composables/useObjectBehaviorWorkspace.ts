import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type {
  SpaceBehaviorCategoryNode,
  SpaceBehaviorDraft,
  SpaceBehaviorItem,
  SpaceBehaviorStatus,
  SpaceBehaviorStatusChangeDraft,
  SpaceBehaviorWorkspaceLoadStatus,
} from "@/types";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID } from "@/types";
import {
  applySpaceBehaviorStatusChangeMock,
  createSpaceBehaviorCategoryMock,
  createSpaceBehaviorMock,
  deleteSpaceBehaviorCategoryMock,
  deleteSpaceBehaviorMock,
  querySpaceBehaviorWorkspaceMock,
  updateSpaceBehaviorCategoryMock,
  updateSpaceBehaviorMock,
} from "@/mocks/ontologySpaceBehaviorMock/ontologySpaceBehaviorMock";
import { filterObjectBehaviorsByCategory, findObjectBehaviorCategoryNode } from "../utils/objectBehaviorOperations";

/**
 * @description 管理对象详情行为页的本地查询、筛选、分页及分类和行为命令。
 * @returns 对象行为工作区状态与命令。
 */
export function useObjectBehaviorWorkspace() {
  const route = useRoute();
  const spaceId = computed(() => (typeof route.query.spaceId === "string" ? route.query.spaceId : ""));
  const status = ref<SpaceBehaviorWorkspaceLoadStatus>("loading");
  const errorMessage = ref("");
  const categoryTree = ref<SpaceBehaviorCategoryNode[]>([]);
  const behaviors = ref<SpaceBehaviorItem[]>([]);
  const selectedCategoryId = ref(ROOT_SPACE_BEHAVIOR_CATEGORY_ID);
  const keyword = ref("");
  const statusFilter = ref<SpaceBehaviorStatus | "">("");
  const appliedKeyword = ref("");
  const appliedStatus = ref<SpaceBehaviorStatus | "">("");
  const page = ref(1);
  const pageSize = ref(10);
  const actionLoading = ref(false);
  let loadToken = 0;

  /** @description 读取当前空间的本地行为数据。 */
  function loadObjectBehaviorWorkspace(): void {
    const token = ++loadToken;
    const currentSpaceId = spaceId.value.trim();
    status.value = "loading";
    errorMessage.value = "";
    if (!currentSpaceId) {
      categoryTree.value = [];
      behaviors.value = [];
      status.value = "empty";
      return;
    }
    try {
      const data = querySpaceBehaviorWorkspaceMock(currentSpaceId);
      if (token !== loadToken) return;
      categoryTree.value = data.categoryTree;
      behaviors.value = data.behaviors;
      if (!findObjectBehaviorCategoryNode(data.categoryTree, selectedCategoryId.value)) {
        selectedCategoryId.value = data.categoryTree[0]?.id ?? ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
      }
      status.value = data.categoryTree.length || data.behaviors.length ? "ready" : "empty";
    } catch (cause) {
      if (token !== loadToken) return;
      categoryTree.value = [];
      behaviors.value = [];
      status.value = "error";
      errorMessage.value = cause instanceof Error ? cause.message : "对象行为加载失败";
    }
  }

  const selectedCategoryLabel = computed(() => findObjectBehaviorCategoryNode(categoryTree.value, selectedCategoryId.value)?.label ?? "行为分类");
  const filteredBehaviors = computed(() => {
    const search = appliedKeyword.value.trim().toLocaleLowerCase();
    return filterObjectBehaviorsByCategory(behaviors.value, categoryTree.value, selectedCategoryId.value).filter((item) => {
      const matchesKeyword =
        !search ||
        item.displayName.toLocaleLowerCase().includes(search) ||
        item.functionOperatorName.toLocaleLowerCase().includes(search) ||
        item.description.toLocaleLowerCase().includes(search);
      return matchesKeyword && (!appliedStatus.value || item.status === appliedStatus.value);
    });
  });
  const total = computed(() => filteredBehaviors.value.length);
  const pagedBehaviors = computed(() => filteredBehaviors.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));

  /** @description 选择分类并重置至第一页。 @param categoryId 分类标识。 */
  function selectObjectBehaviorCategory(categoryId: string): void {
    selectedCategoryId.value = categoryId;
    page.value = 1;
  }
  /** @description 应用关键词和状态筛选。 */
  function applyObjectBehaviorFilters(): void {
    appliedKeyword.value = keyword.value.trim();
    appliedStatus.value = statusFilter.value;
    page.value = 1;
  }
  /** @description 清空关键词和状态筛选。 */
  function resetObjectBehaviorFilters(): void {
    keyword.value = "";
    statusFilter.value = "";
    appliedKeyword.value = "";
    appliedStatus.value = "";
    page.value = 1;
  }
  /** @description 创建行为分类。 @param parentId 父分类标识。 @param label 分类名称。 @returns 是否创建成功。 */
  function createObjectBehaviorCategory(parentId: string, label: string): boolean {
    actionLoading.value = true;
    try {
      const created = createSpaceBehaviorCategoryMock(spaceId.value, parentId, label);
      if (created) loadObjectBehaviorWorkspace();
      return Boolean(created);
    } finally {
      actionLoading.value = false;
    }
  }
  /** @description 更新行为分类名称。 @param categoryId 分类标识。 @param label 新名称。 @returns 是否更新成功。 */
  function renameObjectBehaviorCategory(categoryId: string, label: string): boolean {
    actionLoading.value = true;
    try {
      const updated = updateSpaceBehaviorCategoryMock(spaceId.value, categoryId, label);
      if (updated) loadObjectBehaviorWorkspace();
      return updated;
    } finally {
      actionLoading.value = false;
    }
  }
  /** @description 删除空行为分类。 @param categoryId 分类标识。 @returns 删除结果。 */
  function deleteObjectBehaviorCategory(categoryId: string) {
    actionLoading.value = true;
    try {
      const result = deleteSpaceBehaviorCategoryMock(spaceId.value, categoryId);
      if (result.ok) loadObjectBehaviorWorkspace();
      return result;
    } finally {
      actionLoading.value = false;
    }
  }
  /** @description 创建行为。 @param draft 行为草稿。 */
  function createObjectBehavior(draft: SpaceBehaviorDraft): void {
    actionLoading.value = true;
    try {
      createSpaceBehaviorMock(spaceId.value, draft);
      loadObjectBehaviorWorkspace();
    } finally {
      actionLoading.value = false;
    }
  }
  /** @description 更新行为。 @param id 行为标识。 @param draft 行为草稿。 @returns 是否更新成功。 */
  function updateObjectBehavior(id: string, draft: SpaceBehaviorDraft): boolean {
    actionLoading.value = true;
    try {
      const updated = updateSpaceBehaviorMock(spaceId.value, id, draft);
      if (updated) loadObjectBehaviorWorkspace();
      return Boolean(updated);
    } finally {
      actionLoading.value = false;
    }
  }
  /** @description 变更行为状态。 @param id 行为标识。 @param draft 状态变更。 @returns 是否变更成功。 */
  function changeObjectBehaviorStatus(id: string, draft: SpaceBehaviorStatusChangeDraft): boolean {
    actionLoading.value = true;
    try {
      const updated = applySpaceBehaviorStatusChangeMock(spaceId.value, id, draft);
      if (updated) loadObjectBehaviorWorkspace();
      return Boolean(updated);
    } finally {
      actionLoading.value = false;
    }
  }
  /** @description 删除行为。 @param id 行为标识。 @returns 是否删除成功。 */
  function deleteObjectBehavior(id: string): boolean {
    actionLoading.value = true;
    try {
      const deleted = deleteSpaceBehaviorMock(spaceId.value, id);
      if (deleted) loadObjectBehaviorWorkspace();
      return deleted;
    } finally {
      actionLoading.value = false;
    }
  }

  watch(spaceId, () => {
    selectedCategoryId.value = ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
    resetObjectBehaviorFilters();
    loadObjectBehaviorWorkspace();
  });
  onMounted(loadObjectBehaviorWorkspace);

  return {
    status,
    errorMessage,
    categoryTree,
    selectedCategoryId,
    selectedCategoryLabel,
    keyword,
    statusFilter,
    page,
    pageSize,
    total,
    pagedBehaviors,
    actionLoading,
    loadObjectBehaviorWorkspace,
    selectObjectBehaviorCategory,
    applyObjectBehaviorFilters,
    resetObjectBehaviorFilters,
    createObjectBehaviorCategory,
    renameObjectBehaviorCategory,
    deleteObjectBehaviorCategory,
    createObjectBehavior,
    updateObjectBehavior,
    changeObjectBehaviorStatus,
    deleteObjectBehavior,
  };
}
