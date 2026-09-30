import type { ApiResponse, GetOntologyDatasourceColumnsData } from "@/types";

export const getOntologyDatasourceColumnsMock: ApiResponse<GetOntologyDatasourceColumnsData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: [
    { columnName: "id", description: "主键", type: "BIGINT", isPrimaryKey: true },
    { columnName: "name", description: "名称", type: "VARCHAR(255)", isPrimaryKey: false },
    { columnName: "description", description: "描述", type: "TEXT", isPrimaryKey: false },
  ],
};
