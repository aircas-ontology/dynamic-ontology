import type { ApiResponse, ListOntologyActionData, ListOntologyActionParams, ScheduleBehaviorOption } from "@/types";

/**
 * @description 每页1000条获取空间全部行为，排除基础行为并按稳定标识去重，保留同名行为。
 * @param spaceId 当前空间标识。
 * @param queryBehaviorList 行为列表接口。
 * @returns 包含标识、API 和显示名称的可选行为。
 */
export async function fetchScheduleBehaviorOptions(
  spaceId: number,
  queryBehaviorList: (params: ListOntologyActionParams) => Promise<ApiResponse<ListOntologyActionData>>,
): Promise<ScheduleBehaviorOption[]> {
  const options = new Map<string, ScheduleBehaviorOption>();
  let pageNum = 1;
  let pages = 1;
  do {
    const response = await queryBehaviorList({ ontologySpaceId: spaceId, pageNum, pageSize: 1000 });
    if ((response.code !== 200 && response.code !== 0) || !response.data) throw new Error(response.message || "行为列表加载失败");
    for (const record of response.data.records) {
      const actionApi = record.actionApi?.trim();
      const displayName = record.displayName.trim() || actionApi;
      if (record.actionKind !== "BASE" && displayName && actionApi) {
        const id = String(record.id);
        options.set(id, { id, actionApi, displayName, ontologyUniqIdentifier: record.ontologyUniqIdentifier?.trim() || "" });
      }
    }
    pages = response.data.pages;
    pageNum += 1;
  } while (pageNum <= pages);
  return [...options.values()];
}
