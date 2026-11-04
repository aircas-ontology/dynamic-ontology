import * as d3 from "d3";
import type { OntologyRelationClass } from "@/types";
import { bindRelationGraph2dLinkNodes, buildRelationGraph2dData, type RelationGraph2dLink, type RelationGraph2dNode } from "../utils/buildRelationGraph2dData";
import { themeColor } from "../utils/themeColor";

interface SimulationNode extends RelationGraph2dNode, d3.SimulationNodeDatum {}

interface SimulationLink extends Omit<RelationGraph2dLink, "source" | "target">, d3.SimulationLinkDatum<SimulationNode> {
  source: SimulationNode;
  target: SimulationNode;
}

export interface RelationGraph2dApi {
  setData: (data: { items: OntologyRelationClass[]; seedNames: string[]; categoryColors?: Record<string, string> }) => void;
  resize: () => void;
  refreshTheme: () => void;
  dispose: () => void;
}

/**
 * @description 创建拥有独立资源与清理边界的二维关系图，主题刷新保留缩放与布局状态。
 * @param options 容器与关系菜单回调。
 * @returns 数据更新、主题刷新、尺寸调整和销毁接口。
 */
export function createRelationGraph2d(options: {
  container: HTMLElement;
  onEdgeContextMenu: (relationId: string, clientX: number, clientY: number) => void;
}): RelationGraph2dApi {
  const container = options.container;
  const root = d3.select(container).append("svg").attr("class", "relation-graph-2d__svg").attr("role", "img").attr("aria-label", "关系二维图");

  const defs = root.append("defs");
  defs
    .append("marker")
    .attr("id", "relation-graph-2d-arrow")
    .attr("viewBox", "0 -4 8 8")
    .attr("refX", 18)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-4L8,0L0,4")
    .attr("class", "relation-graph-2d__arrow");

  const viewport = root.append("g").attr("class", "relation-graph-2d__viewport");
  const linkLayer = viewport.append("g").attr("class", "relation-graph-2d__links");
  const labelLayer = viewport.append("g").attr("class", "relation-graph-2d__edge-labels");
  const nodeLayer = viewport.append("g").attr("class", "relation-graph-2d__nodes");

  let width = Math.max(container.clientWidth, 1);
  let height = Math.max(container.clientHeight, 1);
  let nodes: SimulationNode[] = [];
  let links: SimulationLink[] = [];
  let categoryColors: Record<string, string> = {};
  let hoveredRelationId: string | null = null;

  const zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.35, 2.8])
    .on("zoom", (event) => {
      viewport.attr("transform", event.transform.toString());
    });

  root.call(zoomBehavior).on("dblclick.zoom", null);

  const linkForce = d3
    .forceLink<SimulationNode, SimulationLink>([])
    .id((node) => node.id)
    .distance(118)
    .strength(0.55);

  const simulation = d3
    .forceSimulation<SimulationNode>()
    .force("link", linkForce)
    .force("charge", d3.forceManyBody<SimulationNode>().strength(-320))
    .force(
      "collide",
      d3.forceCollide<SimulationNode>().radius((node) => (node.isSeed ? 34 : 22)),
    )
    .force("center", d3.forceCenter(0, 0))
    .force("x", d3.forceX(0).strength(0.05))
    .force("y", d3.forceY(0).strength(0.05))
    .on("tick", () => {
      renderPositions();
    })
    .stop();

  /**
   * @description 根据主题令牌刷新箭头与描边颜色。
   */
  function applyThemeColors(): void {
    const stroke = themeColor("--aircas-color-primary") || "currentColor";
    defs.select(".relation-graph-2d__arrow").attr("fill", stroke);
  }

  /**
   * @description 同步 SVG 视口尺寸。
   */
  function resize(): void {
    width = Math.max(container.clientWidth, 1);
    height = Math.max(container.clientHeight, 1);
    root
      .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
      .attr("width", width)
      .attr("height", height);
  }

  /**
   * @description 根据当前仿真坐标更新边、标签与节点位置。
   */
  function renderPositions(): void {
    linkLayer.selectAll<SVGPathElement, SimulationLink>("path").attr("d", (link) => {
      const source = link.source;
      const target = link.target;
      if (source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) {
        return "";
      }
      return `M${source.x},${source.y}L${target.x},${target.y}`;
    });

    labelLayer
      .selectAll<SVGTextElement, SimulationLink>("text")
      .attr("x", (link) => {
        const source = link.source;
        const target = link.target;
        if (source.x === undefined || target.x === undefined) return 0;
        return (source.x + target.x) / 2;
      })
      .attr("y", (link) => {
        const source = link.source;
        const target = link.target;
        if (source.y === undefined || target.y === undefined) return 0;
        return (source.y + target.y) / 2;
      });

    nodeLayer.selectAll<SVGGElement, SimulationNode>("g").attr("transform", (node) => `translate(${node.x ?? 0},${node.y ?? 0})`);
  }

  /**
   * @description 按悬停状态更新边与标签透明度。
   */
  function applyHoverState(): void {
    linkLayer.selectAll<SVGPathElement, SimulationLink>("path").attr("opacity", (link) => {
      if (!hoveredRelationId) return 0.9;
      return link.relationId === hoveredRelationId ? 1 : 0.18;
    });
    labelLayer.selectAll<SVGTextElement, SimulationLink>("text").attr("opacity", (link) => {
      if (!hoveredRelationId) return 0.92;
      return link.relationId === hoveredRelationId ? 1 : 0.12;
    });
  }

  /**
   * @description 重建节点与边 DOM，并重启力导向仿真。
   */
  function renderGraph(): void {
    const linkSelection = linkLayer
      .selectAll<SVGPathElement, SimulationLink>("path")
      .data(links, (link) => link.id)
      .join("path")
      .attr("class", "relation-graph-2d__link")
      .attr("marker-end", "url(#relation-graph-2d-arrow)")
      .attr("stroke", (link) => categoryColors[link.categoryName] || themeColor("--aircas-color-primary") || "currentColor")
      .attr("stroke-width", 1.6)
      .attr("fill", "none")
      .attr("stroke-dasharray", "7 6")
      .style("cursor", "pointer")
      .on("pointerenter", (_event, link) => {
        hoveredRelationId = link.relationId;
        applyHoverState();
      })
      .on("pointerleave", () => {
        hoveredRelationId = null;
        applyHoverState();
      })
      .on("contextmenu", (event, link) => {
        event.preventDefault();
        event.stopPropagation();
        options.onEdgeContextMenu(link.relationId, event.clientX, event.clientY);
      });

    labelLayer
      .selectAll<SVGTextElement, SimulationLink>("text")
      .data(links, (link) => link.id)
      .join("text")
      .attr("class", "relation-graph-2d__edge-label")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.35em")
      .text((link) => (link.label.length > 10 ? `${link.label.slice(0, 9)}…` : link.label));

    const dragBehavior = d3
      .drag<SVGGElement, SimulationNode>()
      .on("start", (event, node) => {
        if (!event.active) simulation.alphaTarget(0.28).restart();
        node.fx = node.x;
        node.fy = node.y;
      })
      .on("drag", (event, node) => {
        node.fx = event.x;
        node.fy = event.y;
      })
      .on("end", (event, node) => {
        if (!event.active) simulation.alphaTarget(0);
        if (!node.isSeed) {
          node.fx = null;
          node.fy = null;
        }
      });

    const nodeSelection = nodeLayer
      .selectAll<SVGGElement, SimulationNode>("g")
      .data(nodes, (node) => node.id)
      .join((enter) => {
        const group = enter.append("g").attr("class", "relation-graph-2d__node").attr("role", "button").attr("tabindex", 0).call(dragBehavior);
        group.append("circle").attr("class", "relation-graph-2d__node-halo");
        group.append("circle").attr("class", "relation-graph-2d__node-bg");
        group.append("text").attr("class", "relation-graph-2d__node-label");
        group.append("title");
        return group;
      });

    nodeSelection.attr("aria-label", (node) => node.label);
    nodeSelection
      .select<SVGCircleElement>(".relation-graph-2d__node-halo")
      .attr("r", (node) => (node.isSeed ? 28 : 0))
      .attr("fill", themeColor("--aircas-color-effect-primary-soft") || "transparent")
      .style("display", (node) => (node.isSeed ? null : "none"));
    nodeSelection
      .select<SVGCircleElement>(".relation-graph-2d__node-bg")
      .attr("r", (node) => (node.isSeed ? 16 : 11))
      .attr("fill", (node) =>
        node.isSeed ? themeColor("--aircas-color-primary") || "currentColor" : themeColor("--aircas-color-panel-background-deep") || "#0b2230",
      )
      .attr("stroke", (node) => themeColor(node.isSeed ? "--aircas-color-primary" : "--aircas-color-border") || "currentColor")
      .attr("stroke-width", (node) => (node.isSeed ? 2 : 1.2));
    nodeSelection
      .select<SVGTextElement>(".relation-graph-2d__node-label")
      .attr("dy", (node) => (node.isSeed ? 30 : 24))
      .attr("text-anchor", "middle")
      .attr("fill", themeColor("--aircas-color-text-primary") || "currentColor")
      .text((node) => (node.label.length > 14 ? `${node.label.slice(0, 13)}…` : node.label));
    nodeSelection.select("title").text((node) => `${node.label} · ${node.degree} 条关联`);

    void linkSelection;
    simulation.stop();
    simulation.nodes(nodes);
    linkForce.links(links);
    nodes.forEach((node, index) => {
      if (node.isSeed) {
        node.fx = 0;
        node.fy = 0;
        node.x = node.x ?? 0;
        node.y = node.y ?? 0;
        return;
      }
      if (node.x === undefined || node.y === undefined) {
        const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2;
        const radius = 120 + (node.degree || 1) * 12;
        node.x = Math.cos(angle) * radius;
        node.y = Math.sin(angle) * radius;
      }
      node.fx = null;
      node.fy = null;
    });
    simulation.alpha(1).restart();
    applyHoverState();
  }

  /**
   * @description 用关系列表重建图数据并刷新渲染。
   * @param data 关系项、种子名与可选分类色。
   */
  function setData(data: { items: OntologyRelationClass[]; seedNames: string[]; categoryColors?: Record<string, string> }): void {
    categoryColors = data.categoryColors ?? {};
    const graph = buildRelationGraph2dData(data.items, data.seedNames);
    const previous = new Map(nodes.map((node) => [node.id, node]));
    nodes = graph.nodes.map((node) => {
      const prior = previous.get(node.id);
      return {
        ...node,
        x: prior?.x,
        y: prior?.y,
        vx: prior?.vx ?? 0,
        vy: prior?.vy ?? 0,
        fx: node.isSeed ? 0 : null,
        fy: node.isSeed ? 0 : null,
      };
    });
    links = bindRelationGraph2dLinkNodes(nodes, graph.links);
    applyThemeColors();
    renderGraph();
  }

  /**
   * @description 主题切换后刷新颜色，不重置镜头与节点坐标。
   */
  function refreshTheme(): void {
    applyThemeColors();
    renderGraph();
  }

  /**
   * @description 停止仿真并移除 SVG 与缩放监听。
   */
  function dispose(): void {
    simulation.stop();
    root.on(".zoom", null);
    root.remove();
    nodes = [];
    links = [];
  }

  resize();
  applyThemeColors();
  root.call(zoomBehavior.transform, d3.zoomIdentity);

  return {
    setData,
    resize,
    refreshTheme,
    dispose,
  };
}
