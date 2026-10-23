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
  CompositeWorkflowSwitchConfig,
  CompositeWorkflowTransformConfig,
  CreateOntologyFunctionParams,
} from "@/types";
import {
  buildCompositeWorkflowSavePayload,
  buildDefaultCompositeWorkflowInputBindings,
  hasCompositeWorkflowIncomingEdge,
  mapCompositeWorkflowDetailParamBriefs,
  repairCompositeWorkflowInputBindings,
  resolveCompositeWorkflowNodeUpstreamOutputs,
  validateCompositeWorkflowForSave,
  wouldCompositeWorkflowEdgeCreateCycle,
  type CompositeWorkflowGraphEdge,
  type CompositeWorkflowGraphNodeSummary,
} from "../utils/compositeWorkflowGraph.ts";
import {
  COMPOSITE_WORKFLOW_ANCHOR_SNAP_DISTANCE,
  isCompositeWorkflowInputAnchorId,
  isCompositeWorkflowOutputAnchorId,
  parseCompositeWorkflowLoopOutletFromAnchorId,
  parseCompositeWorkflowSwitchOutletFromAnchorId,
  pickClosestAllowedCompositeWorkflowAnchor,
} from "../utils/compositeWorkflowAnchors.ts";
import { createDefaultCompositeWorkflowBranchConfig, normalizeCompositeWorkflowBranchConfig } from "../utils/compositeWorkflowBranchDefaults.ts";
import { layoutCompositeWorkflowNodesWithDagre } from "../utils/compositeWorkflowDagreLayout.ts";
import { createDefaultCompositeWorkflowLoopConfig, normalizeCompositeWorkflowLoopConfig } from "../utils/compositeWorkflowLoopDefaults.ts";
import { createDefaultCompositeWorkflowSwitchConfig, normalizeCompositeWorkflowSwitchConfig } from "../utils/compositeWorkflowSwitchDefaults.ts";
import { createDefaultCompositeWorkflowTransformConfig } from "../utils/compositeWorkflowTransformDefaults.ts";
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

/** 画布打开逻辑节点配置时的上下文（循环 / 分支 / Switch）。 */
export interface CompositeWorkflowLogicNodeEditContext {
  nodeId: string;
  kind: "loop" | "branch" | "switch";
  loopConfig?: CompositeWorkflowLoopConfig;
  branchConfig?: CompositeWorkflowBranchConfig;
  switchConfig?: CompositeWorkflowSwitchConfig;
  hasUpstream: boolean;
  upstreamOutputs: CompositeWorkflowParamBrief[];
}

/** 画布打开数据格式转换节点配置时的上下文。 */
export interface CompositeWorkflowTransformNodeEditContext {
  nodeId: string;
  transformConfig: CompositeWorkflowTransformConfig;
  hasUpstream: boolean;
  upstreamOutputs: CompositeWorkflowParamBrief[];
}

/**
 * @description 编排画布 LogicFlow 实例生命周期、DnD、连线约束与保存。
 * @param options 画布选项。
 * @returns 画布操作与配置弹框状态。
 */
export function useCompositeWorkflowCanvas(options: {
  displayName: Ref<string>;
  functionApi: Ref<string>;
  version: Ref<string>;
  description: Ref<string>;
  spaceId: Ref<number>;
}) {
  const canvasHostRef = ref<HTMLElement | null>(null);
  const lfRef: ShallowRef<LogicFlow | null> = shallowRef(null);
  const zoomPercent = ref(100);
  const functionNodeEdit = ref<CompositeWorkflowFunctionNodeEditContext | null>(null);
  const logicNodeEdit = ref<CompositeWorkflowLogicNodeEditContext | null>(null);
  const transformNodeEdit = ref<CompositeWorkflowTransformNodeEditContext | null>(null);
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
      const switchOutlet = typeof properties.switchOutlet === "string" && properties.switchOutlet.trim() ? properties.switchOutlet.trim() : undefined;
      const loopOutlet = properties.loopOutlet === "body" || properties.loopOutlet === "done" ? properties.loopOutlet : undefined;
      return {
        id: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        branch,
        switchOutlet,
        loopOutlet,
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
        loopConfig:
          kind === "loop" ? normalizeCompositeWorkflowLoopConfig(properties.loopConfig) : (properties.loopConfig as CompositeWorkflowLoopConfig | undefined),
        branchConfig:
          kind === "branch"
            ? normalizeCompositeWorkflowBranchConfig(properties.branchConfig)
            : (properties.branchConfig as CompositeWorkflowBranchConfig | undefined),
        transformConfig: properties.transformConfig as CompositeWorkflowTransformConfig | undefined,
        switchConfig:
          kind === "switch"
            ? normalizeCompositeWorkflowSwitchConfig(properties.switchConfig)
            : (properties.switchConfig as CompositeWorkflowSwitchConfig | undefined),
      };
    });
  }

  /**
   * @description 解析节点上游输出参数列表（条件分支透传其上游输出）。
   * @param nodeId 目标节点 id。
   * @returns hasUpstream 与 upstreamOutputs。
   */
  function resolveUpstreamOutputs(nodeId: string): { hasUpstream: boolean; upstreamOutputs: CompositeWorkflowParamBrief[] } {
    return resolveCompositeWorkflowNodeUpstreamOutputs(readGraphNodes(), readGraphEdges(), nodeId);
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
    const detailParams = response.data.params ?? [];
    const existingInputs = existing?.inputs;
    model.setProperties({
      ...properties,
      paramsSnapshot: {
        inputs: Array.isArray(existingInputs) && existingInputs.length > 0 ? existingInputs : mapCompositeWorkflowDetailParamBriefs(detailParams, "INPUT"),
        outputs: mapCompositeWorkflowDetailParamBriefs(detailParams, "OUTPUT"),
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
    if (properties.kind === "function") {
      const snapshot = properties.paramsSnapshot as { inputs: CompositeWorkflowParamBrief[]; outputs: CompositeWorkflowParamBrief[] } | undefined;
      if (!snapshot?.inputs?.length) {
        return;
      }
      const { hasUpstream, upstreamOutputs } = resolveUpstreamOutputs(targetNodeId);
      const nextBindings = buildDefaultCompositeWorkflowInputBindings(snapshot.inputs, upstreamOutputs, hasUpstream);
      model.setProperties({ ...properties, inputBindings: nextBindings });
      return;
    }
    if (properties.kind !== "transform") {
      return;
    }
    const transformConfig = properties.transformConfig as CompositeWorkflowTransformConfig | undefined;
    const inputs = transformConfig?.paramsSnapshot?.inputs ?? [];
    if (!inputs.length || !transformConfig) {
      return;
    }
    const { hasUpstream, upstreamOutputs } = resolveUpstreamOutputs(targetNodeId);
    const nextBindings = buildDefaultCompositeWorkflowInputBindings(inputs, upstreamOutputs, hasUpstream);
    model.setProperties({
      ...properties,
      transformConfig: {
        ...transformConfig,
        inputBindings: nextBindings,
      },
    });
  }

  /**
   * @description 沿入边向上查找函数前驱并加载其 OUTPUT，供分支透传与下游绑定。
   * @param nodeId 起点节点 id。
   */
  async function ensureFunctionOutputsAlongIncoming(nodeId: string): Promise<void> {
    const visited = new Set<string>();
    let currentNodeId = nodeId;
    while (!visited.has(currentNodeId)) {
      visited.add(currentNodeId);
      const edges = readGraphEdges().filter((edge) => edge.targetNodeId === currentNodeId);
      const sourceNodeId = edges[0]?.sourceNodeId;
      if (!sourceNodeId) {
        return;
      }
      const source = readGraphNodes().find((node) => node.id === sourceNodeId);
      if (!source) {
        return;
      }
      if (source.kind === "function") {
        await ensureUpstreamFunctionOutputs(sourceNodeId);
        return;
      }
      if (source.kind === "branch" || source.kind === "switch") {
        currentNodeId = sourceNodeId;
        continue;
      }
      if (source.kind === "loop") {
        const incomingEdge = edges[0];
        if (incomingEdge?.loopOutlet === "body") {
          return;
        }
        currentNodeId = sourceNodeId;
        continue;
      }
      return;
    }
  }

  /**
   * @description 打开循环 / 条件分支 / Switch 配置；加载上游输出树供路径选择。
   * @param nodeId 节点 id。
   * @param kind 逻辑节点 kind。
   * @param properties 节点属性。
   */
  async function openLogicNodeEdit(nodeId: string, kind: "loop" | "branch" | "switch", properties: Record<string, unknown>): Promise<void> {
    const requestId = functionNodeOpenGeneration + 1;
    functionNodeOpenGeneration = requestId;
    try {
      await ensureFunctionOutputsAlongIncoming(nodeId);
    } catch (error) {
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "上游输出加载失败");
    }
    if (disposed || functionNodeOpenGeneration !== requestId) {
      return;
    }
    const { hasUpstream, upstreamOutputs } = resolveUpstreamOutputs(nodeId);
    logicNodeEdit.value = {
      nodeId,
      kind,
      loopConfig: kind === "loop" ? normalizeCompositeWorkflowLoopConfig(properties.loopConfig) : undefined,
      branchConfig: kind === "branch" ? normalizeCompositeWorkflowBranchConfig(properties.branchConfig) : undefined,
      switchConfig: kind === "switch" ? normalizeCompositeWorkflowSwitchConfig(properties.switchConfig) : undefined,
      hasUpstream,
      upstreamOutputs,
    };
  }

  /**
   * @description 打开数据格式转换节点配置，并解析上游输出树。
   * @param nodeId 节点 id。
   * @param properties 节点属性。
   */
  async function openTransformNodeEdit(nodeId: string, properties: Record<string, unknown>): Promise<void> {
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
    const existing = properties.transformConfig as CompositeWorkflowTransformConfig | undefined;
    transformNodeEdit.value = {
      nodeId,
      transformConfig: existing ?? createDefaultCompositeWorkflowTransformConfig(),
      hasUpstream,
      upstreamOutputs,
    };
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
        // 落点仅吸附左侧入口锚点：入口只能接另一节点的出口。
        customTargetAnchor: (nodeModel, position) => {
          return pickClosestAllowedCompositeWorkflowAnchor(
            nodeModel.anchors,
            position,
            COMPOSITE_WORKFLOW_ANCHOR_SNAP_DISTANCE,
            isCompositeWorkflowInputAnchorId,
          );
        },
      }),
    );
    registerCompositeWorkflowNodes(lf);
    lf.updateEditConfig({
      nodeSelectedOutline: false,
      edgeSelectedOutline: false,
    });
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
      /** 从锚点拖出连线过程中的临时轨迹（非落边后的 polyline）。 */
      anchorLine: {
        stroke: "#79bbff",
        strokeWidth: 2.5,
        strokeDasharray: "6,4",
      },
      outline: {
        fill: "none",
        stroke: "transparent",
        strokeWidth: 0,
        hover: {
          stroke: "transparent",
        },
      },
      edgeOutline: {
        fill: "none",
        stroke: "transparent",
        strokeWidth: 0,
        hover: {
          stroke: "transparent",
        },
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
        transformNodeEdit.value = null;
        void openFunctionNodeEdit(data.id, properties);
        return;
      }
      if (kind === "transform") {
        functionNodeEdit.value = null;
        logicNodeEdit.value = null;
        void openTransformNodeEdit(data.id, properties);
        return;
      }
      if (kind === "loop" || kind === "branch" || kind === "switch") {
        functionNodeEdit.value = null;
        transformNodeEdit.value = null;
        void openLogicNodeEdit(data.id, kind, properties);
      }
    });
    lf.on("blank:click", () => {
      clearNodeEditState();
    });
    lf.on("edge:add", ({ data }) => {
      const sourceAnchorId = typeof data.sourceAnchorId === "string" ? data.sourceAnchorId : "";
      const targetAnchorId = typeof data.targetAnchorId === "string" ? data.targetAnchorId : "";
      if (!isCompositeWorkflowOutputAnchorId(sourceAnchorId) || !isCompositeWorkflowInputAnchorId(targetAnchorId)) {
        ElMessage.warning("只能从节点右侧出口连到另一节点左侧入口");
        lf.deleteEdge(data.id);
        return;
      }
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
        const branch = sourceAnchorId.endsWith("_out_false") ? "false" : "true";
        const edgeModel = lf.getEdgeModelById(data.id);
        edgeModel?.setProperties({ ...(edgeModel.getProperties() as object), branch });
      }
      if (sourceKind === "switch") {
        const switchOutlet = parseCompositeWorkflowSwitchOutletFromAnchorId(sourceAnchorId);
        if (switchOutlet) {
          const edgeModel = lf.getEdgeModelById(data.id);
          edgeModel?.setProperties({ ...(edgeModel.getProperties() as object), switchOutlet });
        }
      }
      if (sourceKind === "loop") {
        const loopOutlet = parseCompositeWorkflowLoopOutletFromAnchorId(sourceAnchorId);
        if (loopOutlet) {
          const edgeModel = lf.getEdgeModelById(data.id);
          edgeModel?.setProperties({ ...(edgeModel.getProperties() as object), loopOutlet });
        }
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
    const titles: Record<"loop" | "branch" | "transform" | "switch", string> = {
      loop: "循环",
      branch: "条件分支",
      transform: "数据格式转换",
      switch: "Switch Case",
    };
    const title = titles[payload.nodeKind];
    const properties: Record<string, unknown> = {
      kind: payload.nodeKind,
      title,
      subtitle: "逻辑节点",
    };
    if (payload.nodeKind === "loop") {
      properties.loopConfig = createDefaultCompositeWorkflowLoopConfig();
    } else if (payload.nodeKind === "branch") {
      properties.branchConfig = createDefaultCompositeWorkflowBranchConfig();
    } else if (payload.nodeKind === "switch") {
      properties.switchConfig = createDefaultCompositeWorkflowSwitchConfig();
    } else {
      properties.transformConfig = createDefaultCompositeWorkflowTransformConfig();
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
   * @description 使用 Dagre 按连线关系对当前画布做左右分层自动布局。
   */
  async function autoLayoutCompositeWorkflowCanvas(): Promise<void> {
    const lf = lfRef.value;
    if (!lf) {
      return;
    }
    const graphNodes = readGraphNodes();
    const graphEdges = readGraphEdges();
    if (graphNodes.length === 0) {
      return;
    }
    try {
      const positions = await layoutCompositeWorkflowNodesWithDagre(
        graphNodes.map((node) => ({ id: node.id, kind: node.kind })),
        graphEdges.map((edge) => ({ sourceNodeId: edge.sourceNodeId, targetNodeId: edge.targetNodeId })),
      );
      for (const item of positions) {
        lf.graphModel.moveNode2Coordinate(item.id, item.x, item.y);
      }
      fitCompositeWorkflowCanvas();
    } catch {
      ElMessage.warning("自动布局失败，请检查节点连线后重试");
    }
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
    } else if (context.kind === "switch" && context.switchConfig) {
      const switchConfig = normalizeCompositeWorkflowSwitchConfig(context.switchConfig);
      model.setProperties({ ...properties, switchConfig });
      model.setAttributes();
      const validOutlets = new Set<string>(["default", ...switchConfig.cases.map((item) => item.id)]);
      const raw = lf?.getGraphRawData();
      for (const edge of raw?.edges ?? []) {
        if (edge.sourceNodeId !== context.nodeId) {
          continue;
        }
        const edgeProperties = (edge.properties ?? {}) as Record<string, unknown>;
        const outlet = typeof edgeProperties.switchOutlet === "string" ? edgeProperties.switchOutlet : "";
        if (outlet && !validOutlets.has(outlet)) {
          lf?.deleteEdge(edge.id);
        }
      }
    }
    logicNodeEdit.value = null;
  }

  /**
   * @description 将数据格式转换节点配置写回画布。
   * @param context 转换节点上下文。
   */
  function applyTransformNodeEdit(context: CompositeWorkflowTransformNodeEditContext): void {
    const lf = lfRef.value;
    const model = lf?.getNodeModelById(context.nodeId);
    if (!model) {
      return;
    }
    const properties = model.getProperties() as Record<string, unknown>;
    model.setProperties({ ...properties, transformConfig: context.transformConfig });
    transformNodeEdit.value = null;
  }

  /**
   * @description 校验画布并组装 COMPOSITE 创建请求体；校验失败返回 null。
   * @returns 创建请求参数；画布未就绪或校验失败时为 null。
   */
  function buildCompositeWorkflowCreateParams(): CreateOntologyFunctionParams | null {
    const lf = lfRef.value;
    if (!lf) {
      ElMessage.error("画布未初始化");
      return null;
    }
    const nodes = readGraphNodes();
    const edges = readGraphEdges();
    const { error, warning } = validateCompositeWorkflowForSave(nodes, edges);
    if (error) {
      ElMessage.error(error);
      return null;
    }
    if (warning) {
      ElMessage.warning(warning);
    }
    const functionApi = options.functionApi.value.trim();
    const version = options.version.value.trim();
    const displayName = options.displayName.value.trim();
    if (!functionApi) {
      ElMessage.error("缺少函数 API 名称，无法保存");
      return null;
    }
    if (!version) {
      ElMessage.error("缺少函数版本，无法保存");
      return null;
    }
    if (!displayName) {
      ElMessage.error("缺少函数名称，无法保存");
      return null;
    }
    const compositeConfig = buildCompositeWorkflowSavePayload({
      displayName,
      functionApi,
      version,
      ontologySpaceId: options.spaceId.value,
      logicFlowGraph: lf.getGraphRawData(),
      nodes,
      edges,
    });
    return {
      functionApi,
      version,
      displayName,
      description: options.description.value.trim(),
      type: "COMPOSITE",
      ontologySpaceId: options.spaceId.value,
      compositeConfig,
    };
  }

  /**
   * @description 关闭配置弹框时清空编辑态。
   */
  function clearNodeEditState(): void {
    functionNodeOpenGeneration += 1;
    functionNodeEdit.value = null;
    logicNodeEdit.value = null;
    transformNodeEdit.value = null;
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
    transformNodeEdit,
    initCompositeWorkflowCanvas,
    destroyCompositeWorkflowCanvas,
    startCompositeWorkflowNodeDrag,
    addCompositeWorkflowNodeAtCanvasCenter,
    consumeSidebarDndAddedFlag,
    deleteSelectedElements,
    fitCompositeWorkflowCanvas,
    zoomCompositeWorkflowCanvas,
    autoLayoutCompositeWorkflowCanvas,
    buildCompositeWorkflowCreateParams,
    applyFunctionNodeEdit,
    applyLogicNodeEdit,
    applyTransformNodeEdit,
    clearNodeEditState,
    repairCompositeWorkflowInputBindings,
    resolveUpstreamOutputs,
  };
}
