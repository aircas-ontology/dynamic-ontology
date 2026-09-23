import type { ApiResponse, ImportOntologySpaceData } from "@/types";

export const importOntologySpaceMock: ApiResponse<ImportOntologySpaceData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: ["imported-item"],
};
