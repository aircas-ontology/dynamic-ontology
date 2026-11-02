import type { FunctionOperatorTemplate, FunctionOperatorTemplateLanguage } from "./functionOperatorTemplateType";

/** 函数算子代码模板列表查询参数。 */
export interface ListFunctionOperatorTemplateParams {
  name?: string;
  language?: FunctionOperatorTemplateLanguage;
}

/** 函数算子代码模板列表响应数据。 */
export type ListFunctionOperatorTemplateData = FunctionOperatorTemplate[];
