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
 * @description 构造行为参数节点。
 * @param parameter 参数字段。
 * @returns 完整参数。
 */
function createBehaviorParameter(parameter: Omit<SpaceBehaviorParameter, "children"> & { children?: SpaceBehaviorParameter[] }): SpaceBehaviorParameter {
  return { ...parameter, children: parameter.children ?? [] };
}

/**
 * @description 生成福特级航母对象的输入参数 Mock。
 * @returns 输入参数树。
 */
function createCarrierInputParameters(): SpaceBehaviorParameter[] {
  return [
    createBehaviorParameter({
      id: "attributes",
      name: "attributes",
      path: "attributes",
      type: "object",
      required: true,
      description: "对象属性",
      sourceLabel: "对象属性",
      bindLabel: "对象 / 属性",
      configured: true,
      children: [
        createBehaviorParameter({
          id: "attributes.position",
          name: "position",
          path: "attributes.position",
          type: "object",
          required: false,
          description: "对象当前位置",
          sourceLabel: "对象属性",
          bindLabel: "驱逐舰 DDG-105 / 当前位置 · object",
          configured: true,
        }),
        createBehaviorParameter({
          id: "attributes.speed",
          name: "speed",
          path: "attributes.speed",
          type: "number",
          required: false,
          description: "对象当前航速",
          sourceLabel: "对象属性",
          bindLabel: "对象当前航速",
          configured: true,
        }),
        createBehaviorParameter({
          id: "attributes.visible",
          name: "visible",
          path: "attributes.visible",
          type: "boolean",
          required: false,
          description: "对象是否可见",
          sourceLabel: "外部输入",
          bindLabel: "外部输入（可选）",
          configured: false,
        }),
      ],
    }),
  ];
}

/**
 * @description 生成福特级航母对象的输出参数 Mock。
 * @returns 输出参数列表。
 */
function createCarrierOutputParameters(): SpaceBehaviorParameter[] {
  return [
    createBehaviorParameter({
      id: "objectId",
      name: "objectId",
      path: "objectId",
      type: "string",
      required: true,
      description: "对象唯一标识",
      sourceLabel: "返回字段",
      bindLabel: "objectId → 驱逐舰 DDG-105 / 对象标识",
      configured: true,
    }),
    createBehaviorParameter({
      id: "object.position",
      name: "object.position",
      path: "object.position",
      type: "object",
      required: false,
      description: "对象当前位置",
      sourceLabel: "返回字段",
      bindLabel: "仅返回结果",
      configured: true,
    }),
    createBehaviorParameter({
      id: "object.speed",
      name: "object.speed",
      path: "object.speed",
      type: "number",
      required: false,
      description: "对象当前航速",
      sourceLabel: "返回字段",
      bindLabel: "仅返回结果",
      configured: true,
    }),
  ];
}

const operatorCatalog: SpaceBehaviorOperatorOption[] = [
  {
    id: "operator-create-cvn",
    name: "新增福特级航空母舰(CVN)基础操作",
    version: "v1.0.0",
    basicAction: "create",
    objectName: "福特级航空母舰(CVN)",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-update-cvn",
    name: "更新福特级航空母舰(CVN)基础操作",
    version: "v1.0.0",
    basicAction: "update",
    objectName: "福特级航空母舰(CVN)",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-delete-cvn",
    name: "删除福特级航空母舰(CVN)基础操作",
    version: "v1.0.0",
    basicAction: "delete",
    objectName: "福特级航空母舰(CVN)",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-query-cvn",
    name: "查询福特级航空母舰(CVN)基础操作",
    version: "v1.0.0",
    basicAction: "query",
    objectName: "福特级航空母舰(CVN)",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-create-ddg",
    name: "新增阿利·伯克级驱逐舰(DDG)基础操作",
    version: "v1.0.0",
    basicAction: "create",
    objectName: "阿利·伯克级驱逐舰(DDG)",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-create-f22",
    name: "新增F-22战斗机基础操作",
    version: "v1.0.0",
    basicAction: "create",
    objectName: "F-22战斗机",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-update-f22",
    name: "更新F-22战斗机基础操作",
    version: "v1.0.0",
    basicAction: "update",
    objectName: "F-22战斗机",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
  {
    id: "operator-query-b2",
    name: "查询B-2轰炸机基础操作",
    version: "v1.0.0",
    basicAction: "query",
    objectName: "B-2轰炸机",
    inputParameters: createCarrierInputParameters(),
    outputParameters: createCarrierOutputParameters(),
  },
];

/**
 * @description 按函数算子名称查找算子选项。
 * @param name 算子名称。
 * @returns 算子选项；未找到时返回 null。
 */
function findOperatorByName(name: string): SpaceBehaviorOperatorOption | null {
  return operatorCatalog.find((item) => item.name === name) ?? null;
}

/**
 * @description 组装一条种子行为。
 * @param input 行为关键字段。
 * @returns 完整行为记录。
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
    executionPeriod: "—",
    singleObject: true,
    executionCount: 0,
    successRate: "—",
    publisher: input.status === "published" ? "系统管理员" : "",
    publishedAt: input.status === "published" ? "2025-05-21 09:20" : "",
    changeNote: `初始化${input.displayName}`,
    statusLogs: [],
    inputParameters: structuredClone(operator?.inputParameters ?? []),
    outputParameters: structuredClone(operator?.outputParameters ?? []),
    updatedAt: input.updatedAt,
  };
}

/**
 * @description 生成本地演示用的空间行为种子数据。
 * @returns 未回写 count 的工作区快照。
 */
function createSpaceBehaviorSeedData(): SpaceBehaviorWorkspaceData {
  return {
    categoryTree: [
      {
        id: ROOT_SPACE_BEHAVIOR_CATEGORY_ID,
        label: "基础操作",
        count: 0,
        children: [
          { id: "ship-basic", label: "舰船基础", count: 0, children: [] },
          { id: "plane-basic", label: "飞机基础", count: 0, children: [] },
        ],
      },
    ],
    behaviors: [
      createSeedBehavior({
        id: "behavior-create-cvn",
        categoryId: "ship-basic",
        displayName: "新增对象行为",
        functionOperatorName: "新增福特级航空母舰(CVN)基础操作",
        description: "新增福特级航空母舰(CVN)对象的基础操作。",
        status: "published",
        updatedAt: "2026-09-29 09:31",
        basicAction: "create",
      }),
      createSeedBehavior({
        id: "behavior-update-cvn",
        categoryId: "ship-basic",
        displayName: "更新对象行为",
        functionOperatorName: "更新福特级航空母舰(CVN)基础操作",
        description: "更新福特级航空母舰(CVN)对象的基础操作。",
        status: "published",
        updatedAt: "2026-09-29 09:31",
        basicAction: "update",
      }),
      createSeedBehavior({
        id: "behavior-delete-cvn",
        categoryId: "ship-basic",
        displayName: "删除对象行为",
        functionOperatorName: "删除福特级航空母舰(CVN)基础操作",
        description: "删除福特级航空母舰(CVN)对象的基础操作。",
        status: "published",
        updatedAt: "2026-09-29 09:31",
        basicAction: "delete",
      }),
      createSeedBehavior({
        id: "behavior-query-cvn",
        categoryId: "ship-basic",
        displayName: "查询对象行为",
        functionOperatorName: "查询福特级航空母舰(CVN)基础操作",
        description: "查询福特级航空母舰(CVN)对象的基础操作。",
        status: "published",
        updatedAt: "2026-09-29 09:31",
        basicAction: "query",
      }),
      createSeedBehavior({
        id: "behavior-create-ddg",
        categoryId: "ship-basic",
        displayName: "新增驱逐舰行为",
        functionOperatorName: "新增阿利·伯克级驱逐舰(DDG)基础操作",
        description: "新增阿利·伯克级驱逐舰(DDG)对象的基础操作。",
        status: "published",
        updatedAt: "2026-09-28 16:20",
        basicAction: "create",
      }),
      createSeedBehavior({
        id: "behavior-create-f22",
        categoryId: "plane-basic",
        displayName: "新增战斗机行为",
        functionOperatorName: "新增F-22战斗机基础操作",
        description: "新增F-22战斗机对象的基础操作。",
        status: "published",
        updatedAt: "2026-09-28 15:10",
        basicAction: "create",
      }),
      createSeedBehavior({
        id: "behavior-update-f22",
        categoryId: "plane-basic",
        displayName: "更新战斗机行为",
        functionOperatorName: "更新F-22战斗机基础操作",
        description: "更新F-22战斗机对象的基础操作。",
        status: "draft",
        updatedAt: "2026-09-27 11:08",
        basicAction: "update",
      }),
      createSeedBehavior({
        id: "behavior-query-b2",
        categoryId: "plane-basic",
        displayName: "查询轰炸机行为",
        functionOperatorName: "查询B-2轰炸机基础操作",
        description: "查询B-2轰炸机对象的基础操作。",
        status: "published",
        updatedAt: "2026-09-26 18:42",
        basicAction: "query",
      }),
    ],
  };
}

/**
 * @description 读取或初始化指定空间的行为工作区。
 * @param spaceId 空间 id。
 * @returns 可变工作区数据。
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
 * @description 生成可重复的本地更新时间，避免依赖系统时钟。
 * @returns `YYYY-MM-DD HH:mm` 文本。
 */
function formatSpaceBehaviorUpdatedAt(): string {
  nextUpdatedMinute += 1;
  return `2026-09-29 09:${String(nextUpdatedMinute).padStart(2, "0")}`;
}

/**
 * @description 列出可关联的基础函数算子。
 * @returns 算子选项。
 */
export function listSpaceBehaviorOperatorOptionsMock(): SpaceBehaviorOperatorOption[] {
  return structuredClone(operatorCatalog);
}

/**
 * @description 查询指定空间的行为工作区快照。
 * @param spaceId 空间 id。
 * @returns 分类树与行为列表。
 */
export function querySpaceBehaviorWorkspaceMock(spaceId: string): SpaceBehaviorWorkspaceData {
  return structuredClone(getOrCreateSpaceBehaviorWorkspace(spaceId));
}

/**
 * @description 按草稿和算子目录组装一条行为记录。
 * @param draft 行为草稿。
 * @param id 行为 id。
 * @returns 完整行为。
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
    executionPeriod: "—",
    singleObject: true,
    executionCount: 0,
    successRate: "—",
    publisher: "",
    publishedAt: "",
    changeNote: draft.changeNote?.trim() || draft.description || `创建${draft.displayName}`,
    statusLogs: [],
    inputParameters: structuredClone(operator?.inputParameters ?? []),
    outputParameters: structuredClone(operator?.outputParameters ?? []),
    updatedAt: formatSpaceBehaviorUpdatedAt(),
  };
}

/**
 * @description 在指定空间本地新增行为。
 * @param spaceId 空间 id。
 * @param draft 行为草稿。
 * @returns 新增后的行为。
 */
export function createSpaceBehaviorMock(spaceId: string, draft: SpaceBehaviorDraft): SpaceBehaviorItem {
  const workspace = getOrCreateSpaceBehaviorWorkspace(spaceId);
  const created = buildBehaviorFromDraft(draft, `behavior-created-${nextBehaviorSeq++}`);
  workspace.behaviors.unshift(created);
  recountSpaceBehaviorCategoryCounts(workspace);
  return structuredClone(created);
}

/**
 * @description 更新指定空间内的行为。
 * @param spaceId 空间 id。
 * @param behaviorId 行为 id。
 * @param draft 行为草稿。
 * @returns 更新后的行为；未找到时返回 null。
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
 * @description 仅变更指定行为的状态，不改 ID、参数和引用。
 * @param spaceId 空间 id。
 * @param behaviorId 行为 id。
 * @param draft 状态变更草稿。
 * @returns 更新后的行为；未找到时返回 null。
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
 * @description 删除指定空间内的行为。
 * @param spaceId 空间 id。
 * @param behaviorId 行为 id。
 * @returns 是否删除成功。
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
 * @description 在指定分类下新增子分类。
 * @param spaceId 空间 id。
 * @param parentId 父分类 id。
 * @param label 分类名称。
 * @returns 新增分类；父分类不存在时返回 null。
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
 * @description 重命名指定行为分类。
 * @param spaceId 空间 id。
 * @param categoryId 分类 id。
 * @param label 新名称。
 * @returns 是否更新成功。
 */
export function updateSpaceBehaviorCategoryMock(spaceId: string, categoryId: string, label: string): boolean {
  const workspace = getOrCreateSpaceBehaviorWorkspace(spaceId);
  const target = findMutableCategory(workspace.categoryTree, categoryId);
  if (!target) return false;
  target.label = label;
  return true;
}

/**
 * @description 删除空分类；根分类、含子分类或仍挂行为时拒绝。
 * @param spaceId 空间 id。
 * @param categoryId 分类 id。
 * @returns 删除结果与失败原因。
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
 * @description 在可变分类树中查找节点。
 * @param nodes 分类树。
 * @param categoryId 分类 id。
 * @returns 匹配节点；未找到时返回 null。
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
 * @description 从可变分类树中移除节点。
 * @param nodes 分类树。
 * @param categoryId 分类 id。
 * @returns 是否移除成功。
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
