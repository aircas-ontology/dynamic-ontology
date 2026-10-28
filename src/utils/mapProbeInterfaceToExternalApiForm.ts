import type { ProbeOntologyFunctionContainerInterfaceItem, ProbeOntologyFunctionContainerInterfaceParameter } from "@/types";
import type { OntologyExternalApiFormField, OntologyExternalApiFormValues } from "@/utils/mapOntologyFunctionDetail";

/** 外部 API 表单可回显的参数类型。 */
type ExternalApiFormParameterType = OntologyExternalApiFormField["type"];

/** 外部 API 表单可回显的参数位置。 */
type ExternalApiFormLocation = OntologyExternalApiFormValues["inputs"][number]["location"];

/** 探查接口映射到外部 API 入出参表单后的结果。 */
export interface ProbeInterfaceExternalApiFormParams {
  inputs: OntologyExternalApiFormValues["inputs"];
  outputs: OntologyExternalApiFormValues["outputs"];
  /** 规范化后的请求方法；无法识别时为 null。 */
  method: OntologyExternalApiFormValues["method"] | null;
}

const EXTERNAL_API_LOCATION_TO_FORM: Record<string, ExternalApiFormLocation> = {
  body: "Body",
  path: "Path",
  query: "Query",
  header: "Header",
};

const EXTERNAL_API_METHOD_SET = new Set<OntologyExternalApiFormValues["method"]>(["GET", "POST", "PUT", "DELETE"]);

/**
 * @description 判断参数类型是否能回显到外部 API 表单。
 * @param value 参数类型。
 * @returns 是否为表单支持的类型。
 */
function isExternalApiFormParameterType(value: string): value is ExternalApiFormParameterType {
  return value === "string" || value === "number" || value === "boolean" || value === "array" || value === "object";
}

/**
 * @description 将探查参数类型规范为外部 API 表单类型；integer 按 number 处理。
 * @param value 原始类型字符串。
 * @returns 表单类型；无法识别时返回 null。
 */
function normalizeExternalApiFormParameterType(value: string): ExternalApiFormParameterType | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "integer") {
    return "number";
  }
  if (isExternalApiFormParameterType(normalized)) {
    return normalized;
  }
  return null;
}

/**
 * @description 将探查参数位置规范为外部 API 表单位置；未知回落 Body。
 * @param value 探查 in 字段。
 * @returns 表单位置。
 */
function normalizeExternalApiFormLocation(value: string): ExternalApiFormLocation {
  const normalized = value.trim().toLowerCase();
  return EXTERNAL_API_LOCATION_TO_FORM[normalized] ?? "Body";
}

/**
 * @description 递归映射探查嵌套 fields；跳过无法识别的类型，非 object 不带 fields。
 * @param fields 探查嵌套属性。
 * @returns 表单嵌套属性；无有效项时返回 undefined。
 */
function mapProbeFieldsToExternalApiFormFields(
  fields: ProbeOntologyFunctionContainerInterfaceParameter[] | undefined,
): OntologyExternalApiFormField[] | undefined {
  if (!Array.isArray(fields) || fields.length === 0) {
    return undefined;
  }
  const mapped: OntologyExternalApiFormField[] = [];
  for (const field of fields) {
    const name = typeof field.name === "string" ? field.name.trim() : "";
    const parameterType = typeof field.type === "string" ? normalizeExternalApiFormParameterType(field.type) : null;
    if (!name || !parameterType) {
      continue;
    }
    const item: OntologyExternalApiFormField = {
      name,
      type: parameterType,
      description: typeof field.description === "string" ? field.description : "",
    };
    if (parameterType === "object") {
      const nested = mapProbeFieldsToExternalApiFormFields(field.fields);
      if (nested && nested.length > 0) {
        item.fields = nested;
      }
    }
    mapped.push(item);
  }
  return mapped.length > 0 ? mapped : undefined;
}

/**
 * @description 将探查入参列表映射为外部 API 输入表单行。
 * @param params 探查入参。
 * @returns 输入表单行。
 */
function mapProbeInputsToExternalApiForm(params: ProbeOntologyFunctionContainerInterfaceParameter[]): OntologyExternalApiFormValues["inputs"] {
  const inputs: OntologyExternalApiFormValues["inputs"] = [];
  for (const param of params) {
    const name = typeof param.name === "string" ? param.name.trim() : "";
    const parameterType = typeof param.type === "string" ? normalizeExternalApiFormParameterType(param.type) : null;
    if (!name || !parameterType) {
      continue;
    }
    const item: OntologyExternalApiFormValues["inputs"][number] = {
      name,
      type: parameterType,
      description: typeof param.description === "string" ? param.description : "",
      location: normalizeExternalApiFormLocation(typeof param.in === "string" ? param.in : ""),
      required: param.required ? "yes" : "no",
    };
    if (parameterType === "object") {
      const nested = mapProbeFieldsToExternalApiFormFields(param.fields);
      if (nested && nested.length > 0) {
        item.fields = nested;
      }
    }
    inputs.push(item);
  }
  return inputs;
}

/**
 * @description 将探查出参列表映射为外部 API 输出表单行。
 * @param params 探查出参。
 * @returns 输出表单行。
 */
function mapProbeOutputsToExternalApiForm(params: ProbeOntologyFunctionContainerInterfaceParameter[]): OntologyExternalApiFormValues["outputs"] {
  const outputs: OntologyExternalApiFormValues["outputs"] = [];
  for (const param of params) {
    const name = typeof param.name === "string" ? param.name.trim() : "";
    const parameterType = typeof param.type === "string" ? normalizeExternalApiFormParameterType(param.type) : null;
    if (!name || !parameterType) {
      continue;
    }
    const item: OntologyExternalApiFormField = {
      name,
      type: parameterType,
      description: typeof param.description === "string" ? param.description : "",
    };
    if (parameterType === "object") {
      const nested = mapProbeFieldsToExternalApiFormFields(param.fields);
      if (nested && nested.length > 0) {
        item.fields = nested;
      }
    }
    outputs.push(item);
  }
  return outputs;
}

/**
 * @description 将探查得到的单个接口映射为外部 API 入出参表单值；不同步接口地址 URL。
 * @param item 探查接口项。
 * @returns 入出参与规范化 method。
 */
export function mapProbeInterfaceToExternalApiFormParams(item: ProbeOntologyFunctionContainerInterfaceItem): ProbeInterfaceExternalApiFormParams {
  const methodRaw = typeof item.method === "string" ? item.method.trim().toUpperCase() : "";
  const method = EXTERNAL_API_METHOD_SET.has(methodRaw as OntologyExternalApiFormValues["method"])
    ? (methodRaw as OntologyExternalApiFormValues["method"])
    : null;
  return {
    inputs: mapProbeInputsToExternalApiForm(Array.isArray(item.inputParameters) ? item.inputParameters : []),
    outputs: mapProbeOutputsToExternalApiForm(Array.isArray(item.outputParameters) ? item.outputParameters : []),
    method,
  };
}
