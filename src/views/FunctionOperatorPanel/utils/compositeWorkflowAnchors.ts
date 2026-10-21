/** 落点吸附到锚点的最大像素距离（超出则视为连到边框，拒绝）。 */
export const COMPOSITE_WORKFLOW_ANCHOR_SNAP_DISTANCE = 18;

/** Switch Case 的 default 出口标识。 */
export const COMPOSITE_WORKFLOW_SWITCH_DEFAULT_OUTLET = "default";

/**
 * @description 判断锚点是否为输出侧（右出，含分支 true/false 与 Switch case/default）。
 * @param anchorId 锚点 id。
 * @returns 是否输出锚点。
 */
export function isCompositeWorkflowOutputAnchorId(anchorId: string | undefined): boolean {
  if (!anchorId) {
    return false;
  }
  return (
    anchorId.endsWith("_out") ||
    anchorId.endsWith("_out_true") ||
    anchorId.endsWith("_out_false") ||
    anchorId.endsWith("_out_default") ||
    anchorId.includes("_out_case_")
  );
}

/**
 * @description 判断锚点是否为输入侧（左入）。
 * @param anchorId 锚点 id。
 * @returns 是否输入锚点。
 */
export function isCompositeWorkflowInputAnchorId(anchorId: string | undefined): boolean {
  return Boolean(anchorId && anchorId.endsWith("_in"));
}

/** 画布锚点坐标摘要。 */
export interface CompositeWorkflowAnchorPoint {
  x: number;
  y: number;
  id?: string;
}

/**
 * @description 在候选锚点中取距离落点最近且满足判定的锚点；超出吸附距离则拒绝。
 * @param anchors 节点锚点列表。
 * @param position 落点坐标。
 * @param maxDistance 最大吸附距离。
 * @param isAllowed 锚点是否允许（如仅入口 / 仅出口）。
 * @returns 最近合法锚点及下标；无则 undefined。
 */
export function pickClosestAllowedCompositeWorkflowAnchor(
  anchors: CompositeWorkflowAnchorPoint[],
  position: { x: number; y: number },
  maxDistance: number,
  isAllowed: (anchorId: string | undefined) => boolean,
): { index: number; anchor: CompositeWorkflowAnchorPoint } | undefined {
  let closestIndex = -1;
  let minDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < anchors.length; index += 1) {
    const anchor = anchors[index];
    if (!anchor || !isAllowed(anchor.id)) {
      continue;
    }
    const distance = Math.hypot(position.x - anchor.x, position.y - anchor.y);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  }
  if (closestIndex < 0 || minDistance > maxDistance) {
    return undefined;
  }
  const closest = anchors[closestIndex];
  if (!closest) {
    return undefined;
  }
  return { index: closestIndex, anchor: closest };
}

/**
 * @description 组装 Switch case 出口锚点 id。
 * @param nodeId 节点 id。
 * @param caseId case 稳定 id。
 * @returns 锚点 id。
 */
export function buildCompositeWorkflowSwitchCaseOutletAnchorId(nodeId: string, caseId: string): string {
  return `${nodeId}_out_case_${caseId}`;
}

/**
 * @description 组装 Switch default 出口锚点 id。
 * @param nodeId 节点 id。
 * @returns 锚点 id。
 */
export function buildCompositeWorkflowSwitchDefaultOutletAnchorId(nodeId: string): string {
  return `${nodeId}_out_default`;
}

/**
 * @description 从 Switch 出口锚点解析 switchOutlet（case.id 或 default）。
 * @param anchorId 锚点 id。
 * @returns switchOutlet；非 Switch 出口时返回 null。
 */
export function parseCompositeWorkflowSwitchOutletFromAnchorId(anchorId: string | undefined): string | null {
  if (!anchorId) {
    return null;
  }
  if (anchorId.endsWith("_out_default")) {
    return COMPOSITE_WORKFLOW_SWITCH_DEFAULT_OUTLET;
  }
  const marker = "_out_case_";
  const index = anchorId.indexOf(marker);
  if (index < 0) {
    return null;
  }
  const caseId = anchorId.slice(index + marker.length);
  return caseId.length > 0 ? caseId : null;
}
