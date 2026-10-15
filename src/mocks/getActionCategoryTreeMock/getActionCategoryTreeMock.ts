import type { ActionCategoryVO, ApiResponse } from "@/types";

export const getActionCategoryTreeMock: ApiResponse<ActionCategoryVO> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    id: 1,
    name: "行为分类",
    children: [],
  },
};
