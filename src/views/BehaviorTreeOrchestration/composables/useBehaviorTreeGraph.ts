import { onBeforeUnmount, watch, type Ref } from "vue";
import { Graph } from "@antv/x6";
import type { BehaviorTreeDragPayload, BehaviorTreeKindMeta, BehaviorTreeModel, BehaviorTreeNodeDraft, BehaviorTreeNodeKind } from "@/types";
import { BEHAVIOR_TREE_DRAG_MIME, BEHAVIOR_TREE_NODE_H, BEHAVIOR_TREE_NODE_W } from "../utils/behaviorTreeConstants.ts";
import { forEachBehaviorTreeNode, findBehaviorTreeParent } from "../utils/behaviorTreeModel.ts";

/**
 * @description 节点画布样式。
 * @param kind 节点 kind。
 * @param category 类别。
 * @param selected 是否选中。
 * @returns 填充与描边。
 */
function resolveNodeStyle(kind: BehaviorTreeNodeKind, category: string, selected: boolean): { fill: string; stroke: string; strokeWidth: number } {
  let fill = "#1f3a5f";
  let stroke = "#4f7ed6";
  if (kind === "ACTION") {
    fill = "#3d2e14";
    stroke = "#e8a33d";
  } else if (kind === "BLACKBOARD_CONDITION" || kind === "CONDITION") {
    fill = "#1d3a28";
    stroke = "#4aa564";
  } else if (category === "DECORATOR") {
    fill = "#2c2148";
    stroke = "#8c6bd8";
  }
  if (selected) stroke = "#ff7a45";
  return { fill, stroke, strokeWidth: selected ? 2.4 : 1.4 };
}

/**
 * @description 截断展示文本。
 * @param text 原文。
 * @param max 最大长度。
 * @returns 截断后文本。
 */
function truncateText(text: string, max: number): string {
  const value = text.trim();
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * @description 节点副标题。
 * @param node 节点。
 * @param model 模型。
 * @param kindMeta kind 元信息。
 * @returns 副标题。
 */
function buildSubtitle(node: BehaviorTreeNodeDraft, model: BehaviorTreeModel, kindMeta: Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>): string {
  const draft = node.config || {};
  let summary = "";
  switch (node.kind) {
    case "SELECTOR":
    case "SEQUENCE":
      summary = draft.runMode || "";
      break;
    case "PARALLEL":
      summary = draft.policy || "";
      break;
    case "REPEATER":
      summary = `${draft.loopMode || ""}${draft.times ? ` ×${draft.times}` : ""}`;
      break;
    case "ACTION":
      summary = draft.actionApi || "未绑定行为";
      break;
    case "BLACKBOARD_CONDITION":
      summary = `${draft.key || "?"} ${draft.op || ""}`;
      break;
    case "CONDITION":
      summary = draft.expression || "";
      break;
    default:
      summary = "";
  }
  const parent = findBehaviorTreeParent(model.roots, node.id);
  const order =
    parent && kindMeta[parent.kind].category === "COMPOSITE" && parent.children.length > 1
      ? `#${parent.children.findIndex((child) => child.id === node.id) + 1} `
      : "";
  return `${order}${kindMeta[node.kind].name}${summary ? ` · ${summary}` : ""}`;
}

export interface UseBehaviorTreeGraphOptions {
  containerRef: Ref<HTMLElement | null>;
  model: BehaviorTreeModel;
  kindMeta: Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>;
  selectedId: Ref<string | null>;
  revision: Ref<number>;
  onSelect: (id: string | null) => void;
  onConnect: (parentId: string, childId: string) => void;
  onDrop: (payload: BehaviorTreeDragPayload, parentId: string | null, point: { x: number; y: number }) => void;
  onNodeMoved: (id: string, x: number, y: number) => void;
}

/**
 * @description 创建并维护行为树 X6 图实例；与概念模型画布一样保持 Graph 在 Vue 响应式外。
 * @param options 绑定选项。
 * @returns 适应画布与销毁方法。
 */
export function useBehaviorTreeGraph(options: UseBehaviorTreeGraphOptions) {
  let graph: Graph | null = null;

  /**
   * @description 初始化 Graph。
   */
  function initBehaviorTreeGraph(): void {
    const container = options.containerRef.value;
    if (!container || graph) return;
    graph = new Graph({
      container,
      autoResize: true,
      background: { color: "transparent" },
      grid: { visible: true, type: "dot", size: 12, args: { color: "rgba(148,163,184,0.35)" } },
      panning: true,
      mousewheel: { enabled: true, modifiers: ["ctrl", "meta"], minScale: 0.4, maxScale: 2 },
      connecting: {
        allowBlank: false,
        allowLoop: false,
        allowMulti: false,
        allowNode: true,
        allowEdge: false,
        highlight: true,
        snap: { radius: 40 },
        anchor: "center",
        connectionPoint: "anchor",
      },
      interacting: { edgeMovable: false, vertexMovable: false, arrowheadMovable: false, edgeLabelMovable: false },
    });

    graph.on("node:click", ({ node }) => options.onSelect(node.id));
    graph.on("blank:click", () => options.onSelect(null));
    graph.on("node:moved", ({ node }) => {
      const pos = node.position();
      options.onNodeMoved(node.id, pos.x, pos.y);
    });
    graph.on("edge:connected", ({ edge }) => {
      if (!edge || !graph) return;
      const sourceId = edge.getSourceCellId();
      const targetId = edge.getTargetCellId();
      const tempId = edge.id;
      window.setTimeout(() => {
        if (graph?.getCellById(tempId)) graph.removeCell(tempId);
        if (sourceId && targetId) options.onConnect(sourceId, targetId);
      }, 0);
    });

    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);
    syncBehaviorTreeGraph();
  }

  /**
   * @description 拖拽经过画布。
   * @param event 拖拽事件。
   */
  function handleDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  }

  /**
   * @description 解析拖拽载荷。
   * @param event 拖拽事件。
   * @returns 载荷。
   */
  function readDragPayload(event: DragEvent): BehaviorTreeDragPayload | null {
    const raw = event.dataTransfer?.getData(BEHAVIOR_TREE_DRAG_MIME) || event.dataTransfer?.getData("text/plain") || "";
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as BehaviorTreeDragPayload;
      return parsed?.kind ? parsed : null;
    } catch {
      return { kind: raw as BehaviorTreeNodeKind };
    }
  }

  /**
   * @description 处理画布 drop。
   * @param event 拖拽事件。
   */
  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    if (!graph) return;
    const payload = readDragPayload(event);
    if (!payload?.kind) return;
    let point = { x: 40, y: 40 };
    try {
      point = graph.clientToLocal(event.clientX, event.clientY);
    } catch {
      /* 忽略 */
    }
    const hit = graph.getNodes().find((node) => {
      const box = node.getBBox();
      return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
    });
    options.onDrop(payload, hit?.id ?? null, point);
  }

  /**
   * @description 增量同步模型到画布。
   */
  function syncBehaviorTreeGraph(): void {
    if (!graph) return;
    const wantedNodes = new Map<string, BehaviorTreeNodeDraft>();
    const wantedEdges = new Map<string, { parent: string; child: string }>();
    forEachBehaviorTreeNode(options.model.roots, (node) => {
      wantedNodes.set(node.id, node);
      node.children.forEach((child) => {
        wantedEdges.set(`edge:${node.id}:${child.id}`, { parent: node.id, child: child.id });
      });
    });

    graph
      .getCells()
      .slice()
      .forEach((cell) => {
        const keep = cell.isNode() ? wantedNodes.has(cell.id) : wantedEdges.has(cell.id);
        if (!keep) graph?.removeCell(cell);
      });

    wantedNodes.forEach((node) => {
      const style = resolveNodeStyle(node.kind, options.kindMeta[node.kind].category, node.id === options.selectedId.value);
      const existing = graph?.getCellById(node.id);
      const title = truncateText(node.displayName || options.kindMeta[node.kind].name, 20);
      const subtitle = truncateText(buildSubtitle(node, options.model, options.kindMeta), 30);
      if (!existing) {
        graph?.addNode({
          id: node.id,
          shape: "rect",
          x: node._x,
          y: node._y,
          width: BEHAVIOR_TREE_NODE_W,
          height: BEHAVIOR_TREE_NODE_H,
          zIndex: 2,
          ports: {
            groups: {
              out: {
                position: "bottom",
                attrs: {
                  circle: { r: 4.5, magnet: true, stroke: style.stroke, strokeWidth: 1.4, fill: "#fff", cursor: "crosshair" },
                },
              },
            },
            items: [{ group: "out" }],
          },
          markup: [
            { tagName: "rect", selector: "body" },
            { tagName: "text", selector: "title" },
            { tagName: "text", selector: "subtitle" },
          ],
          attrs: {
            body: { refWidth: "100%", refHeight: "100%", rx: 8, ry: 8, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth, cursor: "move" },
            title: {
              refX: "50%",
              refY: "38%",
              textAnchor: "middle",
              textVerticalAnchor: "middle",
              fontSize: 13,
              fontWeight: 600,
              fill: "#e8eef7",
              text: title,
            },
            subtitle: {
              refX: "50%",
              refY: "68%",
              textAnchor: "middle",
              textVerticalAnchor: "middle",
              fontSize: 10,
              fill: "#9fb0c3",
              text: subtitle,
            },
          },
        });
        return;
      }
      if (!existing.isNode()) return;
      existing.position(node._x, node._y);
      existing.attr("body/fill", style.fill);
      existing.attr("body/stroke", style.stroke);
      existing.attr("body/strokeWidth", style.strokeWidth);
      existing.attr("title/text", title);
      existing.attr("subtitle/text", subtitle);
    });

    wantedEdges.forEach((edge, id) => {
      if (graph?.getCellById(id)) return;
      graph?.addEdge({
        id,
        source: { cell: edge.parent },
        target: { cell: edge.child },
        zIndex: 1,
        attrs: { line: { stroke: "#7b8ea3", strokeWidth: 1.4, targetMarker: { name: "block", size: 6, fill: "#7b8ea3" } } },
        router: { name: "orth" },
        connector: { name: "rounded", args: { radius: 8 } },
      });
    });
  }

  /**
   * @description 适应画布。
   */
  function fitBehaviorTreeView(): void {
    if (!graph) return;
    window.setTimeout(() => {
      try {
        graph?.zoomToFit({ padding: 40, maxScale: 1 });
      } catch {
        /* 空图 */
      }
    }, 0);
  }

  /**
   * @description 销毁图实例。
   */
  function disposeBehaviorTreeGraph(): void {
    const container = options.containerRef.value;
    container?.removeEventListener("dragover", handleDragOver);
    container?.removeEventListener("drop", handleDrop);
    graph?.dispose();
    graph = null;
  }

  watch(
    () => [options.revision.value, options.selectedId.value, options.containerRef.value] as const,
    ([, , container]) => {
      if (container && !graph) initBehaviorTreeGraph();
      else syncBehaviorTreeGraph();
    },
    { flush: "post" },
  );

  onBeforeUnmount(() => {
    disposeBehaviorTreeGraph();
  });

  return {
    initBehaviorTreeGraph,
    syncBehaviorTreeGraph,
    fitBehaviorTreeView,
    disposeBehaviorTreeGraph,
  };
}
