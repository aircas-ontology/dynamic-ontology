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
    version: "1.0.0",
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
      aggFunc: "SUM",
      targetProperty: "target",
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

/** 脚本函数详情成功样例（与 getFunInfo 脚本示例一致）。 */
export const getOntologyScriptFunctionDetailMock: ApiResponse<GetOntologyFunctionDetailData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    functionApi: "jbtest",
    version: "1.0.1",
    publishStatus: 0,
    displayName: "脚本函数cesi",
    description: "jbtest 1.0.1",
    model: "OTHER",
    type: "CUSTOMIZE",
    language: "TYPESCRIPT",
    ontologySpaceId: 1,
    params: [
      {
        paramId: 1122,
        paramName: "input",
        paramType: "OBJECT",
        category: "INPUT",
        paramOrder: 1,
        fields: [
          {
            paramName: "a",
            paramType: "OBJECT",
            category: "INPUT",
            paramOrder: 1,
            fields: [
              { paramName: "aa", paramType: "OBJECT", category: "INPUT", paramOrder: 1 },
              { paramName: "data", paramType: "STRING", category: "INPUT", paramOrder: 2 },
            ],
          },
          { paramName: "b", paramType: "LIST", category: "INPUT", paramOrder: 2 },
        ],
      },
      {
        paramId: 1123,
        paramName: "age",
        paramType: "DOUBLE",
        category: "INPUT",
        paramOrder: 2,
      },
      {
        paramId: 1124,
        paramName: "Output",
        paramType: "OBJECT",
        category: "OUTPUT",
        paramOrder: 1,
        fields: [
          { paramName: "id", paramType: "DOUBLE", category: "OUTPUT", paramOrder: 1 },
          { paramName: "name", paramType: "STRING", category: "OUTPUT", paramOrder: 2 },
        ],
      },
    ],
    code: "interface User {\n  id: number;\n  name: string;\n}\n\ninterface Output {\n  id: number;\n  name1: string;\n}\n\nexport function handle(input: User): Output {\n    return {\n        id:input.id+1,\n        name1:input.name+'a',\n    }\n}\n",
  },
};
