import type { Graph } from "@antv/x6";
import type { RuleFlowStep, RuleFlowSwitchCase, RuleFlowThenAction, ScheduleRuleFlowDocument } from "@/types";
import { cloneRuleFlowValue, createEmptyCompositeCondition, createEmptyThenAction, createRuleNodeId, createSwitchStep } from "./scheduleRuleFlowFactory";
import {
  ACT_H,
  ACT_OFFSET_Y,
  ACT_STEP_X,
  addActionNode,
  addConditionNode,
  addGraphEdge,
  addSwitchNode,
  addTerminalNode,
  BAND_GAP_Y,
  END_NODE_ID,
  PORT_FALSE,
  PORT_IN,
  PORT_OUT,
  PORT_SWITCH_CASE_PREFIX,
  PORT_SWITCH_DEFAULT,
  PORT_TRUE,
  PREFIX_BAND_PUSH_Y,
  readGraphNodeData,
  regionColumnX,
  START_NODE_ID,
  SUFFIX_GAP_Y,
  SWITCH_CASE_X_GAP,
  switchNodeHeight,
  type ScheduleRuleGraphCellContext,
  type ScheduleRuleGraphWireRef,
} from "./scheduleRuleFlowGraphCells";

/** 一块步骤渲染后的出口。 */
interface RegionRenderResult {
  /** 区域底部纵坐标。 */
  bottomY: number;
  /** 待接入后续节点的出边。 */
  exits: ScheduleRuleGraphWireRef[];
}

/** IF / ELSE IF 链上的一项。 */
interface ChainItem {
  /** 条件节点标识。 */
  conditionNodeId: string;
  /** 满足路径起点。 */
  trueStartId: string | null;
}

/**
 * @description 判断否则路径是否为「否则如果」续接条件。
 * @param otherwise 否则路径。
 * @returns 是否为续接条件。
 */
function isElseIfContinuation(otherwise: RuleFlowStep[] | null): boolean {
  return Boolean(otherwise && otherwise.length === 1 && otherwise[0]?.kind === "branch");
}

/**
 * @description 把规则流步骤递归画到画布上。
 * @param ctx 图上下文。
 * @param steps 步骤列表。
 * @param depth 嵌套深度。
 * @param yStart 起始纵坐标。
 * @param entryWires 进入该区域的连线。
 * @param xOffset 额外横坐标偏移。
 * @returns 区域出口。
 */
export function renderRuleFlowSteps(
  ctx: ScheduleRuleGraphCellContext,
  steps: RuleFlowStep[],
  depth: number,
  yStart: number,
  entryWires: ScheduleRuleGraphWireRef[],
  xOffset = 0,
): RegionRenderResult {
  let cursorY = yStart;
  let exits: ScheduleRuleGraphWireRef[] = entryWires;
  let branchRendered = false;

  steps.forEach((step, stepIndex) => {
    if (step.kind === "actions") {
      const prefix = !branchRendered;
      const preludeAtSpine = prefix && depth === 0;
      const baseX = regionColumnX(depth, xOffset);
      const nodeY = preludeAtSpine ? Math.max(cursorY - 24, 48) : cursorY + (prefix ? ACT_OFFSET_Y : SUFFIX_GAP_Y);
      const actions = step.actions.length ? step.actions : [createEmptyThenAction()];
      let previousActionId = "";
      actions.forEach((action, actionIndex) => {
        addActionNode(ctx, action, { x: baseX + actionIndex * ACT_STEP_X, y: nodeY });
        if (actionIndex === 0) {
          exits.forEach((wire) => {
            addGraphEdge(ctx, { ...wire, targetId: action.id, targetPort: PORT_IN });
          });
        } else {
          addGraphEdge(ctx, {
            sourceId: previousActionId,
            sourcePort: PORT_OUT,
            targetId: action.id,
            targetPort: PORT_IN,
          });
        }
        previousActionId = action.id;
      });
      const lastAction = actions[actions.length - 1];
      if (lastAction) exits = [{ sourceId: lastAction.id, sourcePort: PORT_OUT }];
      if (stepIndex + 1 < steps.length) {
        cursorY = Math.max(cursorY, nodeY + ACT_H + PREFIX_BAND_PUSH_Y);
      } else if (!prefix) {
        cursorY = nodeY + ACT_H;
      }
      return;
    }

    if (step.kind === "switch") {
      branchRendered = true;
      const caseCount = step.cases.length;
      const hasDefault = Boolean(step.defaultSteps && step.defaultSteps.length > 0);
      const switchH = switchNodeHeight(caseCount, hasDefault);
      const switchY = cursorY + ACT_OFFSET_Y;
      addSwitchNode(ctx, step, { x: regionColumnX(depth, xOffset), y: switchY });
      exits.forEach((wire) => {
        addGraphEdge(ctx, { ...wire, targetId: step.id, targetPort: PORT_IN });
      });
      const caseYStart = switchY + switchH + BAND_GAP_Y;
      const caseExits: ScheduleRuleGraphWireRef[] = [];
      let maxBottomY = caseYStart;
      step.cases.forEach((item, index) => {
        const caseRender = renderRuleFlowSteps(
          ctx,
          item.steps,
          depth + 1,
          caseYStart,
          [{ sourceId: step.id, sourcePort: `${PORT_SWITCH_CASE_PREFIX}${index}` }],
          (index + 1) * SWITCH_CASE_X_GAP,
        );
        caseExits.push(...caseRender.exits);
        if (caseRender.bottomY > maxBottomY) maxBottomY = caseRender.bottomY;
      });
      if (hasDefault && step.defaultSteps) {
        const defaultRender = renderRuleFlowSteps(
          ctx,
          step.defaultSteps,
          depth + 1,
          caseYStart,
          [{ sourceId: step.id, sourcePort: PORT_SWITCH_DEFAULT }],
          (caseCount + 1) * SWITCH_CASE_X_GAP,
        );
        caseExits.push(...defaultRender.exits);
        if (defaultRender.bottomY > maxBottomY) maxBottomY = defaultRender.bottomY;
      }
      exits = caseExits;
      cursorY = maxBottomY;
      return;
    }

    branchRendered = true;
    addConditionNode(ctx, step.id, step.condition, {
      x: regionColumnX(depth, xOffset),
      y: cursorY + ACT_OFFSET_Y,
    });
    exits.forEach((wire) => {
      addGraphEdge(ctx, { ...wire, targetId: step.id, targetPort: PORT_IN });
    });
    const thenRender = renderRuleFlowSteps(ctx, step.then, depth + 1, cursorY, [{ sourceId: step.id, sourcePort: PORT_TRUE }], xOffset);
    let elseRender: RegionRenderResult | null = null;
    if (step.otherwise && step.otherwise.length) {
      const elseY = Math.max(thenRender.bottomY + BAND_GAP_Y, cursorY + BAND_GAP_Y);
      elseRender = renderRuleFlowSteps(
        ctx,
        step.otherwise,
        isElseIfContinuation(step.otherwise) ? depth : depth + 1,
        elseY,
        [{ sourceId: step.id, sourcePort: PORT_FALSE }],
        xOffset,
      );
    }
    exits = [...thenRender.exits, ...(elseRender?.exits ?? [])];
    cursorY = Math.max(thenRender.bottomY, elseRender?.bottomY ?? cursorY);
  });

  return { bottomY: cursorY, exits };
}

/**
 * @description 用规则流文档重建画布单元格缓冲。
 * @param ctx 图上下文。
 * @param doc 规则流文档。
 */
export function fillRuleFlowRenderBuffer(ctx: ScheduleRuleGraphCellContext, doc: ScheduleRuleFlowDocument): void {
  addTerminalNode(ctx, "start", { x: 40, y: 72 });
  renderRuleFlowSteps(ctx, doc.steps, 0, 60, [{ sourceId: START_NODE_ID, sourcePort: PORT_OUT }]);
}

/**
 * @description 读取指定端口的第一条出边目标。
 * @param graph 图实例。
 * @param nodeId 源节点。
 * @param portId 源端口。
 * @returns 目标节点标识。
 */
function portTargetNodeId(graph: Graph, nodeId: string, portId: string): string | null {
  const edge = (graph.getOutgoingEdges(nodeId) || []).find((item) => item.getSourcePortId() === portId);
  return edge?.getTargetCellId() ?? null;
}

/**
 * @description 从若干起点收集可达节点，遇到停止点不再向外走。
 * @param graph 图实例。
 * @param startIds 起点。
 * @param stopId 停止点。
 * @returns 可达节点集合。
 */
export function collectReachableNodes(graph: Graph, startIds: string[], stopId: string): Set<string> {
  const reachable = new Set<string>();
  const stack = [...startIds];
  while (stack.length) {
    const currentId = stack.pop();
    if (!currentId) break;
    reachable.add(currentId);
    if (currentId === stopId) continue;
    (graph.getOutgoingEdges(currentId) || []).forEach((edge) => {
      const targetId = edge.getTargetCellId();
      if (targetId && !reachable.has(targetId)) stack.push(targetId);
    });
  }
  return reachable;
}

/**
 * @description 在 IF / ELSE IF 链的满足路径与否则路径上找第一个汇合节点。
 * @param graph 图实例。
 * @param chain 条件链。
 * @param elseStartId 否则路径起点。
 * @param stopNodeId 停止点。
 * @returns 汇合节点标识。
 */
function findMergeNode(graph: Graph, chain: ChainItem[], elseStartId: string | null, stopNodeId: string): string {
  const elseReach = elseStartId ? collectReachableNodes(graph, [elseStartId], stopNodeId) : new Set<string>();
  const firstTrue = chain[0]?.trueStartId;
  if (!firstTrue) return stopNodeId;
  const stack: string[] = [firstTrue];
  const seen = new Set<string>();
  while (stack.length) {
    const currentId = stack.pop();
    if (!currentId) break;
    if (currentId === stopNodeId) return stopNodeId;
    if (elseReach.has(currentId)) return currentId;
    if (seen.has(currentId)) continue;
    seen.add(currentId);
    (graph.getOutgoingEdges(currentId) || []).forEach((edge) => {
      const targetId = edge.getTargetCellId();
      if (targetId && !seen.has(targetId)) stack.push(targetId);
    });
  }
  return stopNodeId;
}

/**
 * @description 在 Switch 多路路径上找第一个汇合节点。
 * @param graph 图实例。
 * @param caseStarts 各 case 起点。
 * @param defaultStart 默认路径起点。
 * @param stopNodeId 停止点。
 * @returns 汇合节点标识。
 */
function findSwitchMerge(graph: Graph, caseStarts: Array<string | null>, defaultStart: string | null, stopNodeId: string): string {
  const reachableSets: Array<Set<string>> = [];
  caseStarts.forEach((startId) => {
    if (startId) reachableSets.push(collectReachableNodes(graph, [startId], stopNodeId));
  });
  if (defaultStart) reachableSets.push(collectReachableNodes(graph, [defaultStart], stopNodeId));
  if (!reachableSets.length) return stopNodeId;
  let candidates = reachableSets[0] ?? new Set<string>();
  for (let index = 1; index < reachableSets.length; index += 1) {
    const next = new Set<string>();
    const current = reachableSets[index];
    if (!current) continue;
    current.forEach((id) => {
      if (candidates.has(id)) next.add(id);
    });
    candidates = next;
  }
  if (candidates.has(stopNodeId)) return stopNodeId;
  const firstStart = caseStarts.find((item) => item) ?? defaultStart;
  if (!firstStart) return stopNodeId;
  const stack: string[] = [firstStart];
  const seen = new Set<string>();
  while (stack.length) {
    const currentId = stack.pop();
    if (!currentId) break;
    if (candidates.has(currentId)) return currentId;
    if (seen.has(currentId)) continue;
    seen.add(currentId);
    (graph.getOutgoingEdges(currentId) || []).forEach((edge) => {
      const targetId = edge.getTargetCellId();
      if (targetId && !seen.has(targetId)) stack.push(targetId);
    });
  }
  return stopNodeId;
}

/**
 * @description 把从起点到停止点之间的画布节点还原为规则流步骤。
 * @param graph 图实例。
 * @param startNodeId 起点。
 * @param stopNodeId 停止点。
 * @returns 步骤列表。
 */
export function buildRuleFlowRegion(graph: Graph, startNodeId: string | null, stopNodeId: string): RuleFlowStep[] {
  if (!startNodeId || startNodeId === stopNodeId) return [];
  const steps: RuleFlowStep[] = [];
  let currentId: string | null = startNodeId;

  while (currentId && currentId !== stopNodeId) {
    const node = graph.getCellById(currentId);
    if (!node?.isNode()) break;
    const data = readGraphNodeData(node);

    if (data.kind === "action") {
      const actions: RuleFlowThenAction[] = [];
      let chainId: string | null = currentId;
      while (chainId) {
        const chainNode = graph.getCellById(chainId);
        if (!chainNode?.isNode() || readGraphNodeData(chainNode).kind !== "action") break;
        const chainData = readGraphNodeData(chainNode);
        actions.push(cloneRuleFlowValue(chainData.action ?? createEmptyThenAction()));
        const nextId = portTargetNodeId(graph, chainId, PORT_OUT);
        const nextNode = nextId ? graph.getCellById(nextId) : null;
        if (nextNode?.isNode() && readGraphNodeData(nextNode).kind === "action" && nextId !== stopNodeId) {
          chainId = nextId;
          continue;
        }
        currentId = nextId;
        chainId = null;
      }
      steps.push({ kind: "actions", id: actions[0]?.id ?? createRuleNodeId("step"), actions });
      continue;
    }

    if (data.kind === "condition") {
      const chain: ChainItem[] = [];
      let cursorId: string | null = currentId;
      let elseStartId: string | null = null;
      while (cursorId) {
        const conditionNode = graph.getCellById(cursorId);
        if (!conditionNode?.isNode() || readGraphNodeData(conditionNode).kind !== "condition") break;
        chain.push({ conditionNodeId: cursorId, trueStartId: portTargetNodeId(graph, cursorId, PORT_TRUE) });
        const falseStartId = portTargetNodeId(graph, cursorId, PORT_FALSE);
        if (!falseStartId || falseStartId === stopNodeId) {
          elseStartId = null;
          break;
        }
        const falseNode = graph.getCellById(falseStartId);
        if (falseNode?.isNode() && readGraphNodeData(falseNode).kind === "condition") {
          cursorId = falseStartId;
          continue;
        }
        elseStartId = falseStartId;
        break;
      }
      const mergeId = findMergeNode(graph, chain, elseStartId, stopNodeId);
      let otherwise: RuleFlowStep[] | null = elseStartId ? buildRuleFlowRegion(graph, elseStartId, mergeId) : null;
      for (let index = chain.length - 1; index >= 0; index -= 1) {
        const item = chain[index];
        if (!item) continue;
        const conditionNode = graph.getCellById(item.conditionNodeId);
        const conditionData = conditionNode?.isNode() ? readGraphNodeData(conditionNode) : { kind: "condition" as const };
        otherwise = [
          {
            kind: "branch",
            id: item.conditionNodeId,
            condition: cloneRuleFlowValue(
              conditionData.kind === "condition" ? (conditionData.condition ?? createEmptyCompositeCondition(true)) : createEmptyCompositeCondition(true),
            ),
            then: buildRuleFlowRegion(graph, item.trueStartId, mergeId),
            otherwise,
          },
        ];
      }
      const branchStep = otherwise?.[0];
      if (branchStep) steps.push(branchStep);
      currentId = mergeId === stopNodeId ? stopNodeId : mergeId;
      continue;
    }

    if (data.kind === "switch") {
      const switchStepData = data.switchStep ?? createSwitchStep();
      const caseCount = switchStepData.cases.length;
      const caseStarts: Array<string | null> = [];
      for (let index = 0; index < caseCount; index += 1) {
        caseStarts.push(portTargetNodeId(graph, currentId, `${PORT_SWITCH_CASE_PREFIX}${index}`));
      }
      const hasDefault = Boolean(switchStepData.defaultSteps && switchStepData.defaultSteps.length > 0);
      const defaultStart = hasDefault ? portTargetNodeId(graph, currentId, PORT_SWITCH_DEFAULT) : null;
      const mergeId = findSwitchMerge(graph, caseStarts, defaultStart, stopNodeId);
      const cases: RuleFlowSwitchCase[] = switchStepData.cases.map((item, index) => ({
        id: item.id,
        label: item.label,
        value: cloneRuleFlowValue(item.value),
        steps: buildRuleFlowRegion(graph, caseStarts[index] ?? null, mergeId),
      }));
      steps.push({
        kind: "switch",
        id: currentId,
        switchOn: cloneRuleFlowValue(switchStepData.switchOn),
        cases,
        defaultSteps: defaultStart ? buildRuleFlowRegion(graph, defaultStart, mergeId) : null,
      });
      currentId = mergeId === stopNodeId ? stopNodeId : mergeId;
      continue;
    }

    break;
  }

  return steps;
}

/**
 * @description 从规则开始节点序列化整张画布。
 * @param graph 图实例。
 * @returns 规则流文档。
 */
export function serializeRuleFlowGraph(graph: Graph): ScheduleRuleFlowDocument {
  const startTargetId = portTargetNodeId(graph, START_NODE_ID, PORT_OUT);
  if (!startTargetId) return { steps: [] };
  return { steps: buildRuleFlowRegion(graph, startTargetId, END_NODE_ID) };
}
