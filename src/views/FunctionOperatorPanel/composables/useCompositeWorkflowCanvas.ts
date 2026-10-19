import { markRaw, onUnmounted, ref, shallowRef, type Ref, type ShallowRef } from "vue";
import LogicFlow from "@logicflow/core";
import { ElMessage } from "element-plus";

import { getOntologyFunctionDetailInterface } from "@/apis";
import type {
  CompositeWorkflowBranchConfig,
  CompositeWorkflowDndPayload,
  CompositeWorkflowInputBinding,
  CompositeWorkflowLoopConfig,
  CompositeWorkflowNodeKind,
  CompositeWorkflowParamBrief,
  CompositeWorkflowTransformConfig,
} from "@/types";
import { buildCompositeWorkflowLiteFlowEl } from "../utils/compositeWorkflowLiteFlowEl.ts";
import {
  buildCompositeWorkflowSavePayload,
  buildDefaultCompositeWorkflowInputBindings,
  hasCompositeWorkflowIncomingEdge,
  mapCompositeWorkflowDetailParamBriefs,
  repairCompositeWorkflowInputBindings,
  validateCompositeWorkflowForSave,
  wouldCompositeWorkflowEdgeCreateCycle,
  type CompositeWorkflowGraphEdge,
  type CompositeWorkflowGraphNodeSummary,
} from "../utils/compositeWorkflowGraph.ts";
import { COMPOSITE_WORKFLOW_ANCHOR_SNAP_DISTANCE } from "../utils/compositeWorkflowAnchors.ts";
import { registerCompositeWorkflowNodes, resolveCompositeWorkflowLfNodeType } from "../utils/registerCompositeWorkflowNodes.ts";

/** 画布打开函数节点配置时的上下文。 */
export interface CompositeWorkflowFunctionNodeEditContext {
  nodeId: string;
  functionApi: string;
  version: string;
  displayName: string;
  inputBindings: CompositeWorkflowInputBinding[];
  paramsSnapshot?: { inputs: CompositeWorkflowParamBrief[]; outputs: CompositeWorkflowParamBrief[] };
  hasUpstream: boolean;
  upstreamOutputs: CompositeWorkflowParamBrief[];
}

/** 画布打开逻辑节点配置时的上下文。 */
export interface CompositeWorkflowLogicNodeEditContext {
  nodeId: string;
  kind: "loop" | "branch" | "transform";
  loopConfig?: CompositeWorkflowLoopConfig;
  branchConfig?: CompositeWorkflowBranchConfig;
  transformConfig?: CompositeWorkflowTransformConfig;
}

/**
 * @description 编排画布 LogicFlow 实例生命周期、DnD、连线约束与保存。
 * @param options 画布选项。
 * @returns 画布操作与配置弹框状态。
 */
export function useCompositeWorkflowCanvas(options: { displayName: Ref<string>; functionApi: Ref<string>; version: Ref<string>; spaceId: Ref<number> }) {
  const canvasHostRef = ref<HTMLElement | null>(null);
  const lfRef: ShallowRef<LogicFlow | null> = shallowRef(null);
  const zoomPercent = ref(100);
  const functionNodeEdit = ref<CompositeWorkflowFunctionNodeEditContext | null>(null);
  const logicNodeEdit = ref<CompositeWorkflowLogicNodeEditContext | null>(null);
  /** 侧栏 DnD 刚落点添加节点时为 true，供 click 防重复消费。 */
  const sidebarDndAddedNode = ref(false);
  let disposed = false;
  let canvasResizeObserver: ResizeObserver | null = null;

  /**
   * @description 读取当前图边列表。
   * @returns 边摘要。
   */
  function readGraphEdges(): CompositeWorkflowGraphEdge[] {
    const lf = lfRef.value;
    if (!lf) {
      return [];
    }
    const raw = lf.getGraphRawData();
    return (raw.edges ?? []).map((edge) => {
      const properties = (edge.properties ?? {}) as Record<string, unknown>;
      const branch = properties.branch === "true" || properties.branch === "false" ? properties.branch : undefined;
      return {
        id: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        branch,
      };
    });
  }

  /**
   * @description 读取当前图节点业务摘要。
   * @returns 节点摘要。
   */
  function readGraphNodes(): CompositeWorkflowGraphNodeSummary[] {
    const lf = lfRef.value;
    if (!lf) {
      return [];
    }
    const raw = lf.getGraphRawData();
    return (raw.nodes ?? []).map((node) => {
      const properties = (node.properties ?? {}) as Record<string, unknown>;
      const kind = (typeof properties.kind === "string" ? properties.kind : "function") as CompositeWorkflowNodeKind;
      return {
        id: node.id,
        kind,
        functionApi: typeof properties.functionApi === "string" ? properties.functionApi : undefined,
        version: typeof properties.version === "string" ? properties.version : undefined,
        displayName: typeof properties.displayName === "string" ? properties.displayName : undefined,
        inputBindings: Array.isArray(properties.inputBindings) ? (properties.inputBindings as CompositeWorkflowInputBinding[]) : undefined,
        paramsSnapshot:
          properties.paramsSnapshot && typeof properties.paramsSnapshot === "object"
            ? (properties.paramsSnapshot as { inputs: CompositeWorkflowParamBrief[]; outputs: CompositeWorkflowParamBrief[] })
            : undefined,
        loopConfig: properties.loopConfig as CompositeWorkflowLoopConfig | undefined,
        branchConfig: properties.branchConfig as CompositeWorkflowBranchConfig | undefined,
        transformConfig: properties.transformConfig as CompositeWorkflowTransformConfig | undefined,
      };
    });
  }

  /**
   * @description 解析节点上游输出参数列表。
   * @param nodeId 目标节点 id。
   * @returns hasUpstream 与 upstreamOutputs。
   */
  function resolveUpstreamOutputs(nodeId: string): { hasUpstream: boolean; upstreamOutputs: CompositeWorkflowParamBrief[] } {
    const edges = readGraphEdges().filter((edge) => edge.targetNodeId === nodeId);
    if (edges.length === 0) {
      return { hasUpstream: false, upstreamOutputs: [] };
    }
    const nodes = readGraphNodes();
    const source = nodes.find((node) => node.id === edges[0]?.sourceNodeId);
    if (!source) {
      return { hasUpstream: true, upstreamOutputs: [] };
    }
    if (source.kind === "function") {
      return { hasUpstream: true, upstreamOutputs: source.paramsSnapshot?.outputs ?? [] };
    }
    if (source.kind === "transform") {
      return {
        hasUpstream: true,
        upstreamOutputs: (source.transformConfig?.outputKeys ?? ["result"]).map((paramName) => ({
          paramName,
          paramType: "object",
        })),
      };
    }
    if (source.kind === "loop") {
      const itemName = source.loopConfig?.itemParamName?.trim() || "item";
      return { hasUpstream: true, upstreamOutputs: [{ paramName: itemName, paramType: "object" }] };
    }
    return { hasUpstream: true, upstreamOutputs: [] };
  }

  /** 上游函数输出加载序号，避免过期详情覆盖新结果。 */
  const upstreamOutputLoadGeneration = new Map<string, number>();
  let functionNodeOpenGeneration = 0;

  /**
   * @description 连线后补齐上游函数的输出定义。已有输出快照时直接使用，不检查该节点入参是否已填写。
   * @param sourceNodeId 上游节点 id。
   */
  async function ensureUpstreamFunctionOutputs(sourceNodeId: string): Promise<void> {
    const lf = lfRef.value;
    if (!lf) {
      return;
    }
    const source = readGraphNodes().find((node) => node.id === sourceNodeId);
    if (!source || source.kind !== "function" || (source.paramsSnapshot?.outputs?.length ?? 0) > 0) {
      return;
    }
    const functionApi = source.functionApi?.trim() ?? "";
    const version = source.version?.trim() ?? "";
    if (!functionApi || !version) {
      return;
    }
    const requestId = (upstreamOutputLoadGeneration.get(sourceNodeId) ?? 0) + 1;
    upstreamOutputLoadGeneration.set(sourceNodeId, requestId);
    const response = await getOntologyFunctionDetailInterface({ functionApi, version });
    if (disposed || upstreamOutputLoadGeneration.get(sourceNodeId) !== requestId) {
      return;
    }
    if (response.code !== 200 || !response.data) {
      throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "上游输出加载失败");
    }
    const model = lf.getNodeModelById(sourceNodeId);
    if (!model) {
      return;
    }
    const properties = model.getProperties() as Record<string, unknown>;
    const existing =
      properties.paramsSnapshot && typeof properties.paramsSnapshot === "object"
        ? (properties.paramsSnapshot as { inputs?: CompositeWorkflowParamBrief[]; outputs?: CompositeWorkflowParamBrief[] })
        : undefined;
    model.setProperties({
      ...properties,
      paramsSnapshot: {
        inputs: existing?.inputs ?? [],
        outputs: mapCompositeWorkflowDetailParamBriefs(response.data.params ?? [], "OUTPUT"),
      },
    });
  }

  /**
   * @description 打开函数节点配置。先按连线加载上游输出，再展示下游入参可选列表。
   * @param nodeId 节点 id。
   * @param properties 节点属性。
   */
  async function openFunctionNodeEdit(nodeId: string, properties: Record<string, unknown>): Promise<void> {
    const requestId = functionNodeOpenGeneration + 1;
    functionNodeOpenGeneration = requestId;
    const edges = readGraphEdges().filter((edge) => edge.targetNodeId === nodeId);
    const sourceNodeId = edges[0]?.sourceNodeId ?? "";
    if (sourceNodeId) {
      try {
        await ensureUpstreamFunctionOutputs(sourceNodeId);
      } catch (error) {
        ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "上游输出加载失败");
      }
    }
    if (disposed || functionNodeOpenGeneration !== requestId) {
      return;
    }
    const { hasUpstream, upstreamOutputs } = resolveUpstreamOutputs(nodeId);
    functionNodeEdit.value = {
      nodeId,
      functionApi: String(properties.functionApi ?? ""),
      version: String(properties.version ?? ""),
      displayName: String(properties.displayName ?? properties.title ?? ""),
      inputBindings: Array.isArray(properties.inputBindings) ? (properties.inputBindings as CompositeWorkflowInputBinding[]) : [],
      paramsSnapshot: properties.paramsSnapshot as CompositeWorkflowFunctionNodeEditContext["paramsSnapshot"],
      hasUpstream,
      upstreamOutputs,
    };
  }

  /**
   * @description 连线成功后刷新目标函数节点默认同名绑定（已有 paramsSnapshot 时）。
   * @param targetNodeId 目标节点。
   */
  function refreshTargetBindingsAfterConnect(targetNodeId: string): void {
    const lf = lfRef.value;
    if (!lf) {
      return;
    }
    const model = lf.getNodeModelById(targetNodeId);
    if (!model) {
      return;
    }
    const properties = model.getProperties() as Record<string, unknown>;
    if (properties.kind !== "function") {
      return;
    }
    const snapshot = properties.paramsSnapshot as { inputs: CompositeWorkflowParamBrief[]; outputs: CompositeWorkflowParamBrief[] } | undefined;
    if (!snapshot?.inputs?.length) {
      return;
    }
    const { hasUpstream, upstreamOutputs } = resolveUpstreamOutputs(targetNodeId);
    const nextBindings = buildDefaultCompositeWorkflowInputBindings(snapshot.inputs, upstreamOutputs, hasUpstream);
    model.setProperties({ ...properties, inputBindings: nextBindings });
  }

  /**
   * @description 将 LogicFlow 内层容器与 graph 尺寸同步到宿主，避免固定像素画布小于宿主导致拖放落点在可视区外。
   */
  function syncCompositeWorkflowCanvasSize(): void {
    const host = canvasHostRef.value;
    const lf = lfRef.value;
    if (!host || !lf || disposed) {
      return;
    }
    const hostWidth = Math.max(host.clientWidth, 1);
    const hostHeight = Math.max(host.clientHeight, 1);
    if (hostWidth < 2 || hostHeight < 2) {
      return;
    }
    const lfContainer = lf.container;
    lfContainer.style.width = "100%";
    lfContainer.style.height = "100%";
    lf.resize(hostWidth, hostHeight);
  }

  /**
   * @description 初始化 LogicFlow 并绑定事件。
   */
  function initCompositeWorkflowCanvas(): void {
    destroyCompositeWorkflowCanvas();
    const host = canvasHostRef.value;
    if (!host || disposed) {
      return;
    }
    const hostWidth = Math.max(host.clientWidth, 320);
    const hostHeight = Math.max(host.clientHeight, 240);
    // 不传 width/height，让内层容器默认 100%，再由 sync 写入实际像素，避免固定小画布。
    const lf = markRaw(
      new LogicFlow({
        container: host,
        background: {
          backgroundColor: "#071925",
        },
        grid: {
          size: 20,
          visible: true,
          type: "dot",
          config: {
            color: "#1b5f79",
            thickness: 1,
          },
        },
        keyboard: { enabled: true },
        edgeType: "polyline",
        stopScrollGraph: true,
        stopZoomGraph: false,
        // 仅当落点足够靠近某一锚点时才吸附，避免拖到节点边框中部自动连上。
        customTargetAnchor: (nodeModel, position) => {
          const anchors = nodeModel.anchors;
          if (!anchors.length) {
            return undefined;
          }
          let closestIndex = 0;
          let minDistance = Number.POSITIVE_INFINITY;
          for (let index = 0; index < anchors.length; index += 1) {
            const anchor = anchors[index];
            if (!anchor) {
              continue;
            }
            const distance = Math.hypot(position.x - anchor.x, position.y - anchor.y);
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = index;
            }
          }
          if (minDistance > COMPOSITE_WORKFLOW_ANCHOR_SNAP_DISTANCE) {
            return undefined;
          }
          const closest = anchors[closestIndex];
          if (!closest) {
            return undefined;
          }
          return { index: closestIndex, anchor: closest };
        },
      }),
    );
    registerCompositeWorkflowNodes(lf);
    lf.setTheme({
      rect: {
        radius: 8,
        strokeWidth: 2,
        fill: "#1a2236",
        stroke: "#409eff",
      },
      polyline: {
        stroke: "#6b7a99",
        strokeWidth: 2,
      },
      nodeText: {
        overflowMode: "ellipsis",
        fontSize: 12,
        color: "#e8eefc",
      },
    });
    // LogicFlow 必须先 render 才会挂载 Preact Graph；否则 addNode 只改 model、画布无视图。
    lf.render({});
    const lfContainer = lf.container;
    lfContainer.style.width = "100%";
    lfContainer.style.height = "100%";
    lf.resize(hostWidth, hostHeight);
    lf.on("node:dbclick", ({ data }) => {
      const properties = (data.properties ?? {}) as Record<string, unknown>;
      const kind = properties.kind;
      if (kind === "function") {
        logicNodeEdit.value = null;
        void openFunctionNodeEdit(data.id, properties);
        return;
      }
      if (kind === "loop" || kind === "branch" || kind === "transform") {
        functionNodeEdit.value = null;
        logicNodeEdit.value = {
          nodeId: data.id,
          kind,
          loopConfig: properties.loopConfig as CompositeWorkflowLoopConfig | undefined,
          branchConfig: properties.branchConfig as CompositeWorkflowBranchConfig | undefined,
          transformConfig: properties.transformConfig as CompositeWorkflowTransformConfig | undefined,
        };
      }
    });
    lf.on("blank:click", () => {
      clearNodeEditState();
    });
    lf.on("edge:add", ({ data }) => {
      const edgesBefore = readGraphEdges().filter((edge) => edge.id !== data.id);
      if (wouldCompositeWorkflowEdgeCreateCycle(edgesBefore, data.sourceNodeId, data.targetNodeId)) {
        ElMessage.warning("不允许形成环路");
        lf.deleteEdge(data.id);
        return;
      }
      const targetModel = lf.getNodeModelById(data.targetNodeId);
      const targetKind = (targetModel?.getProperties() as Record<string, unknown> | undefined)?.kind;
      if (targetKind === "function" && hasCompositeWorkflowIncomingEdge(edgesBefore, data.targetNodeId)) {
        ElMessage.warning("函数节点仅允许一条入边");
        lf.deleteEdge(data.id);
        return;
      }
      const sourceModel = lf.getNodeModelById(data.sourceNodeId);
      const sourceKind = (sourceModel?.getProperties() as Record<string, unknown> | undefined)?.kind;
      if (sourceKind === "branch") {
        const sourceAnchorId = typeof data.sourceAnchorId === "string" ? data.sourceAnchorId : "";
        const branch = sourceAnchorId.endsWith("_out_false") ? "false" : "true";
        const edgeModel = lf.getEdgeModelById(data.id);
        edgeModel?.setProperties({ ...(edgeModel.getProperties() as object), branch });
      }
      void (async () => {
        try {
          await ensureUpstreamFunctionOutputs(data.sourceNodeId);
        } catch (error) {
          ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "上游输出加载失败");
        }
        refreshTargetBindingsAfterConnect(data.targetNodeId);
      })();
    });
    lf.on("edge:delete", ({ data }) => {
      refreshTargetBindingsAfterConnect(data.targetNodeId);
    });
    lf.on("graph:transform", () => {
      const transform = lf.getTransform();
      zoomPercent.value = Math.round((transform.SCALE_X || 1) * 100);
    });
    lf.on("node:dnd-add", ({ data }) => {
      sidebarDndAddedNode.value = true;
      if (data?.id) {
        lf.focusOn({ id: data.id });
      }
    });
    lfRef.value = lf;
    zoomPercent.value = 100;
    canvasResizeObserver?.disconnect();
    canvasResizeObserver = new ResizeObserver(() => {
      syncCompositeWorkflowCanvasSize();
    });
    canvasResizeObserver.observe(host);
    requestAnimationFrame(() => {
      syncCompositeWorkflowCanvasSize();
    });
  }

  /**
   * @description 销毁 LogicFlow 实例。
   */
  function destroyCompositeWorkflowCanvas(): void {
    canvasResizeObserver?.disconnect();
    canvasResizeObserver = null;
    const lf = lfRef.value;
    if (lf) {
      lf.destroy();
      lfRef.value = null;
    }
  }

  /**
   * @description 由侧栏载荷组装 LogicFlow 节点配置（不含坐标）。
   * @param payload DnD 载荷。
   * @returns 节点配置。
   */
  function buildCompositeWorkflowNodeConfig(payload: CompositeWorkflowDndPayload): LogicFlow.OnDragNodeConfig {
    if (payload.nodeKind === "function") {
      const label = payload.displayName.trim() || payload.functionApi || "脚本函数";
      const versionText = payload.version.trim() ? `v${payload.version.trim()}` : "v-";
      return {
        type: resolveCompositeWorkflowLfNodeType("function"),
        text: `${label}\n${payload.functionApi} · ${versionText}`,
        properties: {
          kind: "function",
          title: label,
          subtitle: `${payload.functionApi} · ${versionText}`,
          functionApi: payload.functionApi,
          version: payload.version,
          displayName: label,
          inputBindings: [],
        },
      };
    }
    const titles: Record<"loop" | "branch" | "transform", string> = {
      loop: "循环",
      branch: "条件分支",
      transform: "数据格式转换",
    };
    const title = titles[payload.nodeKind];
    const properties: Record<string, unknown> = {
      kind: payload.nodeKind,
      title,
      subtitle: "逻辑节点",
    };
    if (payload.nodeKind === "loop") {
      properties.loopConfig = {
        kind: "loop",
        collection: { mode: "manual", jsonText: "[]" },
        itemParamName: "item",
        maxIterations: 100,
      } satisfies CompositeWorkflowLoopConfig;
    } else if (payload.nodeKind === "branch") {
      properties.branchConfig = {
        kind: "branch",
        left: { mode: "manual", value: "" },
        operator: "truthy",
      } satisfies CompositeWorkflowBranchConfig;
    } else {
      properties.transformConfig = {
        kind: "transform",
        language: "javascript",
        code: "function transform(input) {\n  return { result: input };\n}\n",
        outputKeys: ["result"],
      } satisfies CompositeWorkflowTransformConfig;
    }
    return {
      type: resolveCompositeWorkflowLfNodeType(payload.nodeKind),
      text: title,
      properties,
    };
  }

  /**
   * @description 使用 LogicFlow 原生 DnD：按住侧栏项拖入画布落点创建节点。
   * @param payload 侧栏载荷。
   */
  function startCompositeWorkflowNodeDrag(payload: CompositeWorkflowDndPayload): void {
    const lf = lfRef.value;
    if (!lf) {
      ElMessage.warning("画布未就绪，请稍后重试");
      return;
    }
    sidebarDndAddedNode.value = false;
    syncCompositeWorkflowCanvasSize();
    lf.dnd.startDrag(buildCompositeWorkflowNodeConfig(payload));
  }

  /**
   * @description 消费侧栏 DnD 落点标记；若刚拖入落点则返回 true。
   * @returns 是否应跳过 click 中心添加。
   */
  function consumeSidebarDndAddedFlag(): boolean {
    if (!sidebarDndAddedNode.value) {
      return false;
    }
    sidebarDndAddedNode.value = false;
    return true;
  }

  /**
   * @description 点击侧栏项时在画布中心添加节点。
   * @param payload 侧栏载荷。
   */
  function addCompositeWorkflowNodeAtCanvasCenter(payload: CompositeWorkflowDndPayload): void {
    const lf = lfRef.value;
    if (!lf) {
      ElMessage.warning("画布未就绪，请稍后重试");
      return;
    }
    syncCompositeWorkflowCanvasSize();
    const host = canvasHostRef.value;
    const centerX = host ? Math.max(host.clientWidth / 2, 160) : 240;
    const centerY = host ? Math.max(host.clientHeight / 2, 120) : 180;
    const point = lf.getPointByClient((host?.getBoundingClientRect().left ?? 0) + centerX, (host?.getBoundingClientRect().top ?? 0) + centerY);
    const x = Number.isFinite(point.canvasOverlayPosition.x) ? point.canvasOverlayPosition.x : centerX;
    const y = Number.isFinite(point.canvasOverlayPosition.y) ? point.canvasOverlayPosition.y : centerY;
    const dragConfig = buildCompositeWorkflowNodeConfig(payload);
    const nodeModel = lf.addNode({
      type: dragConfig.type,
      text: dragConfig.text,
      properties: dragConfig.properties,
      x,
      y,
    });
    lf.focusOn({ id: nodeModel.id });
  }

  /**
   * @description 删除当前选中元素。
   */
  function deleteSelectedElements(): void {
    const lf = lfRef.value;
    if (!lf) {
      return;
    }
    const { nodes, edges } = lf.getSelectElements(true);
    for (const edge of edges) {
      lf.deleteEdge(edge.id);
    }
    for (const node of nodes) {
      lf.deleteNode(node.id);
    }
  }

  /**
   * @description 适应画布。
   */
  function fitCompositeWorkflowCanvas(): void {
    lfRef.value?.fitView(40, 40);
  }

  /**
   * @description 缩放画布。
   * @param delta 相对增量（如 0.1 / -0.1）。
   */
  function zoomCompositeWorkflowCanvas(delta: number): void {
    const lf = lfRef.value;
    if (!lf) {
      return;
    }
    const current = lf.getTransform().SCALE_X || 1;
    lf.zoom(current + delta);
    zoomPercent.value = Math.round((lf.getTransform().SCALE_X || 1) * 100);
  }

  /**
   * @description 简单网格排布当前节点（自动布局占位）。
   */
  function autoLayoutCompositeWorkflowCanvas(): void {
    const lf = lfRef.value;
    if (!lf) {
      return;
    }
    const raw = lf.getGraphRawData();
    const nodes = raw.nodes ?? [];
    const columns = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    nodes.forEach((node, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      lf.graphModel.moveNode2Coordinate(node.id, 160 + col * 220, 120 + row * 120);
    });
  }

  /**
   * @description 将函数节点配置写回画布。
   * @param nodeId 节点 id。
   * @param patch 属性补丁。
   */
  function applyFunctionNodeEdit(
    nodeId: string,
    patch: {
      inputBindings: CompositeWorkflowInputBinding[];
      paramsSnapshot: { inputs: CompositeWorkflowParamBrief[]; outputs: CompositeWorkflowParamBrief[] };
    },
  ): void {
    const lf = lfRef.value;
    const model = lf?.getNodeModelById(nodeId);
    if (!model) {
      return;
    }
    const properties = model.getProperties() as Record<string, unknown>;
    model.setProperties({
      ...properties,
      inputBindings: patch.inputBindings,
      paramsSnapshot: patch.paramsSnapshot,
    });
    functionNodeEdit.value = null;
  }

  /**
   * @description 将逻辑节点配置写回画布。
   * @param context 逻辑配置上下文。
   */
  function applyLogicNodeEdit(context: CompositeWorkflowLogicNodeEditContext): void {
    const lf = lfRef.value;
    const model = lf?.getNodeModelById(context.nodeId);
    if (!model) {
      return;
    }
    const properties = model.getProperties() as Record<string, unknown>;
    if (context.kind === "loop") {
      model.setProperties({ ...properties, loopConfig: context.loopConfig });
    } else if (context.kind === "branch") {
      model.setProperties({ ...properties, branchConfig: context.branchConfig });
    } else {
      model.setProperties({ ...properties, transformConfig: context.transformConfig });
    }
    logicNodeEdit.value = null;
  }

  /**
   * @description 校验并 console.log 保存载荷。
   */
  function saveCompositeWorkflowToConsole(): void {
    const lf = lfRef.value;
    if (!lf) {
      ElMessage.error("画布未初始化");
      return;
    }
    const nodes = readGraphNodes();
    const edges = readGraphEdges();
    const { error, warning } = validateCompositeWorkflowForSave(nodes, edges);
    if (error) {
      ElMessage.error(error);
      return;
    }
    if (warning) {
      ElMessage.warning(warning);
    }
    const payload = buildCompositeWorkflowSavePayload({
      displayName: options.displayName.value,
      functionApi: options.functionApi.value,
      version: options.version.value,
      ontologySpaceId: options.spaceId.value,
      logicFlowGraph: lf.getGraphRawData(),
      nodes,
      edges,
    });
    const liteFlow = buildCompositeWorkflowLiteFlowEl(nodes, edges);
    console.log("[composite-workflow]", payload);
    console.log("[composite-workflow][liteflow-el]", liteFlow.expression);
    if (liteFlow.warnings.length > 0) {
      console.warn("[composite-workflow][liteflow-el]", liteFlow.warnings);
    }
    ElMessage.success("已在控制台打印流程数据与 LiteFlow EL");
  }

  /**
   * @description 关闭配置弹框时清空编辑态。
   */
  function clearNodeEditState(): void {
    functionNodeOpenGeneration += 1;
    functionNodeEdit.value = null;
    logicNodeEdit.value = null;
  }

  onUnmounted(() => {
    disposed = true;
    destroyCompositeWorkflowCanvas();
  });

  return {
    canvasHostRef,
    zoomPercent,
    functionNodeEdit,
    logicNodeEdit,
    initCompositeWorkflowCanvas,
    destroyCompositeWorkflowCanvas,
    startCompositeWorkflowNodeDrag,
    addCompositeWorkflowNodeAtCanvasCenter,
    consumeSidebarDndAddedFlag,
    deleteSelectedElements,
    fitCompositeWorkflowCanvas,
    zoomCompositeWorkflowCanvas,
    autoLayoutCompositeWorkflowCanvas,
    saveCompositeWorkflowToConsole,
    applyFunctionNodeEdit,
    applyLogicNodeEdit,
    clearNodeEditState,
    repairCompositeWorkflowInputBindings,
    resolveUpstreamOutputs,
  };
}
