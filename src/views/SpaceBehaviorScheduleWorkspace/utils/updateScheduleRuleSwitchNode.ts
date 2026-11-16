import type { Graph, Node } from "@antv/x6";
import type { RuleFlowSwitchStep } from "@/types";
import { addSwitchNode, createEdgeLabelConfig, PORT_SWITCH_CASE_PREFIX, PORT_SWITCH_DEFAULT, switchCasePortDisplay } from "./scheduleRuleFlowGraphCells";

/** @description 更新 Switch 外观及端口，按稳定 Case 标识迁移原连线并移除已删除分支的连线。 @param graph 当前画布。 @param node Switch 节点。 @param previous 修改前配置。 @param updated 修改后配置。 */
export function updateScheduleRuleSwitchNode(graph: Graph, node: Node, previous: RuleFlowSwitchStep, updated: RuleFlowSwitchStep): void {
  const buffer: ReturnType<Graph["createNode"]>[] = [];
  addSwitchNode({ graph, renderBuffer: buffer }, updated, node.position());
  const template = buffer[0];
  if (!template?.isNode()) return;
  const edges = graph.getOutgoingEdges(node) || [];
  for (const edge of edges) {
    const oldPort = edge.getSourcePortId();
    if (!oldPort) continue;
    let nextPort = oldPort;
    if (oldPort === PORT_SWITCH_DEFAULT) {
      if (updated.defaultSteps === null) {
        graph.removeEdge(edge);
        continue;
      }
    } else if (oldPort.startsWith(PORT_SWITCH_CASE_PREFIX)) {
      const index = Number(oldPort.slice(PORT_SWITCH_CASE_PREFIX.length));
      const oldCase = previous.cases[index];
      const nextIndex = oldCase ? updated.cases.findIndex((item) => item.id === oldCase.id) : -1;
      if (nextIndex < 0) {
        graph.removeEdge(edge);
        continue;
      }
      nextPort = `${PORT_SWITCH_CASE_PREFIX}${nextIndex}`;
    }
    if (nextPort !== oldPort) edge.setSource({ cell: node.id, port: nextPort });
    edge.setLabels(createEdgeLabelConfig(switchCasePortDisplay(updated, nextPort)));
  }
  node.setData({ kind: "switch", switchStep: updated }, { overwrite: true });
  node.setMarkup(template.getMarkup());
  node.setAttrs(template.getAttrs());
  node.setSize(template.getSize());
  node.setPropByPath("ports/items", template.getPorts());
}
