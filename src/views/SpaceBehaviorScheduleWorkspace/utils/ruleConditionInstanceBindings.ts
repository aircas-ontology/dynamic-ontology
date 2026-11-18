import type { Graph } from "@antv/x6";
import type { RuleConditionNode, RuleVariableValue } from "@/types";
import type { ScheduleRuleGraphNodeData } from "./scheduleRuleFlowGraphCells";
import { needsRuleVariableDataRow } from "./needsRuleVariableDataRow.ts";
import { cloneRuleFlowValue } from "./scheduleRuleFlowFactory.ts";

/** 条件编辑面板内部的变量引用，直接指向节点草稿中的原变量。 */
export interface ConditionVariableRow {
  key: string;
  label: string;
  value: RuleVariableValue;
}

/** 一条执行路径中的条件草稿；相同源节点在不同路径共享 data。 */
export interface ActionConditionSource {
  nodeId: string;
  label: string;
  data: ScheduleRuleGraphNodeData;
  rows: ConditionVariableRow[];
}

/** @description 递归保留条件层级及 AND/OR 关系，分别列出左右变量引用。 @param condition 条件节点。 @param prefix 祖先层级标签。 @returns 可编辑引用。 */
export function collectConditionVariableRows(condition: RuleConditionNode, prefix = ""): ConditionVariableRow[] {
  if (condition.type === "composite") {
    const logic = condition.logic === "and" ? "并且" : "或者";
    return condition.children.flatMap((child, index) =>
      collectConditionVariableRows(child, `${prefix}${index + 1}.`).map((row) => ({ ...row, label: `${logic} / ${row.label}` })),
    );
  }
  return (["left", "right"] as const).flatMap((side) => {
    const value = condition[side];
    return value.kind === "variable"
      ? [{ key: JSON.stringify([condition.id, side]), label: `条件 ${prefix.replace(/\.$/, "")} · ${side === "left" ? "左侧" : "右侧"}`, value }]
      : [];
  });
}

/** @description 沿所有入边逐路径收集祖先条件，保留分支语义，使用共享节点副本隔离取消编辑并防止循环。 @param graph 画布图。 @param actionId 行为节点。 @returns 从外到内的路径条件。 */
export function collectActionConditionPaths(graph: Pick<Graph, "getCellById" | "getIncomingEdges">, actionId: string): ActionConditionSource[][] {
  const drafts = new Map<string, ScheduleRuleGraphNodeData>();
  /** @description 深度优先读取一条上游路径。 @param id 当前节点。 @param seen 当前路径已访问节点。 @returns 条件路径集合。 */
  function visitAncestorPaths(id: string, seen: Set<string>): ActionConditionSource[][] {
    const node = graph.getCellById(id);
    if (!node?.isNode() || seen.has(id)) return [[]];
    const nextSeen = new Set([...seen, id]);
    const edges = graph.getIncomingEdges(node) || [];
    if (!edges.length) return [[]];
    return edges.flatMap((edge) => {
      const sourceId = edge.getSourceCellId();
      const source = graph.getCellById(sourceId);
      if (!source?.isNode() || nextSeen.has(sourceId)) return [[]];
      let data = drafts.get(sourceId);
      if (!data) {
        data = cloneRuleFlowValue(source.getData<ScheduleRuleGraphNodeData>());
        drafts.set(sourceId, data);
      }
      const port = edge.getSourcePortId();
      let entry: ActionConditionSource | undefined;
      if (data.condition)
        entry = { nodeId: sourceId, data, label: `条件分支 · ${port === "false" ? "不满足" : "满足"}`, rows: collectConditionVariableRows(data.condition) };
      if (data.switchStep) {
        const step = data.switchStep;
        const index = port?.startsWith("case_") ? Number(port.slice(5)) : -1;
        const selectedCase = step.cases[index];
        const values = [
          { key: "switchOn", label: "Switch 判断字段", value: step.switchOn },
          ...(port === "default" ? step.cases : selectedCase ? [selectedCase] : []).map((item) => ({
            key: `case:${item.id}`,
            label: `分支 ${item.label || item.id}`,
            value: item.value,
          })),
        ];
        entry = {
          nodeId: sourceId,
          data,
          label: `Switch · ${port === "default" ? "默认分支" : selectedCase?.label || port}`,
          rows: values.flatMap((item) => (item.value.kind === "variable" ? [{ ...item, value: item.value }] : [])),
        };
      }
      return visitAncestorPaths(sourceId, nextSeen).map((path) => (entry ? [...path, entry] : path));
    });
  }
  if (!graph.getCellById(actionId)) return [];
  return visitAncestorPaths(actionId, new Set()).filter((path) => path.length);
}

/** @description 校验共享条件引用的对象字段、唯一实例及必要子表行。 @param rows 当前路径变量。 @returns 首个错误或空字符串。 */
export function validateConditionBindings(rows: readonly ConditionVariableRow[]): string {
  for (const { label, value } of rows) {
    const name = `${label}「${value.objectName || value.objectId} · ${value.propertyName || value.propertyId}」`;
    if (!value.objectId || !value.propertyId) return `${name}的对象或字段已失效，请重新配置条件`;
    if (value.instanceIds.length !== 1 || !value.instanceIds[0]?.trim()) return `请选择${name}的一个实例`;
    if (needsRuleVariableDataRow(value.storageGroup) && (value.dataPrimaryKey === undefined || value.dataPrimaryKey === null || value.dataPrimaryKey === ""))
      return `请选择${name}的数据行`;
  }
  return "";
}
