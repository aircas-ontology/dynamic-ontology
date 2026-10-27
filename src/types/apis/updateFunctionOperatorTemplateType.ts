import type { FunctionOperatorTemplate, FunctionOperatorTemplateParams } from "./functionOperatorTemplateType";

/** 修改函数算子代码模板请求参数。 */
export interface UpdateFunctionOperatorTemplateParams {
  id: number;
  data: FunctionOperatorTemplateParams;
}

/** 修改函数算子代码模板响应数据。 */
export type UpdateFunctionOperatorTemplateData = FunctionOperatorTemplate;
