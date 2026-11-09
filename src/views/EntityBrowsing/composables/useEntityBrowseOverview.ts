import { computed, type Ref } from "vue";
import { getOntologyCategoryTreeInterface, getOntologySpaceStatisticInterface } from "@/apis";
import type { OntologyCategoryTreeNode, OntologySpaceStatisticVO } from "@/types";
import { entityBrowseOverviewMock } from "@/mocks/entityBrowsingMock/entityBrowseOverviewMock";
import { mapEntityBrowseOverview } from "../utils/mapEntityBrowseOverview";
import { useBrowseStatistics } from "../utils/browseStatistics";

/**
 * @description 查询空间资源统计，接口成功但无数据时返回空结果。
 * @param spaceId 空间标识。
 * @returns 当前空间统计。
 */
async function loadBrowseSpaceStatistic(spaceId: string): Promise<OntologySpaceStatisticVO | null> {
  const id = Number(spaceId);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("空间标识无效，无法查询统计数据。");
  const response = await getOntologySpaceStatisticInterface({ spaceId: id });
  if (response.code !== 200) throw new Error(response.message || "空间统计加载失败，请重试。");
  return response.data ?? null;
}

/**
 * @description 查询当前空间的对象分类树，用于汇总实体数量。
 * @param spaceId 空间标识。
 * @returns 当前空间分类树。
 */
async function loadBrowseCategoryTree(spaceId: string): Promise<OntologyCategoryTreeNode | null> {
  const response = await getOntologyCategoryTreeInterface({ spaceId });
  if (response.code !== 200) throw new Error(response.message || "对象分类加载失败，请重试。");
  return response.data ?? null;
}

/**
 * @description 加载当前空间统计并保留原有质量数据展示。
 * @param spaceId 当前空间标识。
 * @returns 概览、统计状态和重试方法。
 */
export function useEntityBrowseOverview(spaceId: Ref<string>) {
  const { data, status, error, loadBrowseStatistics } = useBrowseStatistics(spaceId, loadBrowseSpaceStatistic, loadBrowseCategoryTree);
  const overview = computed(() =>
    mapEntityBrowseOverview({
      ...entityBrowseOverviewMock,
      ontologyCount: data.value.ontology,
      relationCount: data.value.relation,
      entityCount: data.value.entity,
    }),
  );
  return { overview, counts: data, status, error, loadBrowseStatistics };
}
