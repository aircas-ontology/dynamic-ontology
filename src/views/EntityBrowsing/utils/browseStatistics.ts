import { onScopeDispose, ref, watch, type Ref } from "vue";
import type { OntologyCategoryTreeNode, OntologySpaceStatisticVO } from "@/types";

interface BrowseStatistics {
  ontology: number;
  relation: number;
  entity: number;
  functionOperator: number;
}

type StatisticLoader = (spaceId: string) => Promise<Partial<OntologySpaceStatisticVO> | null>;
type CategoryLoader = (spaceId: string) => Promise<OntologyCategoryTreeNode | null>;

/**
 * @description 将无效或缺失的数量归一为零。
 * @param value 后端返回的数量。
 * @returns 可用于展示的非负数量。
 */
function normalizeCount(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * @description 汇总分类树中的对象实例数，同一对象只计算一次。
 * @param tree 当前空间的对象分类树。
 * @returns 实例总数。
 */
export function countSpaceEntities(tree: OntologyCategoryTreeNode | null): number {
  if (!tree) return 0;
  const seen = new Set<string>();
  let count = 0;
  const pending = [tree];
  while (pending.length) {
    const node = pending.pop();
    if (!node) continue;
    for (const object of node.ontologyMetaInfos ?? []) {
      const id = object.uniqueIdentifier?.trim();
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      count += normalizeCount(object.entityCount);
    }
    pending.push(...(node.children ?? []));
  }
  return count;
}

/**
 * @description 按当前空间并发加载统计和对象分类树，忽略重复请求和过期响应。
 * @param spaceId 当前空间标识。
 * @param loadStatistic 查询空间统计。
 * @param loadCategories 查询对象分类树。
 * @returns 数量、查询状态和重试方法。
 */
export function useBrowseStatistics(spaceId: Ref<string>, loadStatistic: StatisticLoader, loadCategories: CategoryLoader) {
  const data = ref<BrowseStatistics>({ ontology: 0, relation: 0, entity: 0, functionOperator: 0 });
  const status = ref<"loading" | "success" | "error">("loading");
  const error = ref("");
  let generation = 0;
  let pendingId = "";
  let disposed = false;

  /** @description 查询当前空间的统计数据，并在失败时保留可见错误。 */
  async function loadBrowseStatistics(): Promise<void> {
    const id = spaceId.value.trim();
    if (disposed || (id && status.value === "loading" && pendingId === id)) return;
    const request = ++generation;
    pendingId = id;
    status.value = "loading";
    error.value = "";
    data.value = { ontology: 0, relation: 0, entity: 0, functionOperator: 0 };
    try {
      if (!id) throw new Error("空间标识无效，无法查询统计数据。");
      const [statistic, tree] = await Promise.all([loadStatistic(id), loadCategories(id)]);
      if (disposed || request !== generation || id !== spaceId.value.trim()) return;
      data.value = {
        ontology: normalizeCount(statistic?.ontologyCount),
        relation: normalizeCount(statistic?.linkCount),
        entity: countSpaceEntities(tree),
        functionOperator: normalizeCount(statistic?.functionCount),
      };
      status.value = "success";
    } catch (cause) {
      if (disposed || request !== generation || id !== spaceId.value.trim()) return;
      error.value = cause instanceof Error && cause.message.trim() ? cause.message : "空间统计加载失败，请重试。";
      status.value = "error";
    } finally {
      if (request === generation) pendingId = "";
    }
  }

  watch(spaceId, loadBrowseStatistics, { immediate: true });
  onScopeDispose(() => {
    disposed = true;
    generation += 1;
  });
  return { data, status, error, loadBrowseStatistics };
}
