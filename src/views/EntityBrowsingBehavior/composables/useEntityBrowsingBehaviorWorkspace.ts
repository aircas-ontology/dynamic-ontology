import { computed, onScopeDispose, ref, watch, type Ref } from "vue";
import { useRoute } from "vue-router";
import { getActionCategoryTreeInterface, getListOntologyActionInterface } from "@/apis";
import type {
  ActionCategoryVO,
  ApiResponse,
  GetActionCategoryTreeParams,
  ListOntologyActionData,
  ListOntologyActionParams,
  SpaceBehaviorCategoryNode,
  SpaceBehaviorItem,
  SpaceBehaviorKind,
  SpaceBehaviorWorkspaceLoadStatus,
} from "@/types";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID } from "@/types";
import { mapListOntologyActionRecord, mapSpaceBehaviorKindToActionKindQuery } from "@/utils/behaviorParameters/mapListOntologyActionRecord";

/** 空间浏览仅展示已发布行为，与对象详情对象行为一致。 */
const PUBLISHED_BEHAVIOR_STATUS = 1;
import { findBrowseBehaviorCategoryNode, omitBrowseActionLeaves, resolveBrowseListCategoryIdQuery } from "../utils/browseBehaviorCategoryTree";
import { mapBrowseActionCategoryTree } from "../utils/mapBrowseActionCategoryTree";

/** 浏览行为工作区可注入的接口依赖，便于单测替换。 */
export interface EntityBrowsingBehaviorWorkspaceApis {
  getActionCategoryTreeInterface: (params: GetActionCategoryTreeParams) => Promise<ApiResponse<unknown>>;
  getListOntologyActionInterface: (params: ListOntologyActionParams) => Promise<ApiResponse<ListOntologyActionData>>;
}

/** 浏览行为工作区可选配置。 */
export interface UseEntityBrowsingBehaviorWorkspaceOptions {
  getSpaceId?: () => string;
  apis?: Partial<EntityBrowsingBehaviorWorkspaceApis>;
  /** 兼容测试直接传入接口函数。 */
  getActionCategoryTreeInterface?: EntityBrowsingBehaviorWorkspaceApis["getActionCategoryTreeInterface"];
  getListOntologyActionInterface?: EntityBrowsingBehaviorWorkspaceApis["getListOntologyActionInterface"];
}

/**
 * @description 解析当前路由中的空间标识。
 * @returns 空间 id 字符串。
 */
function readRouteSpaceId(): string {
  const route = useRoute();
  return typeof route.params.spaceId === "string" ? route.params.spaceId.trim() : "";
}

/**
 * @description 管理空间浏览行为 Tab 的分类树、列表筛选、分页与过期响应丢弃。
 * @param options 可选空间解析与接口注入。
 * @returns 浏览行为工作区状态与命令。
 */
export function useEntityBrowsingBehaviorWorkspace(options: UseEntityBrowsingBehaviorWorkspaceOptions = {}) {
  const getSpaceId = options.getSpaceId ?? readRouteSpaceId;
  const categoryApi: EntityBrowsingBehaviorWorkspaceApis["getActionCategoryTreeInterface"] =
    options.getActionCategoryTreeInterface ?? options.apis?.getActionCategoryTreeInterface ?? getActionCategoryTreeInterface;
  const listApi: EntityBrowsingBehaviorWorkspaceApis["getListOntologyActionInterface"] =
    options.getListOntologyActionInterface ?? options.apis?.getListOntologyActionInterface ?? getListOntologyActionInterface;

  const spaceId = computed(() => getSpaceId().trim());
  const status = ref<SpaceBehaviorWorkspaceLoadStatus>("loading");
  const errorMessage = ref("");
  const categoryTree = ref<SpaceBehaviorCategoryNode[]>([]);
  const categoryPanelTree = computed(() => omitBrowseActionLeaves(categoryTree.value));
  const behaviors = ref<SpaceBehaviorItem[]>([]);
  const total = ref(0);
  const selectedCategoryId = ref(ROOT_SPACE_BEHAVIOR_CATEGORY_ID);
  const keyword = ref("");
  const kindFilter = ref<SpaceBehaviorKind | "">("");
  const appliedKeyword = ref("");
  const appliedKind = ref<SpaceBehaviorKind | "">("");
  const page = ref(1);
  const pageSize = ref(12);
  let workspaceToken = 0;
  let listToken = 0;
  let disposed = false;

  const selectedCategory = computed(() => findBrowseBehaviorCategoryNode(categoryTree.value, selectedCategoryId.value));
  const selectedCategoryLabel = computed(() => selectedCategory.value?.label ?? "全部行为");

  /**
   * @description 加载行为分类树；令牌过期或已卸载时不写回。
   * @param token 工作区加载令牌。
   */
  async function loadBrowseBehaviorCategories(token: number): Promise<void> {
    const currentSpaceId = spaceId.value;
    const numericSpaceId = Number(currentSpaceId);
    if (!currentSpaceId || !Number.isInteger(numericSpaceId) || numericSpaceId <= 0) {
      throw new Error("空间标识无效");
    }
    const response = await categoryApi({ spaceId: numericSpaceId });
    if ((response.code !== 0 && response.code !== 200) || response.data == null) {
      throw new Error(response.message || "行为分类树加载失败");
    }
    if (disposed || token !== workspaceToken) return;
    categoryTree.value = mapBrowseActionCategoryTree(response.data as ActionCategoryVO | ActionCategoryVO[]);
    if (!findBrowseBehaviorCategoryNode(categoryTree.value, selectedCategoryId.value)) {
      selectedCategoryId.value = ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
    }
  }

  /**
   * @description 按当前筛选与分页拉取行为列表。
   * @param options.markLoading 是否将工作区状态置为 loading。
   */
  async function loadBrowseBehaviorList(loadOptions: { markLoading?: boolean } = {}): Promise<void> {
    const token = ++listToken;
    const currentSpaceId = spaceId.value;
    const numericSpaceId = Number(currentSpaceId);
    const markLoading = loadOptions.markLoading === true || status.value !== "ready";
    if (markLoading) {
      status.value = "loading";
      errorMessage.value = "";
    }
    if (!currentSpaceId || !Number.isInteger(numericSpaceId) || numericSpaceId <= 0) {
      behaviors.value = [];
      total.value = 0;
      status.value = currentSpaceId ? "error" : "empty";
      errorMessage.value = currentSpaceId ? "空间标识无效" : "";
      return;
    }
    try {
      const keywordValue = appliedKeyword.value.trim();
      const actionKindQuery = mapSpaceBehaviorKindToActionKindQuery(appliedKind.value);
      const categoryIdQuery = resolveBrowseListCategoryIdQuery(selectedCategoryId.value, categoryTree.value);
      const response = await listApi({
        ontologySpaceId: numericSpaceId,
        pageNum: page.value,
        pageSize: pageSize.value,
        status: PUBLISHED_BEHAVIOR_STATUS,
        ...(categoryIdQuery === undefined ? {} : { categoryId: categoryIdQuery }),
        ...(keywordValue ? { keyword: keywordValue } : {}),
        ...(actionKindQuery === undefined ? {} : { actionKind: actionKindQuery }),
      });
      if ((response.code !== 0 && response.code !== 200) || !response.data) {
        throw new Error(response.message || "行为列表加载失败");
      }
      if (disposed || token !== listToken) return;
      behaviors.value = (response.data.records ?? []).map(mapListOntologyActionRecord);
      total.value = Number(response.data.total) || 0;
      status.value = "ready";
      errorMessage.value = "";
    } catch (error) {
      if (disposed || token !== listToken) return;
      behaviors.value = [];
      total.value = 0;
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : "行为列表加载失败";
    }
  }

  /**
   * @description 加载分类树与行为列表。
   */
  async function loadBrowseBehaviorWorkspace(): Promise<void> {
    const token = ++workspaceToken;
    listToken += 1;
    status.value = "loading";
    errorMessage.value = "";
    const currentSpaceId = spaceId.value;
    if (!currentSpaceId) {
      categoryTree.value = [];
      behaviors.value = [];
      total.value = 0;
      status.value = "empty";
      return;
    }
    try {
      await loadBrowseBehaviorCategories(token);
      if (disposed || token !== workspaceToken) return;
      await loadBrowseBehaviorList({ markLoading: true });
    } catch (error) {
      if (disposed || token !== workspaceToken) return;
      categoryTree.value = [];
      behaviors.value = [];
      total.value = 0;
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : "行为工作区加载失败";
    }
  }

  /**
   * @description 选中分类并重新拉取行为列表；根分类不传 categoryId。
   * @param categoryId 分类 id。
   */
  function selectBehaviorCategory(categoryId: string): void {
    const nextId = categoryId.trim();
    if (!nextId || selectedCategoryId.value === nextId) return;
    selectedCategoryId.value = nextId;
    page.value = 1;
    void loadBrowseBehaviorList();
  }

  /**
   * @description 应用关键字与行为类别筛选并重新拉取已发布行为列表。
   */
  function applyBehaviorFilters(): void {
    appliedKeyword.value = keyword.value.trim();
    appliedKind.value = kindFilter.value;
    page.value = 1;
    void loadBrowseBehaviorList();
  }

  /**
   * @description 清空筛选并重新拉取已发布行为列表。
   */
  function resetBehaviorFilters(): void {
    keyword.value = "";
    kindFilter.value = "";
    appliedKeyword.value = "";
    appliedKind.value = "";
    page.value = 1;
    void loadBrowseBehaviorList();
  }

  /**
   * @description 更新分页页码并重新拉取列表。
   * @param nextPage 目标页。
   */
  function changeBehaviorPage(nextPage: number): void {
    page.value = nextPage;
    void loadBrowseBehaviorList();
  }

  /**
   * @description 更新每页条数并重新拉取列表。
   * @param nextPageSize 每页条数。
   */
  function changeBehaviorPageSize(nextPageSize: number): void {
    pageSize.value = nextPageSize;
    page.value = 1;
    void loadBrowseBehaviorList();
  }

  watch(
    spaceId,
    () => {
      selectedCategoryId.value = ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
      page.value = 1;
      void loadBrowseBehaviorWorkspace();
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    disposed = true;
    workspaceToken += 1;
    listToken += 1;
  });

  return {
    spaceId: spaceId as Ref<string>,
    status,
    errorMessage,
    categoryTree,
    categoryPanelTree,
    behaviors,
    total,
    selectedCategoryId,
    selectedCategoryLabel,
    keyword,
    kindFilter,
    page,
    pageSize,
    loadBrowseBehaviorWorkspace,
    selectBehaviorCategory,
    applyBehaviorFilters,
    resetBehaviorFilters,
    changeBehaviorPage,
    changeBehaviorPageSize,
  };
}
