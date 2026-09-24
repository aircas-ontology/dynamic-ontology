import type { ApiResponse } from "@/types";

/** 更新本体之间关系成功样例（与契约输出样例一致）。 */
export const updateOntologyLinkMock: ApiResponse<undefined> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: undefined,
};
