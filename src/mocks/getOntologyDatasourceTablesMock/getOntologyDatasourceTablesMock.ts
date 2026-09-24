import type { ApiResponse, GetOntologyDatasourceTablesData } from "@/types";

export const getOntologyDatasourceTablesMock: ApiResponse<GetOntologyDatasourceTablesData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    records: [{ schemaName: "public", tableName: "xtmb", description: "系统目标" }],
    total: 1,
    size: 1000,
    current: 1,
  },
};
