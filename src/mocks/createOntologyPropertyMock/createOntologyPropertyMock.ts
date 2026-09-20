import type { ApiResponse, CreateOntologyPropertyData } from "@/types";

export const createOntologyPropertyMock: ApiResponse<CreateOntologyPropertyData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: undefined,
};
