import type { CreateOntologyActionMappingIn, CreateOntologyActionOperation, CreateOntologyActionParams, SpaceBehaviorDraft } from "@/types";

export type BuildPropertyValueCreateActionParamsResult = CreateOntologyActionParams | { error: string };

/**
 * @description 将基础操作映射为创建行为接口的 operation。
 * @param basicAction 表单基础操作。
 * @returns CREATE / UPDATE / DELETE；不支持时返回空字符串。
 */
function mapBasicActionToOperation(basicAction: SpaceBehaviorDraft["basicAction"]): CreateOntologyActionOperation | "" {
  if (basicAction === "create") return "CREATE";
  if (basicAction === "update") return "UPDATE";
  if (basicAction === "delete") return "DELETE";
  return "";
}

/**
 * @description 判断草稿是否走属性值行为创建接口。
 * @param draft 行为草稿。
 * @returns 基础行为 + 属性值 + 增删改时为 true。
 */
export function isPropertyValueActionCreateDraft(draft: SpaceBehaviorDraft): boolean {
  return (
    draft.kind === "basic" &&
    draft.valueType === "attributeValue" &&
    (draft.basicAction === "create" || draft.basicAction === "update" || draft.basicAction === "delete")
  );
}

/**
 * @description 按属性值创建约定组装 POST /ontology/action 请求体。
 * @param draft 行为草稿。
 * @returns 请求体；校验失败时返回带 error 的对象。
 */
export function buildPropertyValueCreateActionParams(draft: SpaceBehaviorDraft): BuildPropertyValueCreateActionParamsResult {
  const categoryId = Number(draft.categoryId);
  if (!Number.isInteger(categoryId)) {
    return { error: "行为分类无效" };
  }
  const ontologyIdentifier = draft.ontologyIdentifier.trim();
  if (!ontologyIdentifier) {
    return { error: "请选择对象" };
  }
  const actionApi = draft.behaviorApiName.trim();
  if (!actionApi) {
    return { error: "请填写行为api名称" };
  }
  const displayName = draft.displayName.trim();
  if (!displayName) {
    return { error: "请填写行为名称" };
  }
  const storageGroup = draft.storageGroup.trim();
  if (!storageGroup) {
    return { error: "请选择属性" };
  }
  if (!draft.selectedPropertyIds.length) {
    return { error: "请至少选择一项属性" };
  }
  const operation = mapBasicActionToOperation(draft.basicAction);
  if (!operation) {
    return { error: "基础操作无效" };
  }

  const mappingIns: CreateOntologyActionMappingIn[] = draft.selectedPropertyIds.map((propertyId) => {
    if (operation === "DELETE") {
      return {
        propertyUniqueIdentifier: propertyId,
        ontologyUniqueIdentifier: ontologyIdentifier,
      };
    }
    const parameterName = draft.selectedPropertyApiNames[propertyId]?.trim() || "";
    const mapping: CreateOntologyActionMappingIn = {
      propertyUniqueIdentifier: propertyId,
      ontologyUniqueIdentifier: ontologyIdentifier,
      sourceType: "FIXED",
      sourceConfig: draft.selectedPropertyValues[propertyId] ?? "",
    };
    if (parameterName) {
      mapping.parameterName = parameterName;
    }
    return mapping;
  });

  const description = draft.description.trim();
  return {
    actionApi,
    displayName,
    ...(description ? { description } : {}),
    categoryId,
    ontologyIdentifier,
    actionKind: "BASE",
    subjectType: "PROPERTY_VALUE",
    operation,
    storageGroup,
    mappingIns,
  };
}
