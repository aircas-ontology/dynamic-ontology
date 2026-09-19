import type { ApiResponse, ExampleData, ExampleParams } from "@/types";
import { requestTimeoutMs } from "@/utils/constants";
import { request } from "@/utils/request";

/**
 * 查询示例数据列表。
 *
 * 请求方式：GET `/example`
 *
 * @param params 查询参数。
 * @param params.keyword 可选的查询关键词，用于匹配示例数据名称。
 * @param params.page 当前页码，从 1 开始。
 * @param params.pageSize 每页返回的数据条数。
 * @returns 标准 API 响应，包含状态信息和分页数据：
 * - `code`：业务状态码。
 * - `message`：接口返回的提示信息。
 * - `success`：请求是否成功。
 * - `data.items`：当前页的示例数据列表，每项包含 `id` 和 `name`。
 * - `data.total`：符合查询条件的示例数据总数。
 */
export function getExampleInterface(params: ExampleParams): Promise<ApiResponse<ExampleData>> {
  return request<ExampleData>({
    url: DOMAIN_CONFIG.OCEAN_SERVER_URL + "/example",
    method: "get",
    params,
    timeout: requestTimeoutMs,
  });
}
