import { onScopeDispose, ref, watch, type Ref } from "vue";
import type { ManagementWorkspaceTab, OntologySpaceOverview, OntologySpaceStatisticVO } from "@/types";
import { getOntologySpaceStatisticInterface } from "@/apis";

/** 统计接口字段到工作区 tab 的映射。 */
const STATISTIC_FIELD_TO_TAB: ReadonlyArray<{ field: keyof OntologySpaceStatisticVO; tab: ManagementWorkspaceTab }> = [
  { field: "ontologyCount", tab: "object" },
  { field: "linkCount", tab: "relation" },
  { field: "functionCount", tab: "function-operator" },
  { field: "actionCount", tab: "behavior" },
];

/**
 * @description 将后端空间统计 VO 映射为 Tab 计数概览。
 * @param statistic 对象空间资源统计。
 * @returns 前端 Tab 计数结构。
 */
export function mapEntityBrowseSpaceStatistic(statistic: OntologySpaceStatisticVO): OntologySpaceOverview {
  const counts: OntologySpaceOverview["counts"] = {};
  const availableTabs: ManagementWorkspaceTab[] = [];
  for (const { field, tab } of STATISTIC_FIELD_TO_TAB) {
    const value = statistic[field] ?? 0;
    counts[tab] = value;
    if (value > 0) availableTabs.push(tab);
  }
  return {
    spaceId: String(statistic.spaceId),
    counts,
    availableTabs,
  };
}

/**
 * @description 从空间统计接口加载 Tab 后缀计数。
 * @param id 对象空间 id。
 * @returns 概览数据；成功但无 data 时返回 undefined。
 */
async function loadEntityBrowseSpaceStatisticFromApi(id: string): Promise<OntologySpaceOverview | undefined> {
  const spaceIdNumber = Number(id);
  if (!Number.isFinite(spaceIdNumber)) {
    throw new Error("空间标识无效，无法加载统计数据。");
  }
  const response = await getOntologySpaceStatisticInterface({ spaceId: spaceIdNumber });
  if (response.code !== 200) {
    throw new Error(response.message.trim() || "空间统计加载失败，请重试。");
  }
  if (!response.data) {
    return undefined;
  }
  return mapEntityBrowseSpaceStatistic(response.data);
}

/**
 * @description 按当前空间 id 加载 Tab 资源计数；同空间加载中不重复请求，过期响应不覆盖。
 * @param spaceId 当前空间 id。
 * @param loader 可注入的加载函数，默认走统计接口。
 * @returns 计数状态与重新加载方法。
 */
export function useEntityBrowseSpaceStatistic(
  spaceId: Ref<string>,
  loader: (id: string) => Promise<OntologySpaceOverview | undefined> = loadEntityBrowseSpaceStatisticFromApi,
) {
  const data = ref<OntologySpaceOverview>();
  const loading = ref(false);
  const error = ref("");
  let generation = 0;
  let disposed = false;
  let pendingId: string | undefined;

  /**
   * @description 加载当前空间的 Tab 资源统计。
   */
  async function loadEntityBrowseSpaceStatistic(): Promise<void> {
    const id = spaceId.value;
    if (disposed || (loading.value && pendingId === id)) return;
    const request = ++generation;
    pendingId = id;
    loading.value = true;
    error.value = "";
    data.value = undefined;
    try {
      const result = await loader(id);
      if (!disposed && request === generation) data.value = result;
    } catch (cause) {
      if (!disposed && request === generation) {
        error.value = cause instanceof Error && cause.message.trim() ? cause.message : "空间统计加载失败，请重试。";
      }
    } finally {
      if (!disposed && request === generation) loading.value = false;
    }
  }

  watch(spaceId, loadEntityBrowseSpaceStatistic, { immediate: true });
  onScopeDispose(() => {
    disposed = true;
    generation += 1;
  });

  return { data, loading, error, loadEntityBrowseSpaceStatistic };
}
