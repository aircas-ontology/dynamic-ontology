import type {
  ApiDocsEndpointDetail,
  ApiDocsEndpointGroup,
  ApiDocsEndpointItem,
  ApiDocsHttpMethod,
  ApiDocsParameterRow,
  ApiDocsResponseRow,
  ApiDocsSchemaFieldRow,
  ApiDocsServiceInfo,
  OntologyApiDocsData,
} from "@/types";

const HTTP_METHODS: ApiDocsHttpMethod[] = ["get", "post", "put", "delete", "patch", "head", "options", "trace"];

const UNTAGGED_GROUP = "未分组";

/**
 * @description 判断字符串是否为可展示的 HTTP 方法。
 * @param value 待判断字符串。
 * @returns 是否为支持的方法名。
 */
function isApiDocsHttpMethod(value: string): value is ApiDocsHttpMethod {
  return (HTTP_METHODS as string[]).includes(value);
}

/**
 * @description 读取未知对象上的字符串字段，缺省时返回空串。
 * @param source 源对象。
 * @param key 字段名。
 * @returns 字符串值。
 */
function readStringField(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

/**
 * @description 从 schema 对象提取可读类型标签（含 $ref 末段与 enum）。
 * @param schema OpenAPI schema 或 unknown。
 * @returns 类型展示文案。
 */
function resolveSchemaTypeLabel(schema: unknown): string {
  if (schema === null || typeof schema !== "object") {
    return "-";
  }
  const record = schema as Record<string, unknown>;
  const ref = record.$ref;
  if (typeof ref === "string" && ref.length > 0) {
    const segments = ref.split("/");
    return segments[segments.length - 1] || ref;
  }
  const type = record.type;
  if (typeof type === "string" && type.length > 0) {
    const format = record.format;
    if (typeof format === "string" && format.length > 0) {
      return `${type}(${format})`;
    }
    if (type === "array") {
      const itemLabel = resolveSchemaTypeLabel(record.items);
      return itemLabel === "-" ? "array" : `array<${itemLabel}>`;
    }
    if (Array.isArray(record.enum) && record.enum.length > 0) {
      return `${type}(enum)`;
    }
    return type;
  }
  if (Array.isArray(record.enum) && record.enum.length > 0) {
    return "enum";
  }
  return "-";
}

/**
 * @description 解析 `#/components/schemas/...` 引用或直接返回对象 schema。
 * @param document OpenAPI 文档。
 * @param schema 原始 schema（可为 $ref）。
 * @returns 解析后的 schema 对象；无法解析时返回 null。
 */
function resolveSchemaObject(document: OntologyApiDocsData, schema: unknown): Record<string, unknown> | null {
  if (schema === null || typeof schema !== "object") {
    return null;
  }
  const record = schema as Record<string, unknown>;
  const ref = record.$ref;
  if (typeof ref === "string" && ref.startsWith("#/components/schemas/")) {
    const schemaName = ref.slice("#/components/schemas/".length);
    const schemas = document.components?.schemas;
    if (!schemas || typeof schemas !== "object") {
      return null;
    }
    const target = schemas[schemaName];
    if (target === null || typeof target !== "object") {
      return null;
    }
    return target as Record<string, unknown>;
  }
  return record;
}

/**
 * @description 将 object schema 的 properties 映射为 body 参数行；array 则展开 items。
 * @param document OpenAPI 文档。
 * @param schema 请求体 schema。
 * @returns body 参数展示行。
 */
function mapRequestBodySchemaParameters(document: OntologyApiDocsData, schema: unknown): ApiDocsParameterRow[] {
  let resolved = resolveSchemaObject(document, schema);
  if (!resolved) {
    return [];
  }
  if (resolved.type === "array") {
    resolved = resolveSchemaObject(document, resolved.items) ?? resolved;
  }
  const properties = resolved.properties;
  if (properties === null || typeof properties !== "object") {
    return [];
  }
  const requiredNames = new Set(Array.isArray(resolved.required) ? resolved.required.filter((item): item is string => typeof item === "string") : []);
  const rows: ApiDocsParameterRow[] = [];
  for (const [name, propertySchema] of Object.entries(properties as Record<string, unknown>)) {
    let description = "";
    if (propertySchema !== null && typeof propertySchema === "object") {
      description = readStringField(propertySchema as Record<string, unknown>, "description");
      const enumValues = (propertySchema as Record<string, unknown>).enum;
      if (Array.isArray(enumValues) && enumValues.length > 0) {
        const enumText = enumValues.map((item) => String(item)).join(" | ");
        description = description ? `${description}（${enumText}）` : enumText;
      }
    }
    rows.push({
      name,
      location: "body",
      typeLabel: resolveSchemaTypeLabel(propertySchema),
      required: requiredNames.has(name),
      description,
    });
  }
  return rows;
}

/**
 * @description 从 requestBody 提取必填、内容类型、schema 标签与原始 schema。
 * @param requestBody OpenAPI requestBody。
 * @returns 请求体摘要。
 */
function mapRequestBody(requestBody: unknown): {
  required: boolean;
  contentTypes: string[];
  schemaLabel: string;
  schema: unknown;
} {
  if (requestBody === null || typeof requestBody !== "object") {
    return { required: false, contentTypes: [], schemaLabel: "", schema: undefined };
  }
  const record = requestBody as Record<string, unknown>;
  const content = record.content;
  if (content === null || typeof content !== "object") {
    return { required: record.required === true, contentTypes: [], schemaLabel: "", schema: undefined };
  }
  const contentRecord = content as Record<string, unknown>;
  const contentTypes = Object.keys(contentRecord);
  const firstContent = contentTypes[0] ? contentRecord[contentTypes[0]] : undefined;
  const schema = firstContent !== null && typeof firstContent === "object" ? (firstContent as Record<string, unknown>).schema : undefined;
  return {
    required: record.required === true,
    contentTypes,
    schemaLabel: resolveSchemaTypeLabel(schema),
    schema,
  };
}

/**
 * @description 将 OpenAPI parameter 列表映射为表格行。
 * @param parameters 原始 parameters。
 * @returns 参数展示行。
 */
function mapParameters(parameters: unknown): ApiDocsParameterRow[] {
  if (!Array.isArray(parameters)) {
    return [];
  }
  const rows: ApiDocsParameterRow[] = [];
  for (const item of parameters) {
    if (item === null || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const name = readStringField(record, "name");
    if (!name) {
      continue;
    }
    rows.push({
      name,
      location: readStringField(record, "in") || "-",
      typeLabel: resolveSchemaTypeLabel(record.schema),
      required: record.required === true,
      description: readStringField(record, "description"),
    });
  }
  return rows;
}

/**
 * @description 读取 schema 属性说明，枚举值追加到说明末尾。
 * @param propertySchema 属性 schema。
 * @returns 说明文案。
 */
function readPropertyDescription(propertySchema: unknown): string {
  if (propertySchema === null || typeof propertySchema !== "object") {
    return "";
  }
  const record = propertySchema as Record<string, unknown>;
  let description = readStringField(record, "description");
  const enumValues = record.enum;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    const enumText = enumValues.map((item) => String(item)).join(" | ");
    description = description ? `${description}（${enumText}）` : enumText;
  }
  return description;
}

/**
 * @description 将 schema 展开为树形字段行；对象属性挂 children，数组元素挂在数组字段下，深度上限 3。
 * @param document OpenAPI 文档。
 * @param schema 待展开 schema。
 * @param pathPrefix 完整路径前缀。
 * @param depth 当前展开深度。
 * @returns Schema 字段树。
 */
function mapSchemaFields(document: OntologyApiDocsData, schema: unknown, pathPrefix = "", depth = 0): ApiDocsSchemaFieldRow[] {
  if (depth > 3) {
    return [];
  }
  const resolved = resolveSchemaObject(document, schema);
  if (!resolved) {
    return [];
  }
  if (resolved.type === "array") {
    const itemPrefix = pathPrefix ? `${pathPrefix}[]` : "[]";
    const itemResolved = resolveSchemaObject(document, resolved.items);
    if (itemResolved && (itemResolved.properties || itemResolved.type === "object" || itemResolved.type === "array")) {
      return mapSchemaFields(document, resolved.items, itemPrefix, depth);
    }
    return [
      {
        id: itemPrefix || "items",
        name: pathPrefix || "items",
        path: itemPrefix || "items",
        typeLabel: resolveSchemaTypeLabel(resolved),
        required: false,
        description: readPropertyDescription(resolved),
      },
    ];
  }
  const properties = resolved.properties;
  if (properties === null || typeof properties !== "object") {
    return [];
  }
  const requiredNames = new Set(Array.isArray(resolved.required) ? resolved.required.filter((item): item is string => typeof item === "string") : []);
  const rows: ApiDocsSchemaFieldRow[] = [];
  for (const [name, propertySchema] of Object.entries(properties as Record<string, unknown>)) {
    const path = pathPrefix ? `${pathPrefix}.${name}` : name;
    const row: ApiDocsSchemaFieldRow = {
      id: path,
      name,
      path,
      typeLabel: resolveSchemaTypeLabel(propertySchema),
      required: requiredNames.has(name),
      description: readPropertyDescription(propertySchema),
    };
    const nested = resolveSchemaObject(document, propertySchema);
    if (nested?.type === "array") {
      const itemChildren = mapSchemaFields(document, nested.items, `${path}[]`, depth + 1);
      if (itemChildren.length > 0) {
        row.children = itemChildren;
      }
    } else if (nested?.properties) {
      const objectChildren = mapSchemaFields(document, propertySchema, path, depth + 1);
      if (objectChildren.length > 0) {
        row.children = objectChildren;
      }
    }
    rows.push(row);
  }
  return rows;
}

/**
 * @description 将 responses 对象映射为摘要行，并解析 Content Schema 字段。
 * @param document OpenAPI 文档。
 * @param responses OpenAPI responses。
 * @returns 响应展示行。
 */
function mapResponses(document: OntologyApiDocsData, responses: unknown): ApiDocsResponseRow[] {
  if (responses === null || typeof responses !== "object") {
    return [];
  }
  return Object.entries(responses as Record<string, unknown>).map(([status, value]) => {
    if (value === null || typeof value !== "object") {
      return { status, description: "", contentTypes: [], schemaLabel: "", schemaFields: [] };
    }
    const record = value as Record<string, unknown>;
    const content = record.content;
    const contentTypes = content !== null && typeof content === "object" ? Object.keys(content as Record<string, unknown>) : [];
    const firstContentType = contentTypes[0];
    const firstContent =
      firstContentType && content !== null && typeof content === "object" ? (content as Record<string, unknown>)[firstContentType] : undefined;
    const schema = firstContent !== null && typeof firstContent === "object" ? (firstContent as Record<string, unknown>).schema : undefined;
    return {
      status,
      description: readStringField(record, "description"),
      contentTypes,
      schemaLabel: resolveSchemaTypeLabel(schema),
      schemaFields: mapSchemaFields(document, schema),
    };
  });
}

/**
 * @description 从 OpenAPI 文档提取服务信息（标题、版本、首个 server）。
 * @param document OpenAPI 文档。
 * @returns 服务信息视图模型。
 */
export function mapApiDocsServiceInfo(document: OntologyApiDocsData): ApiDocsServiceInfo {
  const firstServer = document.servers?.[0];
  return {
    title: document.info.title,
    description: document.info.description ?? "",
    version: document.info.version,
    openapi: document.openapi,
    serverUrl: firstServer?.url ?? "",
    serverDescription: firstServer?.description ?? "",
  };
}

/**
 * @description 遍历 paths，生成按 tag 分组的接口列表（无顶层 tags 时用 operation.tags）。
 * @param document OpenAPI 文档。
 * @returns 分组后的接口列表。
 */
export function mapApiDocsEndpointGroups(document: OntologyApiDocsData): ApiDocsEndpointGroup[] {
  const groupMap = new Map<string, ApiDocsEndpointItem[]>();

  for (const [path, pathItem] of Object.entries(document.paths)) {
    if (pathItem === null || typeof pathItem !== "object") {
      continue;
    }
    for (const [methodKey, operationValue] of Object.entries(pathItem)) {
      if (!isApiDocsHttpMethod(methodKey)) {
        continue;
      }
      if (operationValue === null || typeof operationValue !== "object") {
        continue;
      }
      const operation = operationValue as Record<string, unknown>;
      const rawTags = Array.isArray(operation.tags) ? operation.tags.filter((tag): tag is string => typeof tag === "string" && tag.length > 0) : [];
      const tags = rawTags.length > 0 ? rawTags : [UNTAGGED_GROUP];
      const item: ApiDocsEndpointItem = {
        id: `${methodKey}:${path}`,
        method: methodKey,
        path,
        summary: readStringField(operation, "summary"),
        operationId: readStringField(operation, "operationId"),
        tags,
        deprecated: operation.deprecated === true,
      };
      const primaryTag = tags[0] ?? UNTAGGED_GROUP;
      const bucket = groupMap.get(primaryTag) ?? [];
      bucket.push(item);
      groupMap.set(primaryTag, bucket);
    }
  }

  const preferredOrder = (document.tags ?? []).map((tag) => tag.name).filter((name): name is string => typeof name === "string" && name.length > 0);

  const orderedNames = [
    ...preferredOrder.filter((name) => groupMap.has(name)),
    ...[...groupMap.keys()].filter((name) => !preferredOrder.includes(name)).sort((a, b) => a.localeCompare(b, "zh-CN")),
  ];

  return orderedNames.map((tag) => ({
    tag,
    endpoints: groupMap.get(tag) ?? [],
  }));
}

/**
 * @description 按 method+path 解析接口详情（参数、请求体、响应）。
 * @param document OpenAPI 文档。
 * @param method HTTP 方法。
 * @param path 接口路径。
 * @returns 详情视图模型；找不到时返回 null。
 */
export function mapApiDocsEndpointDetail(document: OntologyApiDocsData, method: ApiDocsHttpMethod, path: string): ApiDocsEndpointDetail | null {
  const pathItem = document.paths[path];
  if (pathItem === null || typeof pathItem !== "object") {
    return null;
  }
  const operationValue = pathItem[method];
  if (operationValue === null || typeof operationValue !== "object") {
    return null;
  }
  const operation = operationValue as Record<string, unknown>;
  const pathParameters = mapParameters(pathItem.parameters);
  const operationParameters = mapParameters(operation.parameters);
  const requestBody = mapRequestBody(operation.requestBody);
  const bodyParameters = mapRequestBodySchemaParameters(document, requestBody.schema);
  const rawTags = Array.isArray(operation.tags) ? operation.tags.filter((tag): tag is string => typeof tag === "string" && tag.length > 0) : [];

  return {
    id: `${method}:${path}`,
    method,
    path,
    summary: readStringField(operation, "summary"),
    description: readStringField(operation, "description"),
    operationId: readStringField(operation, "operationId"),
    tags: rawTags,
    deprecated: operation.deprecated === true,
    parameters: [...pathParameters, ...operationParameters, ...bodyParameters],
    requestBodyRequired: requestBody.required,
    requestBodyContentTypes: requestBody.contentTypes,
    requestBodySchemaLabel: requestBody.schemaLabel,
    responses: mapResponses(document, operation.responses),
  };
}
