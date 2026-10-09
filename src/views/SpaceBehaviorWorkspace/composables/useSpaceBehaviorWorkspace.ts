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
import { filterSpaceBehaviorsByCategory, findSpaceBehaviorCategoryNode } from "../utils/spaceBehaviorOperations";

/**
 * @description 读取路由空间 id。
 * @param value 路由参数。
 * @returns 空间 id 文本。
 */
function readSpaceId(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * @description 管理空间内行为工作区的本地查询、筛选、分页与增删改。
 * @returns 行为工作区状态与命令。
 */
export function useSpaceBehaviorWorkspace() {
  const route = useRoute();
  const spaceId = computed(() => readSpaceId(route.params.spaceId));
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

  /**
   * @description 从本地 Mock 拉取当前空间的分类树与行为列表。
   */
  function loadSpaceBehaviorWorkspace(): void {
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
      if (!findSpaceBehaviorCategoryNode(data.categoryTree, selectedCategoryId.value)) {
        selectedCategoryId.value = data.categoryTree[0]?.id ?? ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
      }
      status.value = data.categoryTree.length === 0 && data.behaviors.length === 0 ? "empty" : "ready";
    } catch (error) {
      if (token !== loadToken) return;
      categoryTree.value = [];
      behaviors.value = [];
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : "行为工作区加载失败";
    }
  }

  const selectedCategory = computed(() => findSpaceBehaviorCategoryNode(categoryTree.value, selectedCategoryId.value));
  const selectedCategoryLabel = computed(() => selectedCategory.value?.label ?? "行为分类");
  const categoryFilteredBehaviors = computed(() => filterSpaceBehaviorsByCategory(behaviors.value, categoryTree.value, selectedCategoryId.value));
  const filteredBehaviors = computed(() => {
    const keywordValue = appliedKeyword.value.trim().toLocaleLowerCase();
    const statusValue = appliedStatus.value;
    return categoryFilteredBehaviors.value.filter((item) => {
      const matchesKeyword =
        !keywordValue ||
        item.displayName.toLocaleLowerCase().includes(keywordValue) ||
        item.functionOperatorName.toLocaleLowerCase().includes(keywordValue) ||
        item.description.toLocaleLowerCase().includes(keywordValue);
      const matchesStatus = !statusValue || item.status === statusValue;
      return matchesKeyword && matchesStatus;
    });
  });
  const total = computed(() => filteredBehaviors.value.length);
  const pagedBehaviors = computed(() => {
    const start = (page.value - 1) * pageSize.value;
    return filteredBehaviors.value.slice(start, start + pageSize.value);
  });

  /**
   * @description 选中分类并回到第一页。
   * @param categoryId 分类 id。
   */
  function selectBehaviorCategory(categoryId: string): void {
    selectedCategoryId.value = categoryId;
    page.value = 1;
  }

  /**
   * @description 应用关键字与状态筛选。
   */
  function applyBehaviorFilters(): void {
    appliedKeyword.value = keyword.value.trim();
    appliedStatus.value = statusFilter.value;
    page.value = 1;
  }

  /**
   * @description 清空关键字与状态筛选。
   */
  function resetBehaviorFilters(): void {
    keyword.value = "";
    statusFilter.value = "";
    appliedKeyword.value = "";
    appliedStatus.value = "";
    page.value = 1;
  }

  /**
   * @description 更新分页页码。
   * @param nextPage 目标页。
   */
  function changeBehaviorPage(nextPage: number): void {
    page.value = nextPage;
  }

  /**
   * @description 更新每页条数并回到第一页。
   * @param nextPageSize 每页条数。
   */
  function changeBehaviorPageSize(nextPageSize: number): void {
    pageSize.value = nextPageSize;
    page.value = 1;
  }

  /**
   * @description 新建行为分类。
   * @param parentId 父分类 id。
   * @param label 分类名称。
   * @returns 是否成功。
   */
  function createBehaviorCategory(parentId: string, label: string): boolean {
    actionLoading.value = true;
    try {
      const created = createSpaceBehaviorCategoryMock(spaceId.value, parentId, label);
      if (!created) return false;
      loadSpaceBehaviorWorkspace();
      return true;
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 重命名行为分类。
   * @param categoryId 分类 id。
   * @param label 新名称。
   * @returns 是否成功。
   */
  function renameBehaviorCategory(categoryId: string, label: string): boolean {
    actionLoading.value = true;
    try {
      const ok = updateSpaceBehaviorCategoryMock(spaceId.value, categoryId, label);
      if (!ok) return false;
      loadSpaceBehaviorWorkspace();
      return true;
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 删除空行为分类。
   * @param categoryId 分类 id。
   * @returns 删除结果。
   */
  function deleteBehaviorCategory(categoryId: string): { ok: boolean; reason: "not-found" | "root" | "has-children" | "has-behaviors" | "" } {
    actionLoading.value = true;
    try {
      const result = deleteSpaceBehaviorCategoryMock(spaceId.value, categoryId);
      if (result.ok) {
        if (selectedCategoryId.value === categoryId) selectedCategoryId.value = ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
        loadSpaceBehaviorWorkspace();
      }
      return result;
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 新建行为。
   * @param draft 行为草稿。
   * @returns 新增行为。
   */
  function createBehavior(draft: SpaceBehaviorDraft): SpaceBehaviorItem {
    actionLoading.value = true;
    try {
      const created = createSpaceBehaviorMock(spaceId.value, draft);
      loadSpaceBehaviorWorkspace();
      return created;
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 更新行为。
   * @param behaviorId 行为 id。
   * @param draft 行为草稿。
   * @returns 是否成功。
   */
  function updateBehavior(behaviorId: string, draft: SpaceBehaviorDraft): boolean {
    actionLoading.value = true;
    try {
      const updated = updateSpaceBehaviorMock(spaceId.value, behaviorId, draft);
      if (!updated) return false;
      loadSpaceBehaviorWorkspace();
      return true;
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 仅变更行为状态。
   * @param behaviorId 行为 id。
   * @param draft 状态变更草稿。
   * @returns 是否成功。
   */
  function changeBehaviorStatus(behaviorId: string, draft: SpaceBehaviorStatusChangeDraft): boolean {
    actionLoading.value = true;
    try {
      const updated = applySpaceBehaviorStatusChangeMock(spaceId.value, behaviorId, draft);
      if (!updated) return false;
      loadSpaceBehaviorWorkspace();
      return true;
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 删除行为。
   * @param behaviorId 行为 id。
   * @returns 是否成功。
   */
  function deleteBehavior(behaviorId: string): boolean {
    actionLoading.value = true;
    try {
      const ok = deleteSpaceBehaviorMock(spaceId.value, behaviorId);
      if (!ok) return false;
      loadSpaceBehaviorWorkspace();
      if (page.value > 1 && pagedBehaviors.value.length === 0) page.value -= 1;
      return true;
    } finally {
      actionLoading.value = false;
    }
  }

  watch(spaceId, () => {
    selectedCategoryId.value = ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
    resetBehaviorFilters();
    loadSpaceBehaviorWorkspace();
  });
  onMounted(loadSpaceBehaviorWorkspace);

  return {
    spaceId,
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
    loadSpaceBehaviorWorkspace,
    selectBehaviorCategory,
    applyBehaviorFilters,
    resetBehaviorFilters,
    changeBehaviorPage,
    changeBehaviorPageSize,
    createBehaviorCategory,
    renameBehaviorCategory,
    deleteBehaviorCategory,
    createBehavior,
    updateBehavior,
    changeBehaviorStatus,
    deleteBehavior,
  };
}
