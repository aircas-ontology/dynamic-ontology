import type {
  CreateOntologyFunctionApiConfig,
  CreateOntologyFunctionApiField,
  CreateOntologyFunctionApiInput,
  CreateOntologyFunctionApiOutput,
  CreateOntologyFunctionParams,
} from "@/types";

/** 外部 API 表单中的参数位置。 */
type ExternalApiFormLocation = "Body" | "Path" | "Query" | "Header";

/** 外部 API 表单中的参数类型。 */
type ExternalApiFormParameterType = CreateOntologyFunctionApiField["type"];

/** 组装外部 API 函数创建请求的嵌套属性行。 */
export interface BuildCreateOntologyExternalFunctionFieldRow {
  name: string;
  type: ExternalApiFormParameterType;
  description: string;
  fields?: BuildCreateOntologyExternalFunctionFieldRow[];
}

/** 组装外部 API 函数创建请求的输入参数行。 */
export interface BuildCreateOntologyExternalFunctionInputRow extends BuildCreateOntologyExternalFunctionFieldRow {
  location: ExternalApiFormLocation;
  required: "yes" | "no";
}

/** 组装外部 API 函数创建请求的输出参数行。 */
export type BuildCreateOntologyExternalFunctionOutputRow = BuildCreateOntologyExternalFunctionFieldRow;

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
  /** 认证 Header 名；仅 authType 为 apiKey 时写入 apiConfig.apiKeyHeader。 */
  apiKeyHeader: string;
  /** 认证 Header 值；仅 authType 为 apiKey 时写入 apiConfig.apiKey。 */
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
 * @description 递归将表单嵌套属性转为接口 fields；跳过空名，非 object 不带 fields。
 * @param fields 表单嵌套属性行。
 * @returns 可提交的 fields；无有效项时返回 undefined。
 */
function mapExternalApiFields(fields: BuildCreateOntologyExternalFunctionFieldRow[] | undefined): CreateOntologyFunctionApiField[] | undefined {
  if (!Array.isArray(fields) || fields.length === 0) {
    return undefined;
  }
  const mapped: CreateOntologyFunctionApiField[] = [];
  for (const row of fields) {
    const name = row.name.trim();
    if (!name) {
      continue;
    }
    const item: CreateOntologyFunctionApiField = {
      name,
      type: row.type,
      description: row.description.trim(),
    };
    if (row.type === "object") {
      const nested = mapExternalApiFields(row.fields);
      if (nested) {
        item.fields = nested;
      }
    }
    mapped.push(item);
  }
  return mapped.length > 0 ? mapped : undefined;
}

/**
 * @description 将外部 API 输入行转为创建接口 inputs，并跳过名称为空的行；object 递归带 fields。
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
    const item: CreateOntologyFunctionApiInput = {
      name,
      type: row.type,
      required: row.required === "yes",
      location: EXTERNAL_API_LOCATION_MAP[row.location],
      description: row.description.trim(),
    };
    if (row.type === "object") {
      const nested = mapExternalApiFields(row.fields);
      if (nested) {
        item.fields = nested;
      }
    }
    mapped.push(item);
  }
  return mapped;
}

/**
 * @description 将外部 API 输出行转为创建接口 outputs，并跳过名称为空的行；object 递归带 fields。
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
    const item: CreateOntologyFunctionApiOutput = {
      name,
      type: row.type,
      description: row.description.trim(),
    };
    if (row.type === "object") {
      const nested = mapExternalApiFields(row.fields);
      if (nested) {
        item.fields = nested;
      }
    }
    mapped.push(item);
  }
  return mapped;
}

/**
 * @description 组装 EXTERNAL 外部 API 函数创建请求体；无认证时不提交 apiKeyHeader / apiKey。
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
    apiConfig.apiKeyHeader = input.apiKeyHeader.trim();
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
