import { Graph, Shape, type Edge } from "@antv/x6";

export const CONCEPTUAL_OBJECT_SHAPE = "conceptual-model-object";
export const CONCEPTUAL_OBJECT_WIDTH = 240;
export const CONCEPTUAL_RELATION_PORTS = ["top", "right", "bottom", "left"] as const;

export type ConceptualModelGraphPort = (typeof CONCEPTUAL_RELATION_PORTS)[number];

export interface ConceptualModelGraphAttribute {
  id: number;
  displayName: string;
  apiName: string;
  dataType: string;
}

export interface ConceptualModelGraphObject {
  id: number;
  displayName: string;
  apiName: string;
  description: string;
  x: number;
  y: number;
  attributes: ConceptualModelGraphAttribute[];
}

export interface ConceptualModelGraphRelation {
  id: number;
  displayName: string;
  apiName: string;
  sourceId: number | null;
  targetId: number | null;
  sourcePort: ConceptualModelGraphPort | null;
  targetPort: ConceptualModelGraphPort | null;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
}

export interface ConceptualModelGraphSelection {
  kind: "object" | "attribute" | "relation";
  id: number;
}

export interface ConceptualModelHtmlHandlers {
  onSelectObject: (objectId: number) => void;
  onSelectAttribute: (objectId: number, attributeId: number) => void;
  onAddAttribute: (objectId: number) => void;
}

interface ConceptualModelNodeData {
  object: ConceptualModelGraphObject;
  selected: boolean;
  selectedAttributeId: number | null;
}

const HEADER_HEIGHT = 64;
const ROW_HEIGHT = 26;
const FOOTER_HEIGHT = 32;
const ENDPOINT_HANDLE = "M 0 -7 a 7 7 0 1 1 0 14 a 7 7 0 1 1 0 -14";

let htmlHandlers: ConceptualModelHtmlHandlers | null = null;

/**
 * @description 设置对象节点 HTML 上的选择和添加属性回调。
 * @param handlers 回调集合；卸载时传 null。
 */
export function setConceptualModelHtmlHandlers(handlers: ConceptualModelHtmlHandlers | null): void {
  htmlHandlers = handlers;
}

/**
 * @description 生成对象节点在图中的 id。
 * @param id 页面对象 id。
 * @returns 图节点 id。
 */
export function conceptualObjectCellId(id: number): string {
  return `obj-${id}`;
}

/**
 * @description 生成关系边在图中的 id。
 * @param id 页面关系 id。
 * @returns 图边 id。
 */
export function conceptualRelationCellId(id: number): string {
  return `rel-${id}`;
}

/**
 * @description 从图节点 id 解析页面对象 id。
 * @param cellId 图节点 id。
 * @returns 页面对象 id；不是对象节点时返回 null。
 */
export function parseConceptualObjectCellId(cellId: string | undefined): number | null {
  const matched = /^obj-(\d+)$/.exec(cellId ?? "");
  return matched ? Number(matched[1]) : null;
}

/**
 * @description 从图边 id 解析页面关系 id。
 * @param cellId 图边 id。
 * @returns 页面关系 id；不是关系边时返回 null。
 */
export function parseConceptualRelationCellId(cellId: string | undefined): number | null {
  const matched = /^rel-(\d+)$/.exec(cellId ?? "");
  return matched ? Number(matched[1]) : null;
}

/**
 * @description 判断连接点名称是否为四边端口。
 * @param value 端口名称。
 * @returns 合法端口或 undefined。
 */
export function asRelationPort(value: string | null | undefined): ConceptualModelGraphPort | undefined {
  if (value === "top" || value === "right" || value === "bottom" || value === "left") return value;
  return undefined;
}

/**
 * @description 按属性数量计算对象节点高度。
 * @param attributeCount 属性条数。
 * @returns 节点高度。
 */
export function conceptualObjectHeight(attributeCount: number): number {
  return HEADER_HEIGHT + Math.max(attributeCount, 1) * ROW_HEIGHT + FOOTER_HEIGHT;
}

/**
 * @description 把关系端点解析为对象端口或自由坐标。
 * @param relation 关系。
 * @param end 源端或目标端。
 * @param objectIds 当前对象 id 集合。
 * @returns X6 端点。
 */
export function relationTerminal(
  relation: ConceptualModelGraphRelation,
  end: "source" | "target",
  objectIds: Set<number>,
): { cell: string; port: string } | { x: number; y: number } {
  const objectId = end === "source" ? relation.sourceId : relation.targetId;
  const otherId = end === "source" ? relation.targetId : relation.sourceId;
  const port = end === "source" ? (relation.sourcePort ?? "right") : (relation.targetPort ?? "left");
  if (objectId !== null && objectIds.has(objectId) && objectId !== otherId) {
    return { cell: conceptualObjectCellId(objectId), port };
  }
  return end === "source" ? relation.sourcePoint : relation.targetPoint;
}

/**
 * @description 自由端离开已连接对象一点，避免和端口重叠。
 * @param edge 关系边。
 * @param graph 图实例。
 * @param connectedEnd 已连接到对象的一端。
 * @returns 调整后的自由端坐标。
 */
export function nudgeFreeRelationEnd(edge: Edge, graph: Graph, connectedEnd: "source" | "target"): { x: number; y: number } | null {
  const cellId = connectedEnd === "source" ? edge.getSourceCellId() : edge.getTargetCellId();
  const node = cellId ? graph.getCellById(cellId) : null;
  if (!node?.isNode()) return null;
  const box = node.getBBox();
  const freePoint = connectedEnd === "source" ? edge.getTargetPoint() : edge.getSourcePoint();
  const next = {
    x: Math.round(freePoint.x),
    y: Math.round(box.y + box.height + 36),
  };
  if (connectedEnd === "source") edge.setTarget(next);
  else edge.setSource(next);
  return next;
}

/**
 * @description 为关系边挂上可拖动的源端和目标端圆点。
 * @param edge 关系边。
 * @param visible 是否显示圆点。
 * @param force 是否强制重建。
 */
export function applyRelationEdgeTools(edge: Edge, visible: boolean, force = false): void {
  const hasTools = edge.hasTools();
  if (!force && visible && hasTools) return;
  if (!force && !visible && !hasTools) return;
  edge.removeTools();
  if (!visible) return;
  edge.addTools([
    {
      name: "source-arrowhead",
      args: {
        attrs: {
          d: ENDPOINT_HANDLE,
          fill: "var(--aircas-color-accent-cyan)",
          stroke: "var(--aircas-color-panel-background)",
          strokeWidth: 2,
          cursor: "move",
        },
      },
    },
    {
      name: "target-arrowhead",
      args: {
        attrs: {
          d: ENDPOINT_HANDLE,
          fill: "var(--aircas-color-accent-purple)",
          stroke: "var(--aircas-color-panel-background)",
          strokeWidth: 2,
          cursor: "move",
        },
      },
    },
  ]);
}

/**
 * @description 关系边的线条样式。
 * @returns X6 边属性。
 */
export function conceptualEdgeAttrs() {
  return {
    line: {
      stroke: "var(--aircas-color-accent-cyan)",
      strokeWidth: 2,
      sourceMarker: null,
      targetMarker: {
        name: "block",
        width: 12,
        height: 8,
        fill: "var(--aircas-color-accent-cyan)",
      },
    },
  };
}

/**
 * @description 关系边标签。
 * @param text 标签文案。
 * @returns X6 标签配置。
 */
export function conceptualEdgeLabel(text: string) {
  return {
    attrs: {
      label: {
        text,
        fill: "var(--aircas-color-text-primary)",
        fontSize: 12,
        fontWeight: 600,
        pointerEvents: "none",
      },
      body: {
        ref: "label",
        fill: "var(--aircas-color-panel-background)",
        stroke: "var(--aircas-color-accent-cyan)",
        strokeWidth: 1,
        rx: 4,
        ry: 4,
        refWidth: "140%",
        refHeight: "160%",
        refX: "-20%",
        refY: "-30%",
        pointerEvents: "none",
      },
    },
  };
}

/**
 * @description 创建概念模型图。连接点可拖出多条关系，不能连回自身。
 * @param container 画布容器。
 * @returns X6 图实例。
 */
export function createConceptualModelGraph(container: HTMLElement): Graph {
  registerConceptualModelShapes();
  return new Graph({
    container,
    autoResize: true,
    background: { color: "transparent" },
    grid: {
      visible: true,
      size: 16,
      type: "doubleMesh",
      args: [
        { color: "var(--aircas-color-grid-line)", thickness: 1 },
        { color: "var(--aircas-color-border-soft)", thickness: 1, factor: 5 },
      ],
    },
    interacting: {
      nodeMovable: true,
      edgeMovable: false,
      arrowheadMovable: true,
      vertexMovable: false,
      edgeLabelMovable: false,
    },
    embedding: false,
    panning: { enabled: true, eventTypes: ["rightMouseDown", "mouseWheel"] },
    mousewheel: { enabled: true, modifiers: ["ctrl", "meta"], minScale: 0.35, maxScale: 2.2, factor: 1.08 },
    highlighting: {
      magnetAvailable: {
        name: "stroke",
        args: { attrs: { stroke: "var(--aircas-color-accent-cyan)", "stroke-width": 3, opacity: 0.85 } },
      },
      magnetAdsorbed: {
        name: "stroke",
        args: { attrs: { stroke: "var(--aircas-color-accent-cyan)", "stroke-width": 4 } },
      },
    },
    connecting: {
      snap: { radius: 28 },
      allowBlank: true,
      allowLoop: false,
      allowNode: false,
      allowEdge: false,
      allowPort: true,
      allowMulti: true,
      highlight: true,
      validateMagnet({ magnet }) {
        return Boolean(asRelationPort(magnet.getAttribute("port") || undefined));
      },
      validateConnection({ sourceCell, targetCell, sourcePort, targetPort }) {
        if (sourceCell && targetCell && sourceCell.id === targetCell.id) return false;
        if (sourceCell?.isNode() && !asRelationPort(sourcePort)) return false;
        if (targetCell?.isNode() && !asRelationPort(targetPort)) return false;
        return true;
      },
      anchor: { name: "center" },
      connectionPoint: { name: "anchor" },
      router: { name: "normal" },
      connector: { name: "normal" },
      createEdge() {
        return this.createEdge({
          router: { name: "normal" },
          connector: { name: "normal" },
          attrs: conceptualEdgeAttrs(),
          labels: [conceptualEdgeLabel("关系")],
          zIndex: 0,
        });
      },
    },
  });
}

/**
 * @description 转义写入对象节点 HTML 的文本。
 * @param value 原始文本。
 * @returns 转义后的文本。
 */
function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * @description 渲染对象节点内容，并绑定属性选择和添加属性。
 * @param data 节点数据。
 * @returns 节点根元素。
 */
function renderObjectHtml(data: ConceptualModelNodeData): HTMLElement {
  const wrap = document.createElement("div");
  const object = data.object;
  wrap.className = `conceptual-model-node${data.selected ? " is-selected" : ""}`;
  const rows = object.attributes.length
    ? object.attributes
        .map((attribute) => {
          const active = data.selectedAttributeId === attribute.id ? " is-active" : "";
          return `<button type="button" class="conceptual-model-node__attr${active}" data-attribute-id="${attribute.id}"><span>+ ${escapeHtml(attribute.displayName || attribute.apiName)}</span><em>${escapeHtml(attribute.dataType)}</em></button>`;
        })
        .join("")
    : `<div class="conceptual-model-node__empty">将属性拖到此处，或点击下方添加</div>`;
  wrap.innerHTML = `
    <div class="conceptual-model-node__head">
      <span class="conceptual-model-node__stereo">&lt;&lt;object&gt;&gt;</span>
      <strong>${escapeHtml(object.displayName || "未命名对象")}</strong>
      <em>${escapeHtml(object.apiName || "apiName")}</em>
    </div>
    <div class="conceptual-model-node__attrs">${rows}</div>
    <button type="button" class="conceptual-model-node__add" data-action="add-attribute">添加属性</button>
  `;
  wrap.addEventListener("mousedown", (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.closest("[data-action='add-attribute'], [data-attribute-id]")) event.stopPropagation();
  });
  wrap.addEventListener("click", (event) => {
    event.stopPropagation();
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.closest("[data-action='add-attribute']")) {
      htmlHandlers?.onAddAttribute(object.id);
      return;
    }
    const attributeEl = target?.closest("[data-attribute-id]");
    if (attributeEl instanceof HTMLElement && attributeEl.dataset.attributeId) {
      htmlHandlers?.onSelectAttribute(object.id, Number(attributeEl.dataset.attributeId));
      return;
    }
    htmlHandlers?.onSelectObject(object.id);
  });
  return wrap;
}

/**
 * @description 四边连接点分组。
 * @param position 端口方位。
 * @param dx 水平偏移。
 * @param dy 垂直偏移。
 * @returns X6 端口分组。
 */
function edgePortGroup(position: ConceptualModelGraphPort, dx: number, dy: number) {
  return {
    position: { name: position, args: { dx, dy } },
    attrs: {
      circle: {
        r: 6,
        magnet: true,
        stroke: "var(--aircas-color-accent-cyan)",
        strokeWidth: 2,
        fill: "var(--aircas-color-panel-background)",
        style: { cursor: "crosshair" },
      },
    },
  };
}

/**
 * @description 注册对象 HTML 形状；重复注册时忽略。
 */
function registerConceptualModelShapes(): void {
  try {
    Shape.HTML.register({
      shape: CONCEPTUAL_OBJECT_SHAPE,
      width: CONCEPTUAL_OBJECT_WIDTH,
      height: conceptualObjectHeight(0),
      effect: ["data"],
      html(cell) {
        return renderObjectHtml(cell.getData<ConceptualModelNodeData>());
      },
      ports: {
        groups: {
          top: edgePortGroup("top", 0, -8),
          right: edgePortGroup("right", 8, 0),
          bottom: edgePortGroup("bottom", 0, 8),
          left: edgePortGroup("left", -8, 0),
        },
        items: CONCEPTUAL_RELATION_PORTS.map((id) => ({ id, group: id })),
      },
    });
  } catch {
    // 热更新时形状可能已经注册。
  }
}
