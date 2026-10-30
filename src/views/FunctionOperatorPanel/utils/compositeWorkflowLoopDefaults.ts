import type { CompositeWorkflowLoopConfig, CompositeWorkflowPortTypeName } from "@/types";

/** 端口类型白名单；未登记的类型回落为 object，避免写进配置的类型后端无法识别。 */
const PORT_TYPE_NAMES: CompositeWorkflowPortTypeName[] = ["number", "string", "boolean", "object", "array"];

/**
 * @description 归一端口类型取值。
 * @param raw 原始类型字符串；可为空。
 * @returns 白名单内的类型；无法识别时返回空。
 */
function normalizePortType(raw: unknown): CompositeWorkflowPortTypeName | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }
  const key = raw.trim().toLowerCase() as CompositeWorkflowPortTypeName;
  return PORT_TYPE_NAMES.includes(key) ? key : undefined;
}

/**
 * @description 创建循环节点的默认配置（集合取自上游路径）。
 * @returns 默认 loop 配置。
 */
export function createDefaultCompositeWorkflowLoopConfig(): CompositeWorkflowLoopConfig {
  return {
    kind: "loop",
    collection: { mode: "fromUpstream", upstreamParamName: "", upstreamParamPath: [] },
    itemParamName: "item",
    itemType: "object",
    doneType: "object",
    maxIterations: 100,
  };
}

/**
 * @description 将历史或残缺循环配置归一为当前结构（仅 fromUpstream 路径；manual JSON 降级为空路径）。
 * @param raw 原始配置；可为空。
 * @returns 归一后的循环配置。
 */
export function normalizeCompositeWorkflowLoopConfig(raw: unknown): CompositeWorkflowLoopConfig {
  const fallback = createDefaultCompositeWorkflowLoopConfig();
  if (!raw || typeof raw !== "object") {
    return fallback;
  }
  const record = raw as Record<string, unknown>;
  const itemParamName = typeof record.itemParamName === "string" && record.itemParamName.trim() ? record.itemParamName.trim() : "item";
  const indexRaw = record.indexParamName;
  const indexParamName = typeof indexRaw === "string" && indexRaw.trim() ? indexRaw.trim() : undefined;
  const maxRaw = record.maxIterations;
  const maxIterations = typeof maxRaw === "number" && Number.isFinite(maxRaw) && maxRaw >= 1 ? Math.floor(maxRaw) : 100;

  const collectionRaw = record.collection;
  let collection = fallback.collection;
  if (collectionRaw && typeof collectionRaw === "object") {
    const collectionRecord = collectionRaw as Record<string, unknown>;
    if (collectionRecord.mode === "fromUpstream") {
      const upstreamParamName = typeof collectionRecord.upstreamParamName === "string" ? collectionRecord.upstreamParamName.trim() : "";
      const pathRaw = collectionRecord.upstreamParamPath;
      const upstreamParamPath = Array.isArray(pathRaw)
        ? pathRaw.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
        : upstreamParamName
          ? [upstreamParamName]
          : [];
      collection = {
        mode: "fromUpstream",
        upstreamParamName: upstreamParamPath[upstreamParamPath.length - 1] ?? upstreamParamName,
        upstreamParamPath,
      };
    }
  }

  return {
    kind: "loop",
    collection,
    itemParamName,
    ...(indexParamName ? { indexParamName } : {}),
    itemType: normalizePortType(record.itemType) ?? "object",
    doneType: normalizePortType(record.doneType) ?? "object",
    maxIterations,
  };
}
