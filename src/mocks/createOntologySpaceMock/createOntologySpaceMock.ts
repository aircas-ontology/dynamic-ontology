import type { ApiResponse, CreateOntologySpaceData } from "@/types";

export const createOntologySpaceMock: ApiResponse<CreateOntologySpaceData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: 8,
};
