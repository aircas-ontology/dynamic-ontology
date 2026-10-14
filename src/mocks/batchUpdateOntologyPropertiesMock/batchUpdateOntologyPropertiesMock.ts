import type { ApiResponse, BatchUpdateOntologyPropertiesData } from "@/types";

/** 批量更新对象属性成功响应样例。 */
export const batchUpdateOntologyPropertiesMock: ApiResponse<BatchUpdateOntologyPropertiesData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {},
};
