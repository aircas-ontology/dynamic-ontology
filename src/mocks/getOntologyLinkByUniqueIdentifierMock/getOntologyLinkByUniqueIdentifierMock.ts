import type { ApiResponse, GetOntologyLinkByUniqueIdentifierData } from "@/types";

/** 根据 link 唯一标识查询关系成功响应样例。 */
export const getOntologyLinkByUniqueIdentifierMock: ApiResponse<GetOntologyLinkByUniqueIdentifierData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    uniqueIdentifier: "c91e24645b5a46019fc48060a2103ab0",
    name: "打击",
    ontologyUniqueIdentifierFrom: "ea512d439cd34c6ebbcde6b692261ab5",
    ontologyNameFrom: "飞机",
    ontologyUniqueIdentifierTo: "c8adbff823c54653adc11c8fa1fa7c14",
    ontologyNameTo: "导弹",
    categoryId: 204,
    apiName: "act_strike",
    description: "同一对端的第二条关系：验证一对对象可挂多条关系，也可用来测关系下无匹配边的情形",
  },
};
