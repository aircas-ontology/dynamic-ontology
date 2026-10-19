/** 落点吸附到锚点的最大像素距离（超出则视为连到边框，拒绝）。 */
export const COMPOSITE_WORKFLOW_ANCHOR_SNAP_DISTANCE = 18;

/**
 * @description 判断锚点是否为输出侧（右出，含分支 true/false）。
 * @param anchorId 锚点 id。
 * @returns 是否输出锚点。
 */
export function isCompositeWorkflowOutputAnchorId(anchorId: string | undefined): boolean {
  if (!anchorId) {
    return false;
  }
  return anchorId.endsWith("_out") || anchorId.endsWith("_out_true") || anchorId.endsWith("_out_false");
}

/**
 * @description 判断锚点是否为输入侧（左入）。
 * @param anchorId 锚点 id。
 * @returns 是否输入锚点。
 */
export function isCompositeWorkflowInputAnchorId(anchorId: string | undefined): boolean {
  return Boolean(anchorId && anchorId.endsWith("_in"));
}
