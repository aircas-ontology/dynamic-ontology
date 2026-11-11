import type { ApiResponse, ListOntologyActionData, ListOntologyActionParams } from "@/types";

/**
 * @description 每页1000条获取空间全部行为，排除基础行为并去重名称。
 * @param spaceId 当前空间标识。
 * @param queryBehaviorList 行为列表接口。
 * @returns 可选行为名称。
 */
export async function fetchScheduleBehaviorOptions(
  spaceId: number,
  queryBehaviorList: (params: ListOntologyActionParams) => Promise<ApiResponse<ListOntologyActionData>>,
): Promise<string[]> {
  const names = new Set<string>();
  let pageNum = 1;
  let pages = 1;
  do {
    const response = await queryBehaviorList({ ontologySpaceId: spaceId, pageNum, pageSize: 1000 });
    if ((response.code !== 200 && response.code !== 0) || !response.data) throw new Error(response.message || "行为列表加载失败");
    for (const record of response.data.records) {
      const name = record.displayName.trim() || record.actionApi?.trim();
      if (record.actionKind !== "BASE" && name) names.add(name);
    }
    pages = response.data.pages;
    pageNum += 1;
  } while (pageNum <= pages);
  return [...names];
}
