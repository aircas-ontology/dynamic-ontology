import type { ApiResponse, DeleteOntologyPropertyData } from "@/types";

export const deleteOntologyPropertyMock: ApiResponse<DeleteOntologyPropertyData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: undefined,
};
