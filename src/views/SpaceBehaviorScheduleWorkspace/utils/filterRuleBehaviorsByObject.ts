import type { Graph } from "@antv/x6";
import type { RuleConditionNode, RuleExprTerm, RuleValueNode, ScheduleBehaviorOption } from "@/types";
import type { ScheduleRuleGraphNodeData } from "./scheduleRuleFlowGraphCells";

/** @description 收集值及历史嵌套值中的变量对象标识。 @param value 规则值。 @param ids 对象标识集合。 */
function collectValueObjectIds(value: RuleValueNode, ids: Set<string>): void {
  if (value.kind === "variable") {
    if (value.objectId.trim()) ids.add(value.objectId.trim());
  } else if (value.kind === "function") collectValueObjectIds(value.arg, ids);
  else if (value.kind === "expression") value.terms.forEach((term) => collectTermObjectIds(term, ids));
}
/** @description 递归读取历史表达式中的变量。 @param term 表达式项。 @param ids 对象标识集合。 */
function collectTermObjectIds(term: RuleExprTerm, ids: Set<string>): void {
  if (term.type === "value") collectValueObjectIds(term.value, ids);
  else if (term.type === "group") term.terms.forEach((child) => collectTermObjectIds(child, ids));
}
/** @description 遍历组合条件和两侧的变量。 @param condition 条件节点。 @param ids 对象标识集合。 */
function collectConditionObjectIds(condition: RuleConditionNode, ids: Set<string>): void {
  if (condition.type === "composite") condition.children.forEach((child) => collectConditionObjectIds(child, ids));
  else {
    collectValueObjectIds(condition.left, ids);
    collectValueObjectIds(condition.right, ids);
  }
}
/** @description 沿所有入边逆向收集行为上游条件引用的对象，合流与循环安全去重。 @param graph 当前画布。 @param nodeId 行为节点标识。 @returns 去重对象标识。 */
export function collectUpstreamConditionObjectIds(graph: Pick<Graph, "getCellById" | "getIncomingEdges">, nodeId: string): string[] {
  const ids = new Set<string>();
  const seen = new Set<string>([nodeId]);
  const pending = [nodeId];
  while (pending.length) {
    const id = pending.pop();
    if (!id) continue;
    const node = graph.getCellById(id);
    if (!node?.isNode()) continue;
    for (const edge of graph.getIncomingEdges(node) || []) {
      const sourceId = edge.getSourceCellId();
      if (!sourceId || seen.has(sourceId)) continue;
      seen.add(sourceId);
      const source = graph.getCellById(sourceId);
      if (!source?.isNode()) continue;
      const data = source.getData<ScheduleRuleGraphNodeData>();
      if (data?.kind === "condition" && data.condition) collectConditionObjectIds(data.condition, ids);
      pending.push(sourceId);
    }
  }
  return [...ids];
}
/** @description 按对象标识并集筛选行为，无对象时返回全部行为。 @param options 行为选项。 @param objectIds 条件对象标识。 @returns 可选行为。 */
export function filterBehaviorsByObjects(options: readonly ScheduleBehaviorOption[], objectIds: readonly string[]): ScheduleBehaviorOption[] {
  if (!objectIds.length) return [...options];
  const ids = new Set(objectIds);
  return options.filter((option) => ids.has(option.ontologyUniqIdentifier.trim()));
}
/** @description 条件或连线改变时清理明确不再匹配的已知行为与参数。 @param graph 当前画布。 @param options 已加载的行为选项。 @returns 清理节点数。 */
export function clearMismatchedGraphBehaviors(
  graph: Pick<Graph, "getCellById" | "getIncomingEdges" | "getNodes">,
  options: readonly ScheduleBehaviorOption[],
): number {
  let count = 0;
  for (const node of graph.getNodes()) {
    const data = node.getData<ScheduleRuleGraphNodeData>();
    const action = data?.action;
    if (data?.kind !== "action" || !action?.behaviorId) continue;
    const option = options.find((item) => item.id === action.behaviorId);
    const ids = collectUpstreamConditionObjectIds(graph, node.id);
    if (!option || !ids.length || filterBehaviorsByObjects([option], ids).length) continue;
    node.setData({ ...data, action: { ...action, behaviorId: "", behaviorName: "", params: [], behaviorParameters: undefined } });
    node.attr("title/text", "未配置行为");
    node.attr("summary/text", "请选择行为");
    count++;
  }
  return count;
}
