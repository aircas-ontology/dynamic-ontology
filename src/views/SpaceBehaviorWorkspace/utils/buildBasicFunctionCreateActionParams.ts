import type {
  CreateOntologyActionBasicFunction,
  CreateOntologyActionBasicFunctionWriteBack,
  CreateOntologyActionBasicFunctionWriteBackBinding,
  CreateOntologyActionParams,
  FunctionOperatorAggFunc,
  SpaceBehaviorBasicFunctionWriteFieldBinding,
  SpaceBehaviorDraft,
} from "@/types";
import {
  createBlankBasicFilterDocument,
  mapBasicFilterDocumentToActionFilters,
  parseBasicFilterConfig,
  validateBasicFilterDocument,
} from "../../../utils/functionOperatorBasicFilter.ts";
import { isMainStorageGroup, normalizeStorageGroup } from "../../../utils/behaviorParameters/resolveAttributeValueSelection.ts";

export type BuildBasicFunctionCreateActionParamsResult = CreateOntologyActionParams | { error: string };

const AGG_FUNC_SET = new Set<string>(["SUM", "COUNT", "AVG", "MAX", "MIN", "DISTINCT"]);

/**
 * @description 判断草稿是否走基础函数行为创建/编辑接口。
 * @param draft 行为草稿。
 * @returns 基础行为 + 基础函数时为 true。
 */
export function isBasicFunctionActionCreateDraft(draft: SpaceBehaviorDraft): boolean {
  return draft.kind === "basic" && draft.valueType === "basicFunctionOperator";
}

/**
 * @description 兼容旧导出名：基础函数草稿判定。
 * @param draft 行为草稿。
 * @returns 是否基础函数草稿。
 */
export function isBasicOperatorActionCreateDraft(draft: SpaceBehaviorDraft): boolean {
  return isBasicFunctionActionCreateDraft(draft);
}

/**
 * @description 将未知值收成可 trim 的字符串。
 * @param value 原始值。
 * @returns 去掉首尾空白后的字符串；空值返回空串。
 */
function readTrimmedText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  return "";
}

/**
 * @description 收窄聚合类型枚举；未选或非法时返回空（单对象可走 QUERY）。
 * @param value 原始聚合类型。
 * @returns 合法聚合类型或空。
 */
function resolveAggFunc(value: unknown): FunctionOperatorAggFunc | "" {
  const trimmed = readTrimmedText(value);
  return AGG_FUNC_SET.has(trimmed) ? (trimmed as FunctionOperatorAggFunc) : "";
}

/**
 * @description 读取写入字段绑定；缺失字段按空串处理。
 * @param binding 原始绑定。
 * @returns 规范化绑定。
 */
function normalizeWriteFieldBinding(binding: SpaceBehaviorBasicFunctionWriteFieldBinding | undefined): SpaceBehaviorBasicFunctionWriteFieldBinding {
  return {
    ontologyUniqueIdentifier: readTrimmedText(binding?.ontologyUniqueIdentifier),
    propertyUniqueIdentifier: readTrimmedText(binding?.propertyUniqueIdentifier),
    storageGroup: normalizeStorageGroup(binding?.storageGroup),
  };
}

/**
 * @description 由查询模式写入字段组装 writeBack。
 * @param selectFields 展示字段 apiName 列表。
 * @param writeFields 展示字段 → 写入绑定。
 * @returns writeBack 或错误；无完整绑定或全空时返回 null。
 */
function buildQueryWriteBack(
  selectFields: string[],
  writeFields: Record<string, SpaceBehaviorBasicFunctionWriteFieldBinding>,
): CreateOntologyActionBasicFunctionWriteBack | null | { error: string } {
  const bindings: CreateOntologyActionBasicFunctionWriteBackBinding[] = [];
  const ontologyIds = new Set<string>();
  const storageGroups = new Set<string>();
  let filledCount = 0;

  for (const selectField of selectFields) {
    const binding = normalizeWriteFieldBinding(writeFields[selectField]);
    const hasOntology = Boolean(binding.ontologyUniqueIdentifier);
    const hasProperty = Boolean(binding.propertyUniqueIdentifier);
    if (!hasOntology || !hasProperty) continue;
    filledCount += 1;
    ontologyIds.add(binding.ontologyUniqueIdentifier);
    storageGroups.add(binding.storageGroup || "");
    bindings.push({
      sourceField: selectField,
      targetPropertyIdentifier: binding.propertyUniqueIdentifier,
    });
  }

  if (filledCount === 0) return null;
  if (ontologyIds.size !== 1) return { error: "写入字段须选择同一目标对象" };
  if (storageGroups.size !== 1) return { error: "写入字段须属于同一存储分组" };

  const targetOntologyIdentifier = [...ontologyIds][0] ?? "";
  const targetStorageGroup = [...storageGroups][0] ?? "";
  const writeBack: CreateOntologyActionBasicFunctionWriteBack = {
    targetOntologyIdentifier,
    bindings,
  };
  if (targetStorageGroup && !isMainStorageGroup(targetStorageGroup)) {
    writeBack.targetStorageGroup = targetStorageGroup;
  }
  return writeBack;
}

/**
 * @description 由多对象聚合写入字段组装 writeBack。
 * @param multiWriteField 单行写入绑定。
 * @returns writeBack 或错误；空/半填时返回 null。
 */
function buildAggregateWriteBack(
  multiWriteField: SpaceBehaviorBasicFunctionWriteFieldBinding | undefined,
): CreateOntologyActionBasicFunctionWriteBack | null | { error: string } {
  const binding = normalizeWriteFieldBinding(multiWriteField);
  const hasOntology = Boolean(binding.ontologyUniqueIdentifier);
  const hasProperty = Boolean(binding.propertyUniqueIdentifier);
  if (!hasOntology || !hasProperty) return null;
  return {
    targetOntologyIdentifier: binding.ontologyUniqueIdentifier,
    bindings: [{ targetPropertyIdentifier: binding.propertyUniqueIdentifier }],
  };
}

/**
 * @description 按基础函数创建约定组装 POST/PUT /ontology/action 请求体。
 * @param draft 行为草稿。
 * @returns 请求体；校验失败时返回带 error 的对象。
 */
export function buildBasicFunctionCreateActionParams(draft: SpaceBehaviorDraft): BuildBasicFunctionCreateActionParamsResult {
  const categoryId = Number(draft.categoryId);
  if (!Number.isInteger(categoryId)) {
    return { error: "行为分类无效" };
  }
  const actionApi = readTrimmedText(draft.behaviorApiName);
  if (!actionApi) {
    return { error: "请填写行为api名称" };
  }
  const displayName = readTrimmedText(draft.displayName);
  if (!displayName) {
    return { error: "请填写行为名称" };
  }
  const ontologyIdentifiers = (Array.isArray(draft.ontologyIdentifiers) ? draft.ontologyIdentifiers : []).map((item) => readTrimmedText(item)).filter(Boolean);
  if (!ontologyIdentifiers.length) {
    return { error: "请选择对象" };
  }

  const aggFunc = resolveAggFunc(draft.basicFunctionAggFunc);
  const targetField = readTrimmedText(draft.basicFunctionTargetField);
  const selectFields = (Array.isArray(draft.basicFunctionSelectFields) ? draft.basicFunctionSelectFields : [])
    .map((item) => readTrimmedText(item))
    .filter(Boolean);
  const filterConfigText = readTrimmedText(draft.basicFunctionParameterConfig);
  const filterDoc = filterConfigText ? parseBasicFilterConfig(filterConfigText) : createBlankBasicFilterDocument();
  const filterError = validateBasicFilterDocument(filterDoc);
  if (filterError) {
    return { error: filterError };
  }

  if (ontologyIdentifiers.length > 1 && !aggFunc) {
    return { error: "多对象时请选择聚合类型" };
  }

  let basicFunction: CreateOntologyActionBasicFunction;
  let writeBackResult: CreateOntologyActionBasicFunctionWriteBack | null | { error: string };
  if (aggFunc) {
    if (!targetField) {
      return { error: "请选择聚合参数名" };
    }
    basicFunction = {
      ontologyIdentifiers,
      mode: "AGGREGATE",
      aggFunc,
      targetField,
    };
    writeBackResult = buildAggregateWriteBack(draft.basicFunctionMultiWriteField);
  } else {
    if (!selectFields.length) {
      return { error: "请选择展示字段" };
    }
    basicFunction = {
      ontologyIdentifiers,
      mode: "QUERY",
      selectFields,
    };
    writeBackResult = buildQueryWriteBack(selectFields, draft.basicFunctionWriteFields ?? {});
  }

  if (writeBackResult && "error" in writeBackResult) {
    return { error: writeBackResult.error };
  }
  if (writeBackResult) {
    basicFunction = { ...basicFunction, writeBack: writeBackResult };
  }

  const filters = mapBasicFilterDocumentToActionFilters(filterDoc);
  if (filters) {
    basicFunction = { ...basicFunction, filters };
  }

  const description = readTrimmedText(draft.description);
  return {
    actionApi,
    displayName,
    ...(description ? { description } : {}),
    categoryId,
    actionKind: "BASE",
    subjectType: "BASIC_FUNCTION",
    basicFunction,
  };
}

/**
 * @description 兼容旧导出名：基础函数创建参数装配。
 * @param draft 行为草稿。
 * @returns 请求体或错误。
 */
export function buildBasicOperatorCreateActionParams(draft: SpaceBehaviorDraft): BuildBasicFunctionCreateActionParamsResult {
  return buildBasicFunctionCreateActionParams(draft);
}
