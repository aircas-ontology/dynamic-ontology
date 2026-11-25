import type { ApiResponse, TaskTopicCreateParams, TaskTopicDetail, TaskTopicItem, TaskTopicUpdateParams } from "@/types";
import { request } from "@/utils/request";

/** @description 查询任务主题列表。 @returns 任务主题数组。 */
export function getTaskTopicListInterface(): Promise<ApiResponse<TaskTopicItem[]>> {
  return request<TaskTopicItem[]>({ url: DOMAIN_CONFIG.THEME_URL + "/task-topic", method: "get" });
}
/**
 * @description 按任务编号查询任务主题详情与事件阶段。
 *
 * 请求方式：GET `/task-topic/{id}`
 *
 * @param id 任务编号。
 * @returns 标准 API 响应，data 为任务主题详情及其事件阶段列表。
 */
export function getTaskTopicDetailInterface(id: string | number): Promise<ApiResponse<TaskTopicDetail>> {
  return request<TaskTopicDetail>({ url: `${DOMAIN_CONFIG.THEME_URL}/task-topic/${encodeURIComponent(String(id))}`, method: "get" });
}
/** @description 创建任务主题。 @param data 任务主题创建参数。 @returns 创建结果。 */
export function postTaskTopicInterface(data: TaskTopicCreateParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({ url: DOMAIN_CONFIG.THEME_URL + "/task-topic", method: "post", data });
}
/** @description 编辑任务主题。 @param data 包含 id 的编辑参数。 @returns 编辑结果。 */
export function putTaskTopicInterface(data: TaskTopicUpdateParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({ url: DOMAIN_CONFIG.THEME_URL + "/task-topic", method: "put", data });
}
/** @description 删除任务主题。 @param taskCode 任务编码。 @returns 删除结果。 */
export function deleteTaskTopicInterface(id: string | number): Promise<ApiResponse<unknown>> {
  return request<unknown>({ url: `${DOMAIN_CONFIG.THEME_URL}/task-topic/${encodeURIComponent(String(id))}`, method: "delete" });
}
