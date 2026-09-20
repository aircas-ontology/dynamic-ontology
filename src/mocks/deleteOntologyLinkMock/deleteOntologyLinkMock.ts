import type { ApiResponse } from "@/types";

/** 删除本体之间关系成功样例（与契约输出样例一致）。 */
export const deleteOntologyLinkMock: ApiResponse<undefined> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: undefined,
};
