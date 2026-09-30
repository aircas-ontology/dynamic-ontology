import { computed, onScopeDispose, ref, watch } from "vue";
import type {
  OntologySpaceDraft,
  OntologySpaceItem,
  OntologySpaceLoadStatus,
  OntologySpaceSortOrder,
  OntologySpaceSummary,
  OntologyViewMode,
  OverviewCountVO,
} from "@/types";
import { getOntologyOverviewCountInterface, getOntologySpaceListInterface } from "@/apis";
import { ontologySpaceListMock } from "@/mocks/ontologySpaceListMock/ontologySpaceListMock";
import { mapOntologySpaceList } from "@/utils/mapOntologySpaceList";
import { filterSpaces, removeSpace, saveSpace } from "../utils/spaceOperations";

/**
 * @description 查询本体空间列表并映射为页面模型；远程不可用期间回退到本地页面样例数据。
 * @returns 本体空间数组的深拷贝，避免页面编辑污染样例数据。
 */
async function fetchOntologySpaces(): Promise<OntologySpaceItem[]> {
  try {
    const response = await getOntologySpaceListInterface();
    if (response.code === 200) {
      return structuredClone(mapOntologySpaceList(response.data));
    }
    throw new Error(`本体空间列表查询失败：${response.message}`);
  } catch {
    return structuredClone(ontologySpaceListMock.data);
  }
}

/** 本页独占的演示状态，离开页面后释放，数据不写入浏览器存储。 */
export function useSpaceManagement(loader: () => Promise<OntologySpaceItem[]> = fetchOntologySpaces) {
  const spaces = ref<OntologySpaceItem[]>([]);
  const keyword = ref("");
  const order = ref<OntologySpaceSortOrder>("asc");
  const viewMode = ref<OntologyViewMode>("table");
  const page = ref(1);
  const pageSize = ref(10);
  const status = ref<OntologySpaceLoadStatus>("loading");
  const error = ref("");
  const overviewCount = ref<OverviewCountVO>({});
  const overviewStatus = ref<Exclude<OntologySpaceLoadStatus, "empty">>("loading");
  const overviewError = ref("");
  let disposed = false;
  let pending = false;
  let overviewPending = false;
  onScopeDispose(() => {
    disposed = true;
  });
  const result = computed(() => filterSpaces(spaces.value, keyword.value, order.value, page.value, pageSize.value));
  watch(
    [keyword, order, pageSize],
    () => {
      page.value = 1;
    },
    { flush: "sync" },
  );
  watch(
    () => result.value.page,
    (value) => {
      page.value = value;
    },
  );
  const summaryStats = computed<OntologySpaceSummary[]>(() => [
    { id: "space", label: "本体空间", value: overviewCount.value.spaceCount ?? 0, icon: "Box" },
    { id: "object", label: "本体对象", value: overviewCount.value.ontologyCount ?? 0, icon: "Connection" },
    { id: "behavior", label: "行为数量", value: overviewCount.value.actionCount ?? 0, icon: "Share" },
    { id: "relation", label: "关系", value: overviewCount.value.linkCount ?? 0, icon: "Link" },
  ]);

  /**
   * @description 判断概览统计接口响应是否为服务端约定的成功结果。
   * @param code 接口响应业务码。
   * @returns 业务码为 0 或 200 时返回 true。
   */
  function isOverviewCountSuccess(code: number): boolean {
    return code === 0 || code === 200;
  }

  /**
   * @description 查询本体服务概览统计数据；防止重复请求与卸载后回写。
   */
  async function loadOntologyOverviewCount() {
    if (overviewPending || disposed) return;
    overviewPending = true;
    overviewStatus.value = "loading";
    overviewError.value = "";
    try {
      const response = await getOntologyOverviewCountInterface();
      if (disposed) return;
      if (!isOverviewCountSuccess(response.code)) {
        overviewCount.value = {};
        overviewStatus.value = "error";
        overviewError.value = response.message || "概览统计数据加载失败，请重试。";
        return;
      }
      overviewCount.value = response.data ?? {};
      overviewStatus.value = "success";
    } catch (cause) {
      if (!disposed) {
        overviewCount.value = {};
        overviewStatus.value = "error";
        overviewError.value = cause instanceof Error && cause.message.trim() ? cause.message : "概览统计数据加载失败，请重试。";
      }
    } finally {
      overviewPending = false;
    }
  }

  /**
   * @description 加载本体空间列表并更新页面状态；防止重复请求与卸载后回写。
   */
  async function loadOntologySpaces() {
    if (pending || disposed) return;
    pending = true;
    status.value = "loading";
    error.value = "";
    try {
      const data = await loader();
      if (disposed) return;
      spaces.value = data;
      status.value = data.length ? "success" : "empty";
    } catch {
      if (!disposed) {
        status.value = "error";
        error.value = "本体空间加载失败，请重试。";
      }
    } finally {
      pending = false;
    }
  }

  /**
   * @description 创建或更新内存中的本体空间项。
   * @param draft 表单草稿。
   * @param id 编辑时的空间 id；缺省为新建。
   */
  function saveOntologySpace(draft: OntologySpaceDraft, id?: string) {
    spaces.value = saveSpace(spaces.value, draft, id);
    status.value = "success";
  }

  /**
   * @description 按 id 从内存列表移除本体空间。
   * @param id 空间 id。
   */
  function removeOntologySpace(id: string) {
    spaces.value = removeSpace(spaces.value, id);
    status.value = spaces.value.length ? "success" : "empty";
  }

  return {
    spaces,
    keyword,
    order,
    viewMode,
    page,
    pageSize,
    status,
    error,
    overviewError,
    overviewStatus,
    result,
    summaryStats,
    loadOntologyOverviewCount,
    loadOntologySpaces,
    saveOntologySpace,
    removeOntologySpace,
  };
}
