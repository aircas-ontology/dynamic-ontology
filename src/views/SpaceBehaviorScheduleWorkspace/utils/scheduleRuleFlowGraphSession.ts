import { Graph, type Cell } from "@antv/x6";
import type { ScheduleRuleFlowDocument } from "@/types";
import { cloneScheduleRuleFlow, createBranchStep, createEmptyThenAction, createSwitchStep } from "./scheduleRuleFlowFactory";
import {
  addActionNode,
  addConditionNode,
  addGraphEdge,
  addSwitchNode,
  createEdgeAttrs,
  createEdgeLabelConfig,
  edgeColorForSourcePort,
  edgeLabelForSourcePort,
  END_NODE_ID,
  PORT_FALSE,
  PORT_IN,
  readGraphNodeData,
  START_NODE_ID,
  type ScheduleRuleGraphCellContext,
} from "./scheduleRuleFlowGraphCells";
import { collectReachableNodes, fillRuleFlowRenderBuffer, serializeRuleFlowGraph } from "./scheduleRuleFlowGraphSerialize";

/** 画布会话回写到 Vue 的状态。 */
export interface ScheduleRuleFlowGraphCanvasState {
  /** 未接入流程的节点数。 */
  disconnectedCount: number;
  /** 画布是否只剩规则开始。 */
  canvasEmpty: boolean;
}

/** 画布会话回调。 */
export interface ScheduleRuleFlowGraphSessionCallbacks {
  /**
   * @description 画布拓扑变化后回写规则流文档。
   * @param doc 序列化后的文档。
   */
  onCommit: (doc: ScheduleRuleFlowDocument) => void;
  /**
   * @description 连线校验失败时展示提示。
   * @param message 提示文案。
   */
  onConnectionMessage: (message: string) => void;
  /**
   * @description 选中变化时更新删除按钮可用性。
   * @param removable 当前选中是否可删。
   */
  onSelectionChange: (removable: boolean) => void;
  /**
   * @description 刷新未接入节点计数和空画布状态。
   * @param state 画布状态。
   */
  onCanvasState: (state: ScheduleRuleFlowGraphCanvasState) => void;
  /**
   * @description 自动布局失败等非阻断提示。
   * @param message 提示文案。
   */
  onWarning: (message: string) => void;
}

/** 规则配置画布可拖入的节点类型。 */
export type ScheduleRulePaletteKind = "condition" | "action" | "switch";

/** Dagre 布局后的节点坐标。 */
interface DagreNodePosition {
  /** 节点标识。 */
  id: string;
  /** 中心横坐标。 */
  x: number;
  /** 中心纵坐标。 */
  y: number;
}

/**
 * @description 从布局结果中读取带坐标的节点，忽略类型不完整的项。
 * @param nodes 布局返回的节点列表。
 * @returns 可用于回写 X6 位置的节点。
 */
function readDagreNodePositions(nodes: unknown): DagreNodePosition[] {
  if (!Array.isArray(nodes)) return [];
  const positions: DagreNodePosition[] = [];
  nodes.forEach((item) => {
    if (!item || typeof item !== "object") return;
    if (!("id" in item) || !("x" in item) || !("y" in item)) return;
    if (typeof item.id !== "string" || typeof item.x !== "number" || typeof item.y !== "number") return;
    positions.push({ id: item.id, x: item.x, y: item.y });
  });
  return positions;
}

/**
 * @description 持有非响应式 X6 图实例，负责渲染、连线校验、序列化和卸载销毁。
 */
export class ScheduleRuleFlowGraphSession {
  private graph: Graph | null = null;
  private syncingGraph = false;
  private selectedCellId = "";
  private selectedRemovable = false;
  private messageTimer: number | undefined;
  private readonly callbacks: ScheduleRuleFlowGraphSessionCallbacks;

  /**
   * @description 创建画布会话。
   * @param callbacks Vue 层状态回调。
   */
  constructor(callbacks: ScheduleRuleFlowGraphSessionCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * @description 在容器中创建 X6 图并渲染初始文档。
   * @param container 画布 DOM。
   * @param doc 初始规则流。
   */
  mount(container: HTMLElement, doc: ScheduleRuleFlowDocument): void {
    if (this.graph) return;
    const shell = container.parentElement;
    const initialWidth = Math.max(shell?.clientWidth || container.clientWidth, 320);
    const initialHeight = Math.max(shell?.clientHeight || container.clientHeight, 320);
    this.graph = new Graph({
      container,
      width: initialWidth,
      height: initialHeight,
      autoResize: true,
      background: { color: "transparent" },
      grid: {
        visible: true,
        size: 24,
        type: "doubleMesh",
        args: [
          { color: "var(--aircas-color-grid-line)", thickness: 1 },
          { color: "var(--aircas-color-border-soft)", thickness: 1, factor: 4 },
        ],
      },
      panning: { enabled: true, eventTypes: ["leftMouseDown", "mouseWheel"] },
      mousewheel: { enabled: true, modifiers: ["ctrl", "meta"], minScale: 0.4, maxScale: 2, factor: 1.1 },
      interacting: {
        edgeMovable: false,
        edgeLabelMovable: false,
        arrowheadMovable: false,
      },
      translating: { restrict: false },
      connecting: {
        snap: { radius: 28 },
        allowBlank: false,
        allowLoop: false,
        allowNode: false,
        allowEdge: false,
        allowPort: true,
        allowMulti: true,
        highlight: true,
        router: { name: "manhattan", args: { padding: 18 } },
        connector: { name: "rounded", args: { radius: 8 } },
        connectionPoint: "anchor",
        validateMagnet: ({ magnet }) => magnet.getAttribute("magnet") !== "passive",
        validateConnection: ({ sourceCell, targetCell, sourcePort, targetPort }) => this.validateConnection(sourceCell, targetCell, sourcePort, targetPort),
        createEdge() {
          return this.createEdge({
            router: { name: "manhattan", args: { padding: 18 } },
            connector: { name: "rounded", args: { radius: 8 } },
            attrs: createEdgeAttrs("var(--aircas-color-accent-cyan)"),
            zIndex: 0,
          });
        },
      },
    });
    this.graph.on("edge:connected", ({ edge }) => {
      if (this.syncingGraph) return;
      const sourcePort = edge.getSourcePortId();
      const ctx = this.createCellContext(null);
      const label = edgeLabelForSourcePort(ctx, edge.getSourceCellId(), sourcePort);
      if (label) edge.setLabels(createEdgeLabelConfig(label));
      edge.attr("line/stroke", edgeColorForSourcePort(sourcePort));
      this.commitGraph();
    });
    this.graph.on("cell:click", ({ cell }) => {
      this.selectCell(cell);
    });
    this.graph.on("blank:click", () => {
      this.clearSelection();
    });
    this.renderDocument(doc);
    window.requestAnimationFrame(() => this.fitGraph());
  }

  /**
   * @description 卸载时销毁图实例并清理定时器。
   */
  dispose(): void {
    window.clearTimeout(this.messageTimer);
    this.graph?.dispose();
    this.graph = null;
  }

  /**
   * @description 用文档整图替换画布，避免同 id 节点残留旧 SVG。
   * @param doc 规则流文档。
   */
  renderDocument(doc: ScheduleRuleFlowDocument): void {
    if (!this.graph) return;
    this.syncingGraph = true;
    const buffer: Cell[] = [];
    const ctx = this.createCellContext(buffer);
    try {
      fillRuleFlowRenderBuffer(ctx, doc);
    } finally {
      this.syncingGraph = false;
    }
    this.graph.resetCells(buffer);
    this.refreshConditionBadges();
    this.refreshCanvasState();
  }

  /**
   * @description 从当前画布序列化规则流。
   * @returns 规则流文档。
   */
  serialize(): ScheduleRuleFlowDocument {
    if (!this.graph) return { steps: [] };
    return serializeRuleFlowGraph(this.graph);
  }

  /**
   * @description 把面板拖入的节点落到画布坐标。
   * @param kind 节点类型。
   * @param clientX 指针横坐标。
   * @param clientY 指针纵坐标。
   */
  dropPaletteNode(kind: ScheduleRulePaletteKind, clientX: number, clientY: number): void {
    if (!this.graph) return;
    const point = this.graph.clientToLocal(clientX, clientY);
    const position = { x: Math.round(point.x - 60), y: Math.round(point.y - 30) };
    const ctx = this.createCellContext(null);
    if (kind === "condition") {
      const step = createBranchStep();
      addConditionNode(ctx, step.id, step.condition, position);
    } else if (kind === "action") {
      addActionNode(ctx, createEmptyThenAction(), position);
    } else {
      addSwitchNode(ctx, createSwitchStep(), position);
    }
    this.commitGraph();
  }

  /**
   * @description 清空为只剩规则开始。
   */
  clearCanvas(): void {
    this.clearSelection();
    this.renderDocument({ steps: [] });
    this.callbacks.onCommit(cloneScheduleRuleFlow({ steps: [] }));
    window.requestAnimationFrame(() => this.fitGraph());
  }

  /**
   * @description 用 Dagre 从左到右重排当前节点；布局库按需加载，避免调度列表页启动失败。
   */
  async autoLayout(): Promise<void> {
    if (!this.graph) return;
    const canvasNodes = this.graph.getNodes();
    if (!canvasNodes.length) return;
    try {
      const { DagreLayout } = await import("@antv/layout");
      const layoutNodes = canvasNodes.map((node) => {
        const size = node.getSize();
        return { id: node.id, size: [size.width, size.height] as [number, number] };
      });
      const seenEdge = new Set<string>();
      const layoutEdges = (this.graph.getEdges() || [])
        .map((edge) => {
          const source = edge.getSourceCellId();
          const target = edge.getTargetCellId();
          if (!source || !target || source === target) return null;
          const key = `${source}->${target}`;
          if (seenEdge.has(key)) return null;
          seenEdge.add(key);
          return { source, target };
        })
        .filter((item): item is { source: string; target: string } => Boolean(item));
      const dagreLayout = new DagreLayout({
        type: "dagre",
        rankdir: "LR",
        align: "UL",
        nodesep: 48,
        ranksep: 80,
        begin: [40, 40],
        controlPoints: false,
      });
      const result = dagreLayout.layout({
        nodes: layoutNodes,
        edges: layoutEdges,
      });
      this.syncingGraph = true;
      readDagreNodePositions(result.nodes).forEach((item) => {
        const cell = this.graph?.getCellById(item.id);
        if (!cell?.isNode()) return;
        const size = cell.getSize();
        cell.position(Math.round(item.x - size.width / 2), Math.round(item.y - size.height / 2));
      });
      this.syncingGraph = false;
      window.requestAnimationFrame(() => this.fitGraph());
    } catch {
      this.syncingGraph = false;
      this.callbacks.onWarning("自动布局失败，请检查节点连线后重试");
    }
  }

  /**
   * @description 缩放画布使全部节点可见。
   */
  fitGraph(): void {
    this.graph?.zoomToFit({ padding: 40, maxScale: 1 });
  }

  /**
   * @description 删除当前可移除的选中节点或边。
   */
  removeSelected(): void {
    if (!this.graph || !this.selectedRemovable || !this.selectedCellId) return;
    const cell = this.graph.getCellById(this.selectedCellId);
    if (!cell) return;
    if (cell.isNode()) this.removeNode(cell.id);
    else if (cell.isEdge()) this.removeEdge(cell.id);
  }

  /**
   * @description 处理画布 Delete / Backspace。
   * @param event 键盘事件。
   */
  handleCanvasKeydown(event: KeyboardEvent): void {
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    if (!this.selectedRemovable) return;
    event.preventDefault();
    this.removeSelected();
  }

  /**
   * @description 创建当前图的单元格上下文。
   * @param renderBuffer 整图渲染缓冲。
   * @returns 上下文。
   */
  private createCellContext(renderBuffer: Cell[] | null): ScheduleRuleGraphCellContext {
    return { graph: this.graph, renderBuffer };
  }

  /**
   * @description 序列化画布并回写文档。
   */
  private commitGraph(): void {
    if (!this.graph) return;
    this.refreshConditionBadges();
    this.refreshCanvasState();
    this.callbacks.onCommit(cloneScheduleRuleFlow(serializeRuleFlowGraph(this.graph)));
  }

  /**
   * @description 刷新条件节点的「如果 / 否则如果」徽标。
   */
  private refreshConditionBadges(): void {
    if (!this.graph) return;
    this.graph.getNodes().forEach((node) => {
      const data = readGraphNodeData(node);
      if (data.kind !== "condition") return;
      const isElseIf = (this.graph?.getIncomingEdges(node) || []).some((edge) => {
        const source = this.graph?.getCellById(edge.getSourceCellId() || "");
        return source?.isNode() && readGraphNodeData(source).kind === "condition" && edge.getSourcePortId() === PORT_FALSE;
      });
      node.attr("badge/text", isElseIf ? "否则如果" : "如果");
      node.attr("badge/fill", isElseIf ? "var(--aircas-color-accent-blue)" : "var(--aircas-color-accent-cyan)");
      node.attr("body/stroke", isElseIf ? "var(--aircas-color-accent-blue)" : "var(--aircas-color-accent-cyan)");
    });
  }

  /**
   * @description 统计未接入流程的节点并同步空画布状态。
   */
  private refreshCanvasState(): void {
    if (!this.graph) return;
    const reachable = collectReachableNodes(this.graph, [START_NODE_ID], END_NODE_ID);
    const allNodes = this.graph.getNodes();
    this.callbacks.onCanvasState({
      disconnectedCount: allNodes.filter((node) => readGraphNodeData(node).kind !== "start" && !reachable.has(node.id)).length,
      canvasEmpty: allNodes.filter((node) => readGraphNodeData(node).kind !== "start").length === 0,
    });
  }

  /**
   * @description 清除选中高亮。
   */
  private clearSelection(): void {
    if (!this.graph) return;
    this.graph.getNodes().forEach((node) => {
      const data = readGraphNodeData(node);
      node.attr("body/strokeWidth", data.kind === "condition" || data.kind === "action" ? 1.2 : 1.5);
    });
    this.graph.getEdges().forEach((edge) => edge.attr("line/strokeWidth", 1.8));
    this.selectedCellId = "";
    this.selectedRemovable = false;
    this.callbacks.onSelectionChange(false);
  }

  /**
   * @description 选中节点或边；开始节点不可删除。
   * @param cell 被点击单元。
   */
  private selectCell(cell: Cell): void {
    this.clearSelection();
    this.selectedCellId = cell.id;
    if (cell.isNode()) {
      const data = readGraphNodeData(cell);
      if (data.kind === "start") {
        this.selectedRemovable = false;
        this.callbacks.onSelectionChange(false);
        return;
      }
      cell.attr("body/strokeWidth", 2.4);
      this.selectedRemovable = true;
      this.callbacks.onSelectionChange(true);
      return;
    }
    if (cell.isEdge()) {
      cell.attr("line/strokeWidth", 3);
      this.selectedRemovable = true;
      this.callbacks.onSelectionChange(true);
    }
  }

  /**
   * @description 删除边并回写文档。
   * @param edgeId 边标识。
   */
  private removeEdge(edgeId: string): void {
    if (!this.graph) return;
    this.syncingGraph = true;
    this.graph.removeEdge(edgeId);
    this.syncingGraph = false;
    this.clearSelection();
    this.commitGraph();
  }

  /**
   * @description 删除非开始节点；行为节点单入单出时自动桥接。
   * @param nodeId 节点标识。
   */
  private removeNode(nodeId: string): void {
    if (!this.graph) return;
    const node = this.graph.getCellById(nodeId);
    if (!node?.isNode()) return;
    const data = readGraphNodeData(node);
    if (data.kind === "start") {
      this.rejectConnection("规则开始节点不可删除");
      return;
    }
    const inEdges = this.graph.getIncomingEdges(node) || [];
    const outEdges = this.graph.getOutgoingEdges(node) || [];
    this.syncingGraph = true;
    this.graph.removeNode(nodeId);
    if (data.kind === "action" && inEdges.length === 1 && outEdges.length === 1) {
      const incoming = inEdges[0];
      const outgoing = outEdges[0];
      const sourceCellId = incoming?.getSourceCellId();
      const sourcePort = incoming?.getSourcePortId();
      const targetCellId = outgoing?.getTargetCellId();
      const targetPort = outgoing?.getTargetPortId();
      if (sourceCellId && sourcePort && targetCellId && targetPort) {
        addGraphEdge(this.createCellContext(null), {
          sourceId: sourceCellId,
          sourcePort,
          targetId: targetCellId,
          targetPort,
        });
      }
    }
    this.syncingGraph = false;
    this.clearSelection();
    this.commitGraph();
  }

  /**
   * @description 记录连线失败原因并在数秒后清除。
   * @param message 提示文案。
   * @returns 始终为 false，供校验回调使用。
   */
  private rejectConnection(message: string): boolean {
    this.callbacks.onConnectionMessage(message);
    window.clearTimeout(this.messageTimer);
    this.messageTimer = window.setTimeout(() => {
      this.callbacks.onConnectionMessage("");
    }, 3200);
    return false;
  }

  /**
   * @description 判断新连线是否会形成环。
   * @param sourceId 源节点。
   * @param targetId 目标节点。
   * @returns 是否成环。
   */
  private wouldCreateCycle(sourceId: string, targetId: string): boolean {
    if (!this.graph) return false;
    const adjacency = new Map<string, string[]>();
    this.graph.getEdges().forEach((edge) => {
      const source = edge.getSourceCellId();
      const target = edge.getTargetCellId();
      if (!source || !target) return;
      const next = adjacency.get(source) ?? [];
      next.push(target);
      adjacency.set(source, next);
    });
    const stack = [...(adjacency.get(targetId) ?? [])];
    const seen = new Set<string>();
    while (stack.length) {
      const currentId = stack.pop();
      if (!currentId || seen.has(currentId)) continue;
      if (currentId === sourceId) return true;
      seen.add(currentId);
      stack.push(...(adjacency.get(currentId) ?? []));
    }
    return false;
  }

  /**
   * @description 校验连线必须接入输入端口、不能连到开始节点、不能成环。
   * @param sourceCell 源单元。
   * @param targetCell 目标单元。
   * @param _sourcePort 源端口。
   * @param targetPort 目标端口。
   * @returns 是否允许连接。
   */
  private validateConnection(
    sourceCell: Cell | null | undefined,
    targetCell: Cell | null | undefined,
    _sourcePort: string | null | undefined,
    targetPort: string | null | undefined,
  ): boolean {
    if (!sourceCell?.isNode() || !targetCell?.isNode() || !targetPort) {
      return this.rejectConnection("请从输出端口拖到输入端口");
    }
    const targetGroup = targetCell.getPort(targetPort)?.group;
    if (targetGroup !== PORT_IN) {
      return this.rejectConnection("连线必须接入节点左侧的输入端口");
    }
    if (readGraphNodeData(targetCell).kind === "start") {
      return this.rejectConnection("规则开始节点不能作为连线目标");
    }
    if (sourceCell.id === targetCell.id) return this.rejectConnection("不允许连接节点自身");
    if (this.wouldCreateCycle(sourceCell.id, targetCell.id)) {
      return this.rejectConnection("该连线会形成循环依赖");
    }
    this.callbacks.onConnectionMessage("");
    return true;
  }
}
