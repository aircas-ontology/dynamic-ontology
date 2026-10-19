import type { CreateOntologyFunctionApiConfig, CreateOntologyFunctionApiInput, CreateOntologyFunctionApiOutput, CreateOntologyFunctionParams } from "@/types";

/** 外部 API 表单中的参数位置。 */
type ExternalApiFormLocation = "Body" | "Path" | "Query" | "Header";

/** 外部 API 表单中的参数类型。 */
type ExternalApiFormParameterType = CreateOntologyFunctionApiInput["type"];

/** 组装外部 API 函数创建请求的输入参数行。 */
export interface BuildCreateOntologyExternalFunctionInputRow {
  name: string;
  type: ExternalApiFormParameterType;
  description: string;
  location: ExternalApiFormLocation;
  required: "yes" | "no";
}

/** 组装外部 API 函数创建请求的输出参数行。 */
export interface BuildCreateOntologyExternalFunctionOutputRow {
  name: string;
  type: ExternalApiFormParameterType;
  description: string;
}

/** 组装外部 API 函数创建请求的输入。 */
export interface BuildCreateOntologyExternalFunctionParamsInput {
  functionApi: string;
  version: string;
  displayName: string;
  description: string;
  ontologySpaceId: number;
  /** 新建表单所选源版本；非空表示基于旧版本创建。 */
  sourceVersion: string;
  endpoint: string;
  method: CreateOntologyFunctionApiConfig["method"];
  authType: CreateOntologyFunctionApiConfig["authType"];
  /** 认证 Header；仅 authType 为 apiKey 时写入 apiConfig.apiKey。 */
  apiKey: string;
  inputs: BuildCreateOntologyExternalFunctionInputRow[];
  outputs: BuildCreateOntologyExternalFunctionOutputRow[];
}

const EXTERNAL_API_LOCATION_MAP: Record<ExternalApiFormLocation, CreateOntologyFunctionApiInput["location"]> = {
  Body: "body",
  Path: "path",
  Query: "query",
  Header: "header",
};

/**
 * @description 将外部 API 输入行转为创建接口 inputs，并跳过名称为空的行。
 * @param inputs 表单输入参数行。
 * @returns 可提交的输入参数。
 */
function mapExternalApiInputs(inputs: BuildCreateOntologyExternalFunctionInputRow[]): CreateOntologyFunctionApiInput[] {
  const mapped: CreateOntologyFunctionApiInput[] = [];
  for (const row of inputs) {
    const name = row.name.trim();
    if (!name) {
      continue;
    }
    mapped.push({
      name,
      type: row.type,
      required: row.required === "yes",
      location: EXTERNAL_API_LOCATION_MAP[row.location],
      description: row.description.trim(),
    });
  }
  return mapped;
}

/**
 * @description 将外部 API 输出行转为创建接口 outputs，并跳过名称为空的行。
 * @param outputs 表单输出参数行。
 * @returns 可提交的输出参数。
 */
function mapExternalApiOutputs(outputs: BuildCreateOntologyExternalFunctionOutputRow[]): CreateOntologyFunctionApiOutput[] {
  const mapped: CreateOntologyFunctionApiOutput[] = [];
  for (const row of outputs) {
    const name = row.name.trim();
    if (!name) {
      continue;
    }
    mapped.push({
      name,
      type: row.type,
      description: row.description.trim(),
    });
  }
  return mapped;
}

/**
 * @description 组装 EXTERNAL 外部 API 函数创建请求体；无认证时不提交 apiKey。
 * @param input 通用配置、接口配置与参数行。
 * @returns 创建接口请求参数。
 */
export function buildCreateOntologyExternalFunctionParams(input: BuildCreateOntologyExternalFunctionParamsInput): CreateOntologyFunctionParams {
  const apiConfig: CreateOntologyFunctionApiConfig = {
    endpoint: input.endpoint.trim(),
    method: input.method,
    authType: input.authType,
    contentType: "application/json",
    inputs: mapExternalApiInputs(input.inputs),
    outputs: mapExternalApiOutputs(input.outputs),
  };
  if (input.authType === "apiKey") {
    apiConfig.apiKey = input.apiKey.trim();
  }
  return {
    functionApi: input.functionApi.trim(),
    version: input.version.trim(),
    displayName: input.displayName.trim(),
    description: input.description.trim(),
    type: "EXTERNAL",
    ontologySpaceId: input.ontologySpaceId,
    basedOnOldVersion: Boolean(input.sourceVersion.trim()),
    apiConfig,
  };
}
