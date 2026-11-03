import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  createActionCategoryInterface,
  deleteActionCategoryInterface,
  getActionCategoryTreeInterface,
  getListOntologyActionInterface,
  postCreateOntologyActionInterface,
  putEditOntologyActionInterface,
  updateActionCategoryInterface,
} from "@/apis";
import type {
  SpaceBehaviorCategoryNode,
  SpaceBehaviorDraft,
  SpaceBehaviorItem,
  SpaceBehaviorListStatus,
  SpaceBehaviorStatusChangeDraft,
  SpaceBehaviorWorkspaceLoadStatus,
} from "@/types";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID } from "@/types";
import {
  applySpaceBehaviorStatusChangeMock,
  createSpaceBehaviorMock,
  deleteSpaceBehaviorMock,
  updateSpaceBehaviorMock,
} from "@/mocks/ontologySpaceBehaviorMock/ontologySpaceBehaviorMock";
import { buildBasicOperatorCreateActionParams, isBasicOperatorActionCreateDraft } from "../utils/buildBasicOperatorCreateActionParams";
import { buildLinkCreateActionParams, isLinkActionCreateDraft } from "../utils/buildLinkCreateActionParams";
import { buildPropertyValueCreateActionParams, isPropertyValueActionCreateDraft } from "../utils/buildPropertyValueCreateActionParams";
import { mapActionCategoryTree } from "../utils/mapActionCategoryTree";
import { mapListOntologyActionRecord, mapSpaceBehaviorListStatusToQuery } from "../utils/mapListOntologyActionRecord";
import { findSpaceBehaviorCategoryNode } from "../utils/spaceBehaviorOperations";

/**
 * @description 读取路由空间 id。
 * @param value 路由参数。
 * @returns 空间 id 文本。
 */
function readSpaceId(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * @description 将选中分类解析为列表查询 categoryId；根分类或不合法 id 时不传。
 * @param categoryId 当前选中分类 id。
 * @param tree 分类树。
 * @returns 数字 categoryId；根或无效时为 undefined。
 */
function resolveListActionCategoryIdQuery(categoryId: string, tree: SpaceBehaviorCategoryNode[]): number | undefined {
  const id = categoryId.trim();
  if (!id || id === ROOT_SPACE_BEHAVIOR_CATEGORY_ID) return undefined;
  if (tree[0]?.id === id) return undefined;
  const numericCategoryId = Number(id);
  if (!Number.isInteger(numericCategoryId)) return undefined;
  return numericCategoryId;
}

/**
 * @description 管理空间内行为工作区的分类树、列表查询、筛选、分页与增删改。
 * @returns 行为工作区状态与命令。
 */
export function useSpaceBehaviorWorkspace() {
  const route = useRoute();
  const spaceId = computed(() => readSpaceId(route.params.spaceId));
  const status = ref<SpaceBehaviorWorkspaceLoadStatus>("loading");
  const errorMessage = ref("");
  const categoryTree = ref<SpaceBehaviorCategoryNode[]>([]);
  const behaviors = ref<SpaceBehaviorItem[]>([]);
  const total = ref(0);
  const selectedCategoryId = ref(ROOT_SPACE_BEHAVIOR_CATEGORY_ID);
  const keyword = ref("");
  const statusFilter = ref<SpaceBehaviorListStatus | "">("");
  const appliedKeyword = ref("");
  const appliedStatus = ref<SpaceBehaviorListStatus | "">("");
  const page = ref(1);
  const pageSize = ref(10);
  const actionLoading = ref(false);
  let workspaceToken = 0;
  let listToken = 0;

  const selectedCategory = computed(() => findSpaceBehaviorCategoryNode(categoryTree.value, selectedCategoryId.value));
  const selectedCategoryLabel = computed(() => selectedCategory.value?.label ?? "行为分类");
  const pagedBehaviors = computed(() => behaviors.value);

  /**
   * @description 加载行为分类树。
   * @param token 工作区加载令牌；过期时中止写回。
   */
  async function loadActionCategoryTree(token: number): Promise<void> {
    const currentSpaceId = spaceId.value.trim();
    const numericSpaceId = Number(currentSpaceId);
    if (!Number.isInteger(numericSpaceId)) {
      throw new Error("空间标识无效");
    }
    const response = await getActionCategoryTreeInterface({ spaceId: numericSpaceId });
    if ((response.code !== 0 && response.code !== 200) || !response.data) {
      throw new Error(response.message || "行为分类树加载失败");
    }
    if (token !== workspaceToken) return;
    categoryTree.value = mapActionCategoryTree(response.data);
    if (!findSpaceBehaviorCategoryNode(categoryTree.value, selectedCategoryId.value)) {
      selectedCategoryId.value = categoryTree.value[0]?.id ?? ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
    }
  }

  /**
   * @description 按当前筛选与分页拉取行为列表。
   * @param options.markLoading 是否将工作区状态置为 loading；默认仅在当前非 ready 时置 loading。
   */
  async function loadSpaceBehaviorList(options: { markLoading?: boolean } = {}): Promise<void> {
    const token = ++listToken;
    const currentSpaceId = spaceId.value.trim();
    const numericSpaceId = Number(currentSpaceId);
    const markLoading = options.markLoading === true || status.value !== "ready";
    if (markLoading) {
      status.value = "loading";
      errorMessage.value = "";
    }
    if (!currentSpaceId || !Number.isInteger(numericSpaceId)) {
      behaviors.value = [];
      total.value = 0;
      status.value = currentSpaceId ? "error" : "empty";
      errorMessage.value = currentSpaceId ? "空间标识无效" : "";
      return;
    }
    try {
      const keywordValue = appliedKeyword.value.trim();
      const statusQuery = mapSpaceBehaviorListStatusToQuery(appliedStatus.value);
      const categoryIdQuery = resolveListActionCategoryIdQuery(selectedCategoryId.value, categoryTree.value);
      const response = await getListOntologyActionInterface({
        ontologySpaceId: numericSpaceId,
        pageNum: page.value,
        pageSize: pageSize.value,
        ...(categoryIdQuery === undefined ? {} : { categoryId: categoryIdQuery }),
        ...(keywordValue ? { keyword: keywordValue } : {}),
        ...(statusQuery === undefined ? {} : { status: statusQuery }),
      });
      if ((response.code !== 0 && response.code !== 200) || !response.data) {
        throw new Error(response.message || "行为列表加载失败");
      }
      if (token !== listToken) return;
      behaviors.value = (response.data.records ?? []).map(mapListOntologyActionRecord);
      total.value = Number(response.data.total) || 0;
      status.value = "ready";
      errorMessage.value = "";
    } catch (error) {
      if (token !== listToken) return;
      behaviors.value = [];
      total.value = 0;
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : "行为列表加载失败";
    }
  }

  /**
   * @description 加载分类树与行为列表。
   */
  async function loadSpaceBehaviorWorkspace(): Promise<void> {
    const token = ++workspaceToken;
    listToken += 1;
    status.value = "loading";
    errorMessage.value = "";
    const currentSpaceId = spaceId.value.trim();
    if (!currentSpaceId) {
      categoryTree.value = [];
      behaviors.value = [];
      total.value = 0;
      status.value = "empty";
      return;
    }
    try {
      await loadActionCategoryTree(token);
      if (token !== workspaceToken) return;
      await loadSpaceBehaviorList({ markLoading: true });
    } catch (error) {
      if (token !== workspaceToken) return;
      categoryTree.value = [];
      behaviors.value = [];
      total.value = 0;
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : "行为工作区加载失败";
    }
  }

  /**
   * @description 选中分类并按 categoryId 重新拉取行为列表；根分类不传 categoryId。
   * @param categoryId 分类 id。
   */
  function selectBehaviorCategory(categoryId: string): void {
    const nextId = categoryId.trim();
    if (!nextId || selectedCategoryId.value === nextId) return;
    selectedCategoryId.value = nextId;
    page.value = 1;
    void loadSpaceBehaviorList();
  }

  /**
   * @description 应用关键字与状态筛选并重新拉取列表。
   */
  function applyBehaviorFilters(): void {
    appliedKeyword.value = keyword.value.trim();
    appliedStatus.value = statusFilter.value;
    page.value = 1;
    void loadSpaceBehaviorList();
  }

  /**
   * @description 清空关键字与状态筛选并重新拉取列表。
   */
  function resetBehaviorFilters(): void {
    keyword.value = "";
    statusFilter.value = "";
    appliedKeyword.value = "";
    appliedStatus.value = "";
    page.value = 1;
    void loadSpaceBehaviorList();
  }

  /**
   * @description 更新分页页码并重新拉取列表。
   * @param nextPage 目标页。
   */
  function changeBehaviorPage(nextPage: number): void {
    page.value = nextPage;
    void loadSpaceBehaviorList();
  }

  /**
   * @description 更新每页条数并重新拉取列表。
   * @param nextPageSize 每页条数。
   */
  function changeBehaviorPageSize(nextPageSize: number): void {
    pageSize.value = nextPageSize;
    page.value = 1;
    void loadSpaceBehaviorList();
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
   * @description 新建行为；属性值/关系实例基础行为可走真实创建接口，另存副本等路径可强制仅写本地 Mock。
   * @param draft 行为草稿。
   * @param options.useRemotePropertyValueAction 是否对可远程创建的草稿调用 POST /ontology/action，默认 true。
   * @returns 创建结果。
   */
  async function createBehavior(
    draft: SpaceBehaviorDraft,
    options: { useRemotePropertyValueAction?: boolean } = {},
  ): Promise<{ ok: boolean; message: string; item?: SpaceBehaviorItem }> {
    const useRemotePropertyValueAction = options.useRemotePropertyValueAction !== false;
    actionLoading.value = true;
    try {
      if (
        useRemotePropertyValueAction &&
        (isPropertyValueActionCreateDraft(draft) || isLinkActionCreateDraft(draft) || isBasicOperatorActionCreateDraft(draft))
      ) {
        const params = isBasicOperatorActionCreateDraft(draft)
          ? buildBasicOperatorCreateActionParams(draft)
          : isLinkActionCreateDraft(draft)
            ? buildLinkCreateActionParams(draft)
            : buildPropertyValueCreateActionParams(draft);
        if ("error" in params) {
          return { ok: false, message: params.error };
        }
        const response = await postCreateOntologyActionInterface(params);
        if (response.code !== 200) {
          return { ok: false, message: response.message || "行为创建失败" };
        }
        const created = createSpaceBehaviorMock(spaceId.value, draft);
        await loadSpaceBehaviorWorkspace();
        return { ok: true, message: "", item: created };
      }
      const created = createSpaceBehaviorMock(spaceId.value, draft);
      await loadSpaceBehaviorWorkspace();
      return { ok: true, message: "", item: created };
    } catch (error) {
      return { ok: false, message: error instanceof Error && error.message.trim() ? error.message : "行为创建失败" };
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 更新行为；属性值 / 关系实例 / 基础算子走 PUT /ontology/action，其余仅写本地 Mock。
   * @param behaviorId 行为 id。
   * @param draft 行为草稿。
   * @returns 更新结果。
   */
  async function updateBehavior(behaviorId: string, draft: SpaceBehaviorDraft): Promise<{ ok: boolean; message: string; item?: SpaceBehaviorItem }> {
    actionLoading.value = true;
    try {
      if (isPropertyValueActionCreateDraft(draft) || isLinkActionCreateDraft(draft) || isBasicOperatorActionCreateDraft(draft)) {
        const params = isBasicOperatorActionCreateDraft(draft)
          ? buildBasicOperatorCreateActionParams(draft)
          : isLinkActionCreateDraft(draft)
            ? buildLinkCreateActionParams(draft)
            : buildPropertyValueCreateActionParams(draft);
        if ("error" in params) {
          return { ok: false, message: params.error };
        }
        const response = await putEditOntologyActionInterface(params);
        if (response.code !== 200) {
          return { ok: false, message: response.message || "行为保存失败" };
        }
        const updated = updateSpaceBehaviorMock(spaceId.value, behaviorId, draft);
        await loadSpaceBehaviorWorkspace();
        return { ok: true, message: "", item: updated ?? undefined };
      }
      const updated = updateSpaceBehaviorMock(spaceId.value, behaviorId, draft);
      if (!updated) return { ok: false, message: "行为保存失败" };
      await loadSpaceBehaviorList();
      return { ok: true, message: "", item: updated };
    } catch (error) {
      return { ok: false, message: error instanceof Error && error.message.trim() ? error.message : "行为保存失败" };
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
      void loadSpaceBehaviorList();
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
      if (page.value > 1 && behaviors.value.length <= 1) page.value -= 1;
      void loadSpaceBehaviorList();
      return true;
    } finally {
      actionLoading.value = false;
    }
  }

  watch(spaceId, () => {
    selectedCategoryId.value = ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
    keyword.value = "";
    statusFilter.value = "";
    appliedKeyword.value = "";
    appliedStatus.value = "";
    page.value = 1;
    void loadSpaceBehaviorWorkspace();
  });
  onMounted(() => {
    void loadSpaceBehaviorWorkspace();
  });

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
