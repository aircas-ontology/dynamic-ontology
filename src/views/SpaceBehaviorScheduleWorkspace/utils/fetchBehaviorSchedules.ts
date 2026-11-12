import type { ApiResponse, BehaviorScheduleRecord, ListBehaviorSchedulingData, ListBehaviorSchedulingParams, ListBehaviorSchedulingRecord } from "@/types";

/** @description 将真实列表字段映射为页面记录，缺失详情保持为空并禁用详情操作。 @param record 接口记录。 @returns 页面列表记录。 */
function mapBehaviorSchedulingRecord(record: ListBehaviorSchedulingRecord): BehaviorScheduleRecord {
  return {
    id: String(record.id),
    name: record.schedulingName,
    strategy: record.type === "TASK" ? "周期调度" : "规则调度",
    target: record.ontologyName?.trim() || "-",
    ontologyIdentifier: record.ontologyIdentifier,
    behavior: record.actionName,
    behaviorActionApi: record.actionApi,
    description: record.description,
    status: record.status,
    createdAt: record.createTime?.trim() ? record.createTime : "-",
    detailsAvailable: false,
    periodKind: "Cron",
    weekdays: [],
    monthDay: null,
    executeTime: "",
    cronExpression: "",
    instance: "",
    behaviorParameters: null,
    ruleFlow: null,
  };
}

/** @description 查询调度单页并校验响应，过期会话返回空值。 @param querySchedulingList 列表接口。 @param isCurrentSession 当前会话是否有效。 @param params 已应用的分页及筛选参数。 @returns 当前页和总数，过期为空。 */
export async function fetchBehaviorSchedules(
  querySchedulingList: (params: ListBehaviorSchedulingParams) => Promise<ApiResponse<ListBehaviorSchedulingData>>,
  isCurrentSession: () => boolean = () => true,
  params: ListBehaviorSchedulingParams = { pageNum: 1, pageSize: 10 },
): Promise<{ records: BehaviorScheduleRecord[]; total: number } | null> {
  if (!isCurrentSession()) return null;
  const response = await querySchedulingList(params);
  if (!isCurrentSession()) return null;
  if ((response.code !== 200 && response.code !== 0) || response.success === false || !response.data)
    throw new Error(response.message?.trim() || "调度列表加载失败");
  const data = response.data;
  if (
    !Array.isArray(data.records) ||
    !Number.isSafeInteger(data.total) ||
    data.total < 0 ||
    !Number.isSafeInteger(data.size) ||
    data.size <= 0 ||
    data.current !== (params.pageNum ?? 1)
  )
    throw new Error("调度列表分页数据无效");
  return { records: data.records.map(mapBehaviorSchedulingRecord), total: data.total };
}
