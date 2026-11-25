import type { ApiResponse, TaskTopicDictionaryItem } from "@/types";
import { request } from "@/utils/request";

/** @description 查询任务主题表单字典。 @param dictionaryType 字典编码。 @returns 字典选项数组。 */
export function getTaskTopicDictionaryInterface(dictionaryType: "task_type" | "task_region"): Promise<ApiResponse<TaskTopicDictionaryItem[]>> {
  return request<TaskTopicDictionaryItem[]>({
    url: DOMAIN_CONFIG.THEME_URL + "/dict",
    method: "get",
    params: { groupCode: dictionaryType },
  });
}
