import { onScopeDispose, ref, watch, type Ref } from "vue";
import type { ManagementWorkspaceTab, OntologySpaceOverview, OntologySpaceStatisticVO } from "@/types";
import { getOntologySpaceStatisticInterface } from "@/apis";
import { ontologySpaceManagementDetailMock } from "@/mocks/ontologySpaceManagementDetailMock/ontologySpaceManagementDetailMock";

/** 统计接口字段到工作区 tab 的映射。 */
const STATISTIC_FIELD_TO_TAB: ReadonlyArray<{ field: keyof OntologySpaceStatisticVO; tab: Exclude<ManagementWorkspaceTab, "overview"> }> = [
  { field: "ontologyCount", tab: "object" },
  { field: "linkCount", tab: "relation" },
  { field: "functionCount", tab: "function-operator" },
  { field: "actionCount", tab: "behavior" },
  { field: "actionSchedulingCount", tab: "behavior-schedule" },
];

/**
 * @description 将后端统计 VO 映射为空间概览数据；所有非零计数的 tab 标记为可用。
 * @param statistic 后端返回的本体空间资源统计对象。
 * @returns 适配前端概览面板的结构。
 */
export function mapOntologySpaceStatistic(statistic: OntologySpaceStatisticVO): OntologySpaceOverview {
  const counts: OntologySpaceOverview["counts"] = {};
  const availableTabs: ManagementWorkspaceTab[] = ["overview"];
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
 * @description 从后端统计接口加载空间概览；接口不可用时回退到本地 mock 数据。
 * @param id 本体空间 id。
 * @returns 概览数据；接口与 mock 均无对应数据时返回 undefined。
 */
async function loadSpaceOverviewFromApi(id: string): Promise<OntologySpaceOverview | undefined> {
  const spaceIdNumber = Number(id);
  if (!Number.isFinite(spaceIdNumber)) {
    return ontologySpaceManagementDetailMock.find((item) => item.spaceId === id);
  }
  try {
    const response = await getOntologySpaceStatisticInterface({ spaceId: spaceIdNumber });
    if (response.code === 200 && response.data) return mapOntologySpaceStatistic(response.data);
  } catch {
    // 接口不可用时回退到 mock。
  }
  return ontologySpaceManagementDetailMock.find((item) => item.spaceId === id);
}

export function useSpaceOverview(spaceId: Ref<string>, loader: (id: string) => Promise<OntologySpaceOverview | undefined> = loadSpaceOverviewFromApi) {
  const data = ref<OntologySpaceOverview>();
  const loading = ref(false);
  const error = ref("");
  let generation = 0;
  let disposed = false;
  let pendingId: string | undefined;

  /**
   * @description 按当前空间 id 加载空间资源统计；同一空间加载中时不重复请求，过期响应不覆盖新结果。
   */
  async function loadSpaceOverview() {
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
    } catch {
      if (!disposed && request === generation) error.value = "空间统计加载失败，请重试。";
    } finally {
      if (!disposed && request === generation) loading.value = false;
    }
  }
  watch(spaceId, loadSpaceOverview, { immediate: true });
  onScopeDispose(() => {
    disposed = true;
    generation++;
  });
  return { data, loading, error, loadSpaceOverview };
}
