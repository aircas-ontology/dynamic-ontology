import type {
  SpaceBehaviorBasicAction,
  SpaceBehaviorDraft,
  SpaceBehaviorItem,
  SpaceBehaviorOperatorOption,
  SpaceBehaviorParameter,
  SpaceBehaviorStatusChangeDraft,
  SpaceBehaviorWorkspaceData,
} from "@/types";
import {
  filterSpaceBehaviorsByCategory,
  recountSpaceBehaviorCategoryCounts,
  resolveSpaceBehaviorStatusFromOperation,
} from "../../views/SpaceBehaviorWorkspace/utils/spaceBehaviorOperations.ts";

const ROOT_SPACE_BEHAVIOR_CATEGORY_ID = "behavior-root";

const workspaceStore = new Map<string, SpaceBehaviorWorkspaceData>();
let nextBehaviorSeq = 1;
let nextCategorySeq = 1;
let nextUpdatedMinute = 40;

/**
 * @description æé è¡ä¸ºåæ°èç¹ã
 * @param parameter åæ°å­æ®µã
 * @returns å®æ´åæ°ã
 */
function createBehaviorParameter(parameter: Omit<SpaceBehaviorParameter, "children"> & { children?: SpaceBehaviorParameter[] }): SpaceBehaviorParameter {
  return { ...parameter, children: parameter.children ?? [] };
}

/**
 * @description çæç¦ç¹çº§èªæ¯å¯¹è±¡çè¾å¥åæ° Mockã
 * @returns è¾å¥åæ°æ ã
 */
function createCarrierInputParameters(): SpaceBehaviorParameter[] {
  return [
    createBehaviorParameter({
      id: "attributes",
      name: "attributes",
      path: "attributes",
      type: "object",
      required: true,
      description: "å¯¹è±¡å±æ§",
      sourceLabel: "å¯¹è±¡å±æ§",
      bindLabel: "å¯¹è±¡ / å±æ§",
      configured: true,
      children: [
        createBehaviorParameter({
          id: "attributes.position",
          name: "position",
          path: "attributes.position",
          type: "object",
          required: false,
          description: "å¯¹è±¡å½åä½ç½®",
          sourceLabel: "å¯¹è±¡å±æ§",
          bindLabel: "é©±éè° DDG-105 / å½åä½ç½® Â· object",
          configured: true,
        }),
        createBehaviorParameter({
          id: "attributes.speed",
          name: "speed",
          path: "attributes.speed",
          type: "number",
          required: false,
          description: "å¯¹è±¡å½åèªé",
          sourceLabel: "å¯¹è±¡å±æ§",
          bindLabel: "å¯¹è±¡å½åèªé",
          configured: true,
        }),
        createBehaviorParameter({
          id: "attributes.visible",
          name: "visible",
          path: "attributes.visible",
          type: "boolean",
          required: false,
          description: "å¯¹è±¡æ¯å¦å¯è§",
          sourceLabel: "å¤é¨è¾å¥",
          bindLabel: "å¤é¨è¾å¥ï¼å¯éï¼",
          configured: false,
        }),
      ],
    }),
  ];
}

/**
 * @description çæç¦ç¹çº§èªæ¯å¯¹è±¡çè¾åºåæ° Mockã
 * @returns è¾åºåæ°åè¡¨ã
 */
function createCarrierOutputParameters(): SpaceBehaviorParameter[] {
  return [
    createBehaviorParameter({
      id: "objectId",
      name: "objectId",
      path: "objectId",
      type: "string",
      required: true,
      description: "å¯¹è±¡å¯ä¸æ è¯",
      sourceLabel: "è¿åå­æ®µ",
      bindLabel: "objectId â é©±éè° DDG-105 / å¯¹è±¡æ è¯",
      configured: true,
    }),
    createBehaviorParameter({
      id: "object.position",
      name: "object.position",
      path: "object.position",
      type: "object",
      required: false,
      description: "å¯¹è±¡å½åä½ç½®",
      sourceLabel: "è¿åå­æ®µ",
      bindLabel: "ä»è¿åç»æ",
      configured: true,
    }),
    createBehaviorParameter({
      id: "object.speed",
      name: "object.speed",
      path: "object.speed",
      type: "number",
      required: false,
      description: "å¯¹è±¡å½åèªé",
      sourceLabel: "è¿åå­æ®µ",
      bindLabel: "ä»è¿åç»æ",
      configured: true,
    }),
  ];
}

const operatorCatalog: SpaceBehaviorOperatorOption[] = [
  {
    id: "operator-create-cvn",
    name: "æ°å¢ç¦ç¹çº§èªç©ºæ¯è°(CVN)åºç¡æä½",
    version: "v1.0.0",
    basicAction: "create",
    objectName: "ç¦ç¹çº§èªç©ºæ¯è°(CVN)",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-update-cvn",
    name: "æ´æ°ç¦ç¹çº§èªç©ºæ¯è°(CVN)åºç¡æä½",
    version: "v1.0.0",
    basicAction: "update",
    objectName: "ç¦ç¹çº§èªç©ºæ¯è°(CVN)",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-delete-cvn",
    name: "å é¤ç¦ç¹çº§èªç©ºæ¯è°(CVN)åºç¡æä½",
    version: "v1.0.0",
    basicAction: "delete",
    objectName: "ç¦ç¹çº§èªç©ºæ¯è°(CVN)",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-query-cvn",
    name: "æ¥è¯¢ç¦ç¹çº§èªç©ºæ¯è°(CVN)åºç¡æä½",
    version: "v1.0.0",
    basicAction: "query",
    objectName: "ç¦ç¹çº§èªç©ºæ¯è°(CVN)",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-create-ddg",
    name: "æ°å¢é¿å©Â·ä¼¯åçº§é©±éè°(DDG)åºç¡æä½",
    version: "v1.0.0",
    basicAction: "create",
    objectName: "é¿å©Â·ä¼¯åçº§é©±éè°(DDG)",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-create-f22",
    name: "æ°å¢F-22æææºåºç¡æä½",
    version: "v1.0.0",
    basicAction: "create",
    objectName: "F-22æææº",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-update-f22",
    name: "æ´æ°F-22æææºåºç¡æä½",
    version: "v1.0.0",
    basicAction: "update",
    objectName: "F-22æææº",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-query-b2",
    name: "æ¥è¯¢B-2è½°ç¸æºåºç¡æä½",
    version: "v1.0.0",
    basicAction: "query",
    objectName: "B-2è½°ç¸æº",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
];

/**
 * @description æå½æ°ç®å­åç§°æ¥æ¾ç®å­éé¡¹ã
 * @param name ç®å­åç§°ã
 * @returns ç®å­éé¡¹ï¼æªæ¾å°æ¶è¿å nullã
 */
function findOperatorByName(name: string): SpaceBehaviorOperatorOption | null {
  return operatorCatalog.find((item) => item.name === name) ?? null;
}

/**
 * @description ç»è£ä¸æ¡ç§å­è¡ä¸ºã
 * @param input è¡ä¸ºå³é®å­æ®µã
 * @returns å®æ´è¡ä¸ºè®°å½ã
 */
function createSeedBehavior(input: {
  id: string;
  categoryId: string;
  displayName: string;
  functionOperatorName: string;
  description: string;
  status: SpaceBehaviorItem["status"];
  updatedAt: string;
  basicAction: SpaceBehaviorBasicAction;
}): SpaceBehaviorItem {
  const operator = findOperatorByName(input.functionOperatorName);
  return {
    id: input.id,
    categoryId: input.categoryId,
    displayName: input.displayName,
    functionOperatorId: operator?.id ?? `operator-${input.id}`,
    functionOperatorName: input.functionOperatorName,
    functionOperatorVersion: operator?.version ?? "v1.0.0",
    description: input.description,
    status: input.status,
    version: "v1.0.0",
    basicAction: input.basicAction,
    objectName: operator?.objectName ?? "",
    behaviorApiName: input.id.replaceAll("-", "_"),
    executionPeriod: "â",
    singleObject: true,
    executionCount: 0,
    successRate: "â",
    publisher: input.status === "published" ? "ç³»ç»ç®¡çå" : "",
    publishedAt: input.status === "published" ? "2025-05-21 09:20" : "",
    changeNote: `åå§å${input.displayName}`,
    statusLogs: [],
    inputParameters: structuredClone(operator?.inputParameters ?? []),
    outputParameters: structuredClone(operator?.outputParameters ?? []),
    updatedAt: input.updatedAt,
  };
}

/**
 * @description çææ¬å°æ¼ç¤ºç¨çç©ºé´è¡ä¸ºç§å­æ°æ®ã
 * @returns æªåå count çå·¥ä½åºå¿«ç§ã
 */
function createSpaceBehaviorSeedData(): SpaceBehaviorWorkspaceData {
  return {
    categoryTree: [
      {
        id: ROOT_SPACE_BEHAVIOR_CATEGORY_ID,
        label: "åºç¡æä½",
        count: 0,
        children: [
          { id: "ship-basic", label: "è°è¹åºç¡", count: 0, children: [] },
          { id: "plane-basic", label: "é£æºåºç¡", count: 0, children: [] },
        ],
      },
    ],
    behaviors: [
      createSeedBehavior({
        id: "behavior-create-cvn",
        categoryId: "ship-basic",
        displayName: "æ°å¢å¯¹è±¡è¡ä¸º",
        functionOperatorName: "æ°å¢ç¦ç¹çº§èªç©ºæ¯è°(CVN)åºç¡æä½",
        description: "æ°å¢ç¦ç¹çº§èªç©ºæ¯è°(CVN)å¯¹è±¡çåºç¡æä½ã",
        status: "published",
        updatedAt: "2026-09-29 09:31",
        basicAction: "create",
      }),
      createSeedBehavior({
        id: "behavior-update-cvn",
        categoryId: "ship-basic",
        displayName: "æ´æ°å¯¹è±¡è¡ä¸º",
        functionOperatorName: "æ´æ°ç¦ç¹çº§èªç©ºæ¯è°(CVN)åºç¡æä½",
        description: "æ´æ°ç¦ç¹çº§èªç©ºæ¯è°(CVN)å¯¹è±¡çåºç¡æä½ã",
        status: "published",
        updatedAt: "2026-09-29 09:31",
        basicAction: "update",
      }),
      createSeedBehavior({
        id: "behavior-delete-cvn",
        categoryId: "ship-basic",
        displayName: "å é¤å¯¹è±¡è¡ä¸º",
        functionOperatorName: "å é¤ç¦ç¹çº§èªç©ºæ¯è°(CVN)åºç¡æä½",
        description: "å é¤ç¦ç¹çº§èªç©ºæ¯è°(CVN)å¯¹è±¡çåºç¡æä½ã",
        status: "published",
        updatedAt: "2026-09-29 09:31",
        basicAction: "delete",
      }),
      createSeedBehavior({
        id: "behavior-query-cvn",
        categoryId: "ship-basic",
        displayName: "æ¥è¯¢å¯¹è±¡è¡ä¸º",
        functionOperatorName: "æ¥è¯¢ç¦ç¹çº§èªç©ºæ¯è°(CVN)åºç¡æä½",
        description: "æ¥è¯¢ç¦ç¹çº§èªç©ºæ¯è°(CVN)å¯¹è±¡çåºç¡æä½ã",
        status: "published",
        updatedAt: "2026-09-29 09:31",
        basicAction: "query",
      }),
      createSeedBehavior({
        id: "behavior-create-ddg",
        categoryId: "ship-basic",
        displayName: "æ°å¢é©±éè°è¡ä¸º",
        functionOperatorName: "æ°å¢é¿å©Â·ä¼¯åçº§é©±éè°(DDG)åºç¡æä½",
        description: "æ°å¢é¿å©Â·ä¼¯åçº§é©±éè°(DDG)å¯¹è±¡çåºç¡æä½ã",
        status: "published",
        updatedAt: "2026-09-28 16:20",
        basicAction: "create",
      }),
      createSeedBehavior({
        id: "behavior-create-f22",
        categoryId: "plane-basic",
        displayName: "æ°å¢æææºè¡ä¸º",
        functionOperatorName: "æ°å¢F-22æææºåºç¡æä½",
        description: "æ°å¢F-22æææºå¯¹è±¡çåºç¡æä½ã",
        status: "published",
        updatedAt: "2026-09-28 15:10",
        basicAction: "create",
      }),
      createSeedBehavior({
        id: "behavior-update-f22",
        categoryId: "plane-basic",
        displayName: "æ´æ°æææºè¡ä¸º",
        functionOperatorName: "æ´æ°F-22æææºåºç¡æä½",
        description: "æ´æ°F-22æææºå¯¹è±¡çåºç¡æä½ã",
        status: "draft",
        updatedAt: "2026-09-27 11:08",
        basicAction: "update",
      }),
      createSeedBehavior({
        id: "behavior-query-b2",
        categoryId: "plane-basic",
        displayName: "æ¥è¯¢è½°ç¸æºè¡ä¸º",
        functionOperatorName: "æ¥è¯¢B-2è½°ç¸æºåºç¡æä½",
        description: "æ¥è¯¢B-2è½°ç¸æºå¯¹è±¡çåºç¡æä½ã",
        status: "published",
        updatedAt: "2026-09-26 18:42",
        basicAction: "query",
      }),
    ],
  };
}

/**
 * @description è¯»åæåå§åæå®ç©ºé´çè¡ä¸ºå·¥ä½åºã
 * @param spaceId ç©ºé´ idã
 * @returns å¯åå·¥ä½åºæ°æ®ã
 */
function getOrCreateSpaceBehaviorWorkspace(spaceId: string): SpaceBehaviorWorkspaceData {
  const cached = workspaceStore.get(spaceId);
  if (cached) return cached;
  const seeded = structuredClone(createSpaceBehaviorSeedData());
  recountSpaceBehaviorCategoryCounts(seeded);
  workspaceStore.set(spaceId, seeded);
  return seeded;
}

/**
 * @description çæå¯éå¤çæ¬å°æ´æ°æ¶é´ï¼é¿åä¾èµç³»ç»æ¶éã
 * @returns `YYYY-MM-DD HH:mm` ææ¬ã
 */
function formatSpaceBehaviorUpdatedAt(): string {
  nextUpdatedMinute += 1;
  return `2026-09-29 09:${String(nextUpdatedMinute).padStart(2, "0")}`;
}

/**
 * @description ååºå¯å³èçåºç¡å½æ°ç®å­ã
 * @returns ç®å­éé¡¹ã
 */
export function listSpaceBehaviorOperatorOptionsMock(): SpaceBehaviorOperatorOption[] {
  return structuredClone(operatorCatalog);
}

/**
 * @description æ¥è¯¢æå®ç©ºé´çè¡ä¸ºå·¥ä½åºå¿«ç§ã
 * @param spaceId ç©ºé´ idã
 * @returns åç±»æ ä¸è¡ä¸ºåè¡¨ã
 */
export function querySpaceBehaviorWorkspaceMock(spaceId: string): SpaceBehaviorWorkspaceData {
  return structuredClone(getOrCreateSpaceBehaviorWorkspace(spaceId));
}

/**
 * @description æèç¨¿åç®å­ç®å½ç»è£ä¸æ¡è¡ä¸ºè®°å½ã
 * @param draft è¡ä¸ºèç¨¿ã
 * @param id è¡ä¸º idã
 * @returns å®æ´è¡ä¸ºã
 */
function buildBehaviorFromDraft(draft: SpaceBehaviorDraft, id: string): SpaceBehaviorItem {
  const operator = operatorCatalog.find((item) => item.id === draft.functionOperatorId) ?? findOperatorByName(draft.functionOperatorName);
  return {
    id,
    categoryId: draft.categoryId,
    displayName: draft.displayName,
    functionOperatorId: operator?.id ?? draft.functionOperatorId,
    functionOperatorName: operator?.name ?? draft.functionOperatorName,
    functionOperatorVersion: operator?.version ?? "v1.0.0",
    description: draft.description,
    status: draft.status,
    version: draft.version?.trim() || "v1.0.0",
    basicAction: draft.basicAction ?? operator?.basicAction ?? "create",
    objectName: operator?.objectName ?? "",
    behaviorApiName: id.replaceAll("-", "_"),
    executionPeriod: "â",
    singleObject: true,
    executionCount: 0,
    successRate: "â",
    publisher: "",
    publishedAt: "",
    changeNote: draft.changeNote?.trim() || draft.description || `åå»º${draft.displayName}`,
    statusLogs: [],
    inputParameters: structuredClone(operator?.inputParameters ?? []),
    outputParameters: structuredClone(operator?.outputParameters ?? []),
    updatedAt: formatSpaceBehaviorUpdatedAt(),
  };
}

/**
 * @description å¨æå®ç©ºé´æ¬å°æ°å¢è¡ä¸ºã
 * @param spaceId ç©ºé´ idã
 * @param draft è¡ä¸ºèç¨¿ã
 * @returns æ°å¢åçè¡ä¸ºã
 */
export function createSpaceBehaviorMock(spaceId: string, draft: SpaceBehaviorDraft): SpaceBehaviorItem {
  const workspace = getOrCreateSpaceBehaviorWorkspace(spaceId);
  const created = buildBehaviorFromDraft(draft, `behavior-created-${nextBehaviorSeq++}`);
  workspace.behaviors.unshift(created);
  recountSpaceBehaviorCategoryCounts(workspace);
  return structuredClone(created);
}

/**
 * @description æ´æ°æå®ç©ºé´åçè¡ä¸ºã
 * @param spaceId ç©ºé´ idã
 * @param behaviorId è¡ä¸º idã
 * @param draft è¡ä¸ºèç¨¿ã
 * @returns æ´æ°åçè¡ä¸ºï¼æªæ¾å°æ¶è¿å nullã
 */
export function updateSpaceBehaviorMock(spaceId: string, behaviorId: string, draft: SpaceBehaviorDraft): SpaceBehaviorItem | null {
  const workspace = getOrCreateSpaceBehaviorWorkspace(spaceId);
  const index = workspace.behaviors.findIndex((item) => item.id === behaviorId);
  if (index < 0) return null;
  const next = buildBehaviorFromDraft(draft, behaviorId);
  next.publisher = workspace.behaviors[index]?.publisher ?? "";
  next.publishedAt = workspace.behaviors[index]?.publishedAt ?? "";
  next.statusLogs = workspace.behaviors[index]?.statusLogs ?? [];
  workspace.behaviors[index] = next;
  recountSpaceBehaviorCategoryCounts(workspace);
  return structuredClone(next);
}

/**
 * @description ä»åæ´æå®è¡ä¸ºçç¶æï¼ä¸æ¹ IDãåæ°åå¼ç¨ã
 * @param spaceId ç©ºé´ idã
 * @param behaviorId è¡ä¸º idã
 * @param draft ç¶æåæ´èç¨¿ã
 * @returns æ´æ°åçè¡ä¸ºï¼æªæ¾å°æ¶è¿å nullã
 */
export function applySpaceBehaviorStatusChangeMock(spaceId: string, behaviorId: string, draft: SpaceBehaviorStatusChangeDraft): SpaceBehaviorItem | null {
  const workspace = getOrCreateSpaceBehaviorWorkspace(spaceId);
  const target = workspace.behaviors.find((item) => item.id === behaviorId);
  if (!target) return null;
  target.status = resolveSpaceBehaviorStatusFromOperation(draft.operation);
  target.updatedAt = formatSpaceBehaviorUpdatedAt();
  target.statusLogs = [...target.statusLogs, `${formatSpaceBehaviorUpdatedAt()} ${draft.operation} ${draft.reason}`.trim()];
  recountSpaceBehaviorCategoryCounts(workspace);
  return structuredClone(target);
}

/**
 * @description å é¤æå®ç©ºé´åçè¡ä¸ºã
 * @param spaceId ç©ºé´ idã
 * @param behaviorId è¡ä¸º idã
 * @returns æ¯å¦å é¤æåã
 */
export function deleteSpaceBehaviorMock(spaceId: string, behaviorId: string): boolean {
  const workspace = getOrCreateSpaceBehaviorWorkspace(spaceId);
  const nextBehaviors = workspace.behaviors.filter((item) => item.id !== behaviorId);
  if (nextBehaviors.length === workspace.behaviors.length) return false;
  workspace.behaviors = nextBehaviors;
  recountSpaceBehaviorCategoryCounts(workspace);
  return true;
}

/**
 * @description å¨æå®åç±»ä¸æ°å¢å­åç±»ã
 * @param spaceId ç©ºé´ idã
 * @param parentId ç¶åç±» idã
 * @param label åç±»åç§°ã
 * @returns æ°å¢åç±»ï¼ç¶åç±»ä¸å­å¨æ¶è¿å nullã
 */
export function createSpaceBehaviorCategoryMock(spaceId: string, parentId: string, label: string): SpaceBehaviorWorkspaceData["categoryTree"][number] | null {
  const workspace = getOrCreateSpaceBehaviorWorkspace(spaceId);
  const parent = findMutableCategory(workspace.categoryTree, parentId);
  if (!parent) return null;
  const created = {
    id: `behavior-category-${nextCategorySeq++}`,
    label,
    count: 0,
    children: [],
  };
  parent.children.push(created);
  recountSpaceBehaviorCategoryCounts(workspace);
  return structuredClone(created);
}

/**
 * @description éå½åæå®è¡ä¸ºåç±»ã
 * @param spaceId ç©ºé´ idã
 * @param categoryId åç±» idã
 * @param label æ°åç§°ã
 * @returns æ¯å¦æ´æ°æåã
 */
export function updateSpaceBehaviorCategoryMock(spaceId: string, categoryId: string, label: string): boolean {
  const workspace = getOrCreateSpaceBehaviorWorkspace(spaceId);
  const target = findMutableCategory(workspace.categoryTree, categoryId);
  if (!target) return false;
  target.label = label;
  return true;
}

/**
 * @description å é¤ç©ºåç±»ï¼æ ¹åç±»ãå«å­åç±»æä»æè¡ä¸ºæ¶æç»ã
 * @param spaceId ç©ºé´ idã
 * @param categoryId åç±» idã
 * @returns å é¤ç»æä¸å¤±è´¥åå ã
 */
export function deleteSpaceBehaviorCategoryMock(
  spaceId: string,
  categoryId: string,
): { ok: boolean; reason: "not-found" | "root" | "has-children" | "has-behaviors" | "" } {
  if (categoryId === ROOT_SPACE_BEHAVIOR_CATEGORY_ID) return { ok: false, reason: "root" };
  const workspace = getOrCreateSpaceBehaviorWorkspace(spaceId);
  const target = findMutableCategory(workspace.categoryTree, categoryId);
  if (!target) return { ok: false, reason: "not-found" };
  if (target.children.length > 0) return { ok: false, reason: "has-children" };
  if (workspace.behaviors.some((item) => item.categoryId === categoryId)) return { ok: false, reason: "has-behaviors" };
  const removed = removeMutableCategory(workspace.categoryTree, categoryId);
  if (!removed) return { ok: false, reason: "not-found" };
  recountSpaceBehaviorCategoryCounts(workspace);
  return { ok: true, reason: "" };
}

/**
 * @description å¨å¯ååç±»æ ä¸­æ¥æ¾èç¹ã
 * @param nodes åç±»æ ã
 * @param categoryId åç±» idã
 * @returns å¹éèç¹ï¼æªæ¾å°æ¶è¿å nullã
 */
function findMutableCategory(nodes: SpaceBehaviorWorkspaceData["categoryTree"], categoryId: string): SpaceBehaviorWorkspaceData["categoryTree"][number] | null {
  for (const node of nodes) {
    if (node.id === categoryId) return node;
    const found = findMutableCategory(node.children, categoryId);
    if (found) return found;
  }
  return null;
}

/**
 * @description ä»å¯ååç±»æ ä¸­ç§»é¤èç¹ã
 * @param nodes åç±»æ ã
 * @param categoryId åç±» idã
 * @returns æ¯å¦ç§»é¤æåã
 */
function removeMutableCategory(nodes: SpaceBehaviorWorkspaceData["categoryTree"], categoryId: string): boolean {
  const index = nodes.findIndex((node) => node.id === categoryId);
  if (index >= 0) {
    nodes.splice(index, 1);
    return true;
  }
  return nodes.some((node) => removeMutableCategory(node.children, categoryId));
}

export { filterSpaceBehaviorsByCategory };
