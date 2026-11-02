/** 函数算子代码模板服务端脚本语言。 */
export type FunctionOperatorTemplateLanguage = "GROOVY" | "JAVA" | "PYTHON" | "TYPESCRIPT";

/** 函数算子代码模板创建或修改参数。 */
export interface FunctionOperatorTemplateParams {
  name: string;
  language: FunctionOperatorTemplateLanguage;
  description?: string;
  code: string;
}

/** 函数算子代码模板。 */
export interface FunctionOperatorTemplate {
  id: number;
  name: string;
  language: FunctionOperatorTemplateLanguage;
  description?: string;
  code: string;
  createTime?: string;
  updateTime?: string;
}
