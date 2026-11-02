import type { CompositeWorkflowSwitchCaseItem, CompositeWorkflowSwitchConfig } from "@/types";

import { generateUuidV4 } from "../../../utils/generateUuidV4.ts";

/**
 * @description 创建一条新的 Switch case（稳定 id + 空值）。
 * @returns case 项。
 */
export function createCompositeWorkflowSwitchCaseItem(): CompositeWorkflowSwitchCaseItem {
  return { id: generateUuidV4(), value: "" };
}

/**
 * @description 创建 Switch Case 节点的默认配置。
 * @returns 默认 switch 配置（1 个空 case）。
 */
export function createDefaultCompositeWorkflowSwitchConfig(): CompositeWorkflowSwitchConfig {
  return {
    kind: "switch",
    switchOn: { mode: "fromUpstream", upstreamParamName: "", upstreamParamPath: [] },
    cases: [createCompositeWorkflowSwitchCaseItem()],
  };
}

/**
 * @description 将历史或残缺 Switch 配置归一为当前结构。
 * @param raw 原始配置；可为空。
 * @returns 归一后的 switch 配置。
 */
export function normalizeCompositeWorkflowSwitchConfig(raw: unknown): CompositeWorkflowSwitchConfig {
  const fallback = createDefaultCompositeWorkflowSwitchConfig();
  if (!raw || typeof raw !== "object") {
    return fallback;
  }
  const record = raw as Record<string, unknown>;
  const switchOnRaw = record.switchOn;
  let switchOn = fallback.switchOn;
  if (switchOnRaw && typeof switchOnRaw === "object") {
    const switchOnRecord = switchOnRaw as Record<string, unknown>;
    if (switchOnRecord.mode === "fromUpstream") {
      const upstreamParamName = typeof switchOnRecord.upstreamParamName === "string" ? switchOnRecord.upstreamParamName.trim() : "";
      const pathRaw = switchOnRecord.upstreamParamPath;
      const upstreamParamPath = Array.isArray(pathRaw)
        ? pathRaw.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
        : upstreamParamName
          ? [upstreamParamName]
          : [];
      switchOn = {
        mode: "fromUpstream",
        upstreamParamName: upstreamParamPath[upstreamParamPath.length - 1] ?? upstreamParamName,
        upstreamParamPath,
      };
    }
  }
  const casesRaw = record.cases;
  const cases: CompositeWorkflowSwitchCaseItem[] = [];
  if (Array.isArray(casesRaw)) {
    for (const item of casesRaw) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const caseRecord = item as Record<string, unknown>;
      const value = typeof caseRecord.value === "string" ? caseRecord.value : "";
      const id = typeof caseRecord.id === "string" && caseRecord.id.trim() ? caseRecord.id.trim() : generateUuidV4();
      cases.push({ id, value });
    }
  }
  return {
    kind: "switch",
    switchOn,
    cases: cases.length > 0 ? cases : fallback.cases,
  };
}
