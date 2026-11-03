import type { CreateOntologyActionLinkMapping, CreateOntologyActionOperation, CreateOntologyActionParams, SpaceBehaviorDraft } from "@/types";

export type BuildLinkCreateActionParamsResult = CreateOntologyActionParams | { error: string };

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
 * @description 判断草稿是否走关系实例行为创建接口。
 * @param draft 行为草稿。
 * @returns 基础行为 + 关系实例 + 增删改时为 true。
 */
export function isLinkActionCreateDraft(draft: SpaceBehaviorDraft): boolean {
  return (
    draft.kind === "basic" &&
    draft.valueType === "relationInstance" &&
    (draft.basicAction === "create" || draft.basicAction === "update" || draft.basicAction === "delete")
  );
}

/**
 * @description 按关系实例创建约定组装 POST /ontology/action 请求体。
 * @param draft 行为草稿。
 * @returns 请求体；校验失败时返回带 error 的对象。
 */
export function buildLinkCreateActionParams(draft: SpaceBehaviorDraft): BuildLinkCreateActionParamsResult {
  const categoryId = Number(draft.categoryId);
  if (!Number.isInteger(categoryId)) {
    return { error: "行为分类无效" };
  }
  const ontologyIdentifier = draft.ontologyIdentifier.trim();
  if (!ontologyIdentifier) {
    return { error: "请选择关系" };
  }
  const actionApi = draft.behaviorApiName.trim();
  if (!actionApi) {
    return { error: "请填写行为api名称" };
  }
  const displayName = draft.displayName.trim();
  if (!displayName) {
    return { error: "请填写行为名称" };
  }
  const ontologyLinkUniqIdentifier = draft.selectedRelationId.trim();
  if (!ontologyLinkUniqIdentifier) {
    return { error: "请选择一条关系" };
  }
  const operation = mapBasicActionToOperation(draft.basicAction);
  if (!operation) {
    return { error: "基础操作无效" };
  }

  let linkMapping: CreateOntologyActionLinkMapping;
  if (operation === "DELETE") {
    linkMapping = { ontologyLinkUniqIdentifier };
  } else {
    const targetStatus = draft.relationTargetStatus;
    if (targetStatus !== "ENABLE" && targetStatus !== "DELETE") {
      return { error: "请选择状态" };
    }
    if (operation === "CREATE") {
      if (!draft.relationVisibilityWindows.length) {
        return { error: "请至少添加一条持续时段" };
      }
      linkMapping = {
        ontologyLinkUniqIdentifier,
        targetStatus,
        visibilityWindows: draft.relationVisibilityWindows.map((item) => ({
          startTime: item.startTime,
          endTime: item.endTime,
        })),
      };
    } else {
      linkMapping = { ontologyLinkUniqIdentifier, targetStatus };
      if (draft.relationVisibilityWindows.length) {
        linkMapping.visibilityWindows = draft.relationVisibilityWindows.map((item) => ({
          startTime: item.startTime,
          endTime: item.endTime,
        }));
      }
    }
  }

  const description = draft.description.trim();
  return {
    actionApi,
    displayName,
    ...(description ? { description } : {}),
    categoryId,
    ontologyIdentifier,
    actionKind: "BASE",
    subjectType: "LINK",
    operation,
    linkMapping,
  };
}
