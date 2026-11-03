import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  createActionCategoryInterface,
  deleteActionCategoryInterface,
  getActionCategoryTreeInterface,
  postCreateOntologyActionInterface,
  updateActionCategoryInterface,
} from "@/apis";
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
  createSpaceBehaviorMock,
  deleteSpaceBehaviorMock,
  querySpaceBehaviorWorkspaceMock,
  updateSpaceBehaviorMock,
} from "@/mocks/ontologySpaceBehaviorMock/ontologySpaceBehaviorMock";
import { buildPropertyValueCreateActionParams, isPropertyValueActionCreateDraft } from "../utils/buildPropertyValueCreateActionParams";
import { mapActionCategoryTree } from "../utils/mapActionCategoryTree";
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
  async function loadSpaceBehaviorWorkspace(): Promise<void> {
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
      const response = await getActionCategoryTreeInterface({ spaceId: Number(currentSpaceId) });
      if ((response.code !== 0 && response.code !== 200) || !response.data) throw new Error(response.message || "行为分类树加载失败");
      if (token !== loadToken) return;
      categoryTree.value = mapActionCategoryTree(response.data);
      behaviors.value = data.behaviors;
      if (!findSpaceBehaviorCategoryNode(categoryTree.value, selectedCategoryId.value)) {
        selectedCategoryId.value = categoryTree.value[0]?.id ?? ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
      }
      status.value = categoryTree.value.length === 0 && data.behaviors.length === 0 ? "empty" : "ready";
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
  async function createBehaviorCategory(parentId: string | number, label: string): Promise<boolean> {
    if (actionLoading.value) return false;
    actionLoading.value = true;
    try {
      const numericSpaceId = Number(spaceId.value);
      const parentIdText = String(parentId ?? "").trim();
      const numericParentId = parentIdText === ROOT_SPACE_BEHAVIOR_CATEGORY_ID || !parentIdText ? 0 : Number(parentIdText);
      const name = label.trim();
      if (!Number.isInteger(numericSpaceId) || !Number.isInteger(numericParentId) || !name) return false;
      const response = await createActionCategoryInterface({ spaceId: numericSpaceId, parentId: numericParentId, name });
      if (response.code !== 0 && response.code !== 200) return false;
      await loadSpaceBehaviorWorkspace();
      return true;
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : "分类创建失败";
      return false;
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
  async function renameBehaviorCategory(categoryId: string, label: string): Promise<boolean> {
    if (actionLoading.value) return false;
    actionLoading.value = true;
    try {
      const numericSpaceId = Number(spaceId.value);
      const numericCategoryId = Number(categoryId);
      const name = label.trim();
      if (!Number.isInteger(numericSpaceId) || !Number.isInteger(numericCategoryId) || !name) return false;
      const response = await updateActionCategoryInterface({ spaceId: numericSpaceId, categoryId: numericCategoryId, name });
      if (response.code !== 0 && response.code !== 200) return false;
      await loadSpaceBehaviorWorkspace();
      return true;
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : "分类修改失败";
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 删除空行为分类。
   * @param categoryId 分类 id。
   * @returns 删除结果。
   */
  async function deleteBehaviorCategory(categoryId: string): Promise<{ ok: boolean; reason: "not-found" | "root" | "has-children" | "has-behaviors" | "" }> {
    if (actionLoading.value) return { ok: false, reason: "" };
    actionLoading.value = true;
    try {
      const node = findSpaceBehaviorCategoryNode(categoryTree.value, categoryId);
      if (!node) return { ok: false, reason: "not-found" };
      if (categoryId === ROOT_SPACE_BEHAVIOR_CATEGORY_ID || categoryId === categoryTree.value[0]?.id) return { ok: false, reason: "root" };
      if (node.children.some((child) => child.kind === "category")) return { ok: false, reason: "has-children" };
      if (node.count > 0 || node.children.some((child) => child.kind === "action")) return { ok: false, reason: "has-behaviors" };
      const numericSpaceId = Number(spaceId.value);
      const numericCategoryId = Number(categoryId);
      if (!Number.isInteger(numericSpaceId) || !Number.isInteger(numericCategoryId)) return { ok: false, reason: "not-found" };
      const response = await deleteActionCategoryInterface({ spaceId: numericSpaceId, categoryId: numericCategoryId });
      if (response.code !== 0 && response.code !== 200) return { ok: false, reason: "not-found" };
      if (selectedCategoryId.value === categoryId) selectedCategoryId.value = ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
      await loadSpaceBehaviorWorkspace();
      return { ok: true, reason: "" };
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : "分类删除失败";
      return { ok: false, reason: "not-found" };
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 新建行为；创建表单的属性值基础行为可走真实创建接口，另存副本等路径可强制仅写本地 Mock。
   * @param draft 行为草稿。
   * @param options.useRemotePropertyValueAction 是否对属性值草稿调用 POST /ontology/action，默认 true。
   * @returns 创建结果。
   */
  async function createBehavior(
    draft: SpaceBehaviorDraft,
    options: { useRemotePropertyValueAction?: boolean } = {},
  ): Promise<{ ok: boolean; message: string; item?: SpaceBehaviorItem }> {
    const useRemotePropertyValueAction = options.useRemotePropertyValueAction !== false;
    actionLoading.value = true;
    try {
      if (useRemotePropertyValueAction && isPropertyValueActionCreateDraft(draft)) {
        const params = buildPropertyValueCreateActionParams(draft);
        if ("error" in params) {
          return { ok: false, message: params.error };
        }
        const response = await postCreateOntologyActionInterface(params);
        if (response.code !== 200) {
          return { ok: false, message: response.message || "行为创建失败" };
        }
        const created = createSpaceBehaviorMock(spaceId.value, draft);
        loadSpaceBehaviorWorkspace();
        return { ok: true, message: "", item: created };
      }
      const created = createSpaceBehaviorMock(spaceId.value, draft);
      loadSpaceBehaviorWorkspace();
      return { ok: true, message: "", item: created };
    } catch (error) {
      return { ok: false, message: error instanceof Error && error.message.trim() ? error.message : "行为创建失败" };
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
