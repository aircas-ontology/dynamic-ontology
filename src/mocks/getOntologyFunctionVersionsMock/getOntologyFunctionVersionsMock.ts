import type { ApiResponse, GetOntologyFunctionVersionsData } from "@/types";

/** 函数版本号列表成功样例（与契约输出样例一致）。 */
export const getOntologyFunctionVersionsMock: ApiResponse<GetOntologyFunctionVersionsData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: ["1.0.0"],
};
