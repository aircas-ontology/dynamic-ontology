import type { ApiResponse, GetOntologyFunctionDetailData } from "@/types";

/** 函数详情成功样例（与契约输出样例一致，含 paramRole）。 */
export const getOntologyFunctionDetailMock: ApiResponse<GetOntologyFunctionDetailData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    functionApi: "ss",
    displayName: "ss",
    description: "ss",
    model: "BASIC",
    type: "BASIC_QUERY",
    ontologySpaceId: 46,
    params: [
      {
        paramId: 25,
        paramName: "xingbie",
        paramType: "STRING",
        category: "INPUT",
        paramOrder: 1,
        description: "过滤条件",
        paramRole: "FILTER",
      },
      {
        paramId: 26,
        paramName: "age",
        paramType: "STRING",
        category: "INPUT",
        paramOrder: 2,
        description: "过滤条件",
        paramRole: "FILTER",
      },
      {
        paramId: 27,
        paramName: "target",
        paramType: "STRING",
        category: "INPUT",
        paramOrder: 3,
        description: "聚合目标",
        paramRole: "AGGREGATION",
      },
    ],
    code: '{"aggFunc":null,"targetProperty":null,"filters":{"logic":"AND","children":[{"type":"FILTER","filter":{"propertyApiName":"age","op":"EQ","value":"10","values":null,"dataType":"STRING"},"group":null}]}}',
    queryConfig: {
      filters: {
        logic: "AND",
        children: [
          {
            type: "FILTER",
            filter: {
              propertyApiName: "age",
              op: "EQ",
              value: "10",
              dataType: "STRING",
            },
          },
        ],
      },
    },
  },
};
