<template>
  <div class="conceptual-model-graph">
    <div
      ref="canvasRef"
      class="conceptual-model-graph__stage"
      tabindex="0"
      aria-label="概念模型画布"
      @dragover.prevent
      @drop="onDropPalette"
      @keydown.delete.prevent="emit('remove-selected')"
    />
    <div v-if="!objects.length && !relations.length" class="conceptual-model-graph__empty">
      <strong>从左侧拖入 UML 组件</strong>
      <span>从对象四边圆点拖到另一个对象即可建立关系，同一个对象可以建立多条关系</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Graph, type Edge } from "@antv/x6";
import {
  CONCEPTUAL_OBJECT_SHAPE,
  CONCEPTUAL_OBJECT_WIDTH,
  applyRelationEdgeTools,
  asRelationPort,
  conceptualEdgeAttrs,
  conceptualEdgeLabel,
  conceptualObjectCellId,
  conceptualObjectHeight,
  conceptualRelationCellId,
  createConceptualModelGraph,
  nudgeFreeRelationEnd,
  parseConceptualObjectCellId,
  parseConceptualRelationCellId,
  relationTerminal,
  setConceptualModelHtmlHandlers,
  type ConceptualModelGraphObject,
  type ConceptualModelGraphPort,
  type ConceptualModelGraphRelation,
  type ConceptualModelGraphSelection,
} from "../utils/conceptualModelGraph";

const props = defineProps<{
  objects: ConceptualModelGraphObject[];
  relations: ConceptualModelGraphRelation[];
  selected: ConceptualModelGraphSelection | null;
}>();

const emit = defineEmits<{
  select: [selection: ConceptualModelGraphSelection];
  "clear-selection": [];
  "move-object": [objectId: number, x: number, y: number];
  connect: [sourceId: number, targetId: number, sourcePort: ConceptualModelGraphPort, targetPort: ConceptualModelGraphPort];
  "update-relation-ends": [
    relationId: number,
    patch: {
      sourceId: number | null;
      targetId: number | null;
      sourcePort: ConceptualModelGraphPort | null;
      targetPort: ConceptualModelGraphPort | null;
      sourcePoint: { x: number; y: number };
      targetPoint: { x: number; y: number };
    },
  ];
  "add-object-at": [x: number, y: number];
  "add-attribute-to": [objectId: number];
  "add-relation-at": [x: number, y: number];
  "zoom-change": [percent: number];
  "remove-selected": [];
}>();

const canvasRef = ref<HTMLElement | null>(null);
let graph: Graph | null = null;
let syncingGraph = false;
let skipNextSync = false;
let wiringEdge: Edge | null = null;

/**
 * @description 把浏览器坐标转换成图坐标。
 * @param clientX 指针横坐标。
 * @param clientY 指针纵坐标。
 * @returns 图坐标。
 */
function localPoint(clientX: number, clientY: number): { x: number; y: number } {
  if (!graph) return { x: 80, y: 80 };
  return graph.clientToLocal(clientX, clientY);
}

/**
 * @description 查找落点下的对象节点。
 * @param x 图横坐标。
 * @param y 图纵坐标。
 * @returns 对象节点。
 */
function findObjectNodeAt(x: number, y: number) {
  return graph?.getNodes().find((item) => {
    if (item.shape !== CONCEPTUAL_OBJECT_SHAPE) return false;
    const bbox = item.getBBox();
    return x >= bbox.x && x <= bbox.x + bbox.width && y >= bbox.y && y <= bbox.y + bbox.height;
  });
}

/**
 * @description 处理组件库拖放到画布。
 * @param event 拖放事件。
 */
function onDropPalette(event: DragEvent): void {
  const kind = event.dataTransfer?.getData("conceptual-model/type");
  const point = localPoint(event.clientX, event.clientY);
  if (kind === "object") {
    emit("add-object-at", point.x, point.y);
    return;
  }
  if (kind === "attribute") {
    const node = findObjectNodeAt(point.x, point.y);
    const objectId = parseConceptualObjectCellId(node?.id);
    if (objectId !== null) emit("add-attribute-to", objectId);
    return;
  }
  if (kind === "relation") emit("add-relation-at", point.x, point.y);
}

/**
 * @description 判断边的一端是否已经是目标端点。
 * @param edge 关系边。
 * @param end 源端或目标端。
 * @param next 目标端点。
 * @returns 是否相同。
 */
function sameTerminal(edge: Edge, end: "source" | "target", next: { cell: string; port?: string } | { x: number; y: number }): boolean {
  if ("cell" in next) {
    const cellId = end === "source" ? edge.getSourceCellId() : edge.getTargetCellId();
    const portId = end === "source" ? edge.getSourcePortId() : edge.getTargetPortId();
    return cellId === next.cell && (portId || "") === (next.port || "");
  }
  const point = end === "source" ? edge.getSourcePoint() : edge.getTargetPoint();
  return Math.abs(point.x - next.x) < 2 && Math.abs(point.y - next.y) < 2;
}

/**
 * @description 把页面对象和关系同步到图中。
 */
function syncGraph(): void {
  if (!graph || skipNextSync) return;
  syncingGraph = true;
  try {
    const objectIds = new Set(props.objects.map((item) => item.id));
    graph.getNodes().forEach((node) => {
      const objectId = parseConceptualObjectCellId(node.id);
      if (objectId === null || !objectIds.has(objectId)) graph?.removeNode(node.id);
    });
    props.objects.forEach((object) => {
      const cellId = conceptualObjectCellId(object.id);
      const selected = props.selected?.kind === "object" && props.selected.id === object.id;
      const selectedAttributeId = props.selected?.kind === "attribute" ? props.selected.id : null;
      const existing = graph?.getCellById(cellId);
      if (existing?.isNode()) {
        const position = existing.getPosition();
        if (position.x !== object.x || position.y !== object.y) existing.setPosition(object.x, object.y);
        existing.setData({ object, selected, selectedAttributeId }, { overwrite: true });
        const height = conceptualObjectHeight(object.attributes.length);
        if (existing.getSize().height !== height) existing.resize(CONCEPTUAL_OBJECT_WIDTH, height);
        graph?.findViewByCell(existing)?.container.classList.toggle("conceptual-model-node-selected", selected);
        return;
      }
      const node = graph?.addNode({
        id: cellId,
        shape: CONCEPTUAL_OBJECT_SHAPE,
        x: object.x,
        y: object.y,
        width: CONCEPTUAL_OBJECT_WIDTH,
        height: conceptualObjectHeight(object.attributes.length),
        data: { object, selected, selectedAttributeId },
        zIndex: 2,
      });
      if (node) graph?.findViewByCell(node)?.container.classList.toggle("conceptual-model-node-selected", selected);
    });

    const relationIds = new Set(props.relations.map((item) => item.id));
    graph.getEdges().forEach((edge) => {
      const relationId = parseConceptualRelationCellId(edge.id);
      if (relationId === null || !relationIds.has(relationId)) graph?.removeEdge(edge.id);
    });
    props.relations.forEach((relation) => {
      const source = relationTerminal(relation, "source", objectIds);
      const target = relationTerminal(relation, "target", objectIds);
      const cellId = conceptualRelationCellId(relation.id);
      const existing = graph?.getCellById(cellId);
      const labelText = relation.displayName || relation.apiName || "关系";
      if (existing?.isEdge()) {
        if (!sameTerminal(existing, "source", source)) existing.setSource(source);
        if (!sameTerminal(existing, "target", target)) existing.setTarget(target);
        existing.setLabels([conceptualEdgeLabel(labelText)]);
        existing.setAttrs(conceptualEdgeAttrs());
        existing.setZIndex(4);
        applyRelationEdgeTools(existing, true);
        return;
      }
      const edge = graph?.addEdge({
        id: cellId,
        source,
        target,
        router: { name: "normal" },
        connector: { name: "normal" },
        attrs: conceptualEdgeAttrs(),
        labels: [conceptualEdgeLabel(labelText)],
        zIndex: 4,
      });
      if (edge) applyRelationEdgeTools(edge, true);
    });
  } finally {
    syncingGraph = false;
  }
}

/**
 * @description 把无效的对象连接还原成自由坐标。
 * @param edge 关系边。
 * @param end 源端或目标端。
 */
function detachInvalidTerminal(edge: Edge, end: "source" | "target"): void {
  const point = end === "source" ? edge.getSourcePoint() : edge.getTargetPoint();
  const next = { x: Math.round(point.x), y: Math.round(point.y) };
  if (end === "source") edge.setSource(next);
  else edge.setTarget(next);
}

/**
 * @description 把已有关系边的两端写回页面数据。
 * @param edge 关系边。
 */
function commitRelationEnds(edge: Edge): void {
  if (syncingGraph || !graph) return;
  const relationId = parseConceptualRelationCellId(edge.id);
  const current = props.relations.find((item) => item.id === relationId);
  if (!current || relationId === null) return;
  const sourcePort = asRelationPort(edge.getSourcePortId());
  const targetPort = asRelationPort(edge.getTargetPortId());
  let sourceId = sourcePort ? parseConceptualObjectCellId(edge.getSourceCellId()) : null;
  let targetId = targetPort ? parseConceptualObjectCellId(edge.getTargetCellId()) : null;
  if (sourceId === null && edge.getSourceCellId()) detachInvalidTerminal(edge, "source");
  if (targetId === null && edge.getTargetCellId()) detachInvalidTerminal(edge, "target");
  if (sourceId !== null && targetId !== null && sourceId === targetId) {
    targetId = null;
    edge.setTarget(nudgeFreeRelationEnd(edge, graph, "source") ?? current.targetPoint);
  }
  const sourcePoint = edge.getSourcePoint();
  const targetPoint = edge.getTargetPoint();
  emit("update-relation-ends", relationId, {
    sourceId,
    targetId,
    sourcePort: sourceId === null ? null : (sourcePort ?? null),
    targetPort: targetId === null ? null : (targetPort ?? null),
    sourcePoint: { x: Math.round(sourcePoint.x), y: Math.round(sourcePoint.y) },
    targetPoint: { x: Math.round(targetPoint.x), y: Math.round(targetPoint.y) },
  });
  applyRelationEdgeTools(edge, true, true);
}

/**
 * @description 处理从连接点拖出的新关系。同一对象可以有多条关系，但不能连回自己。
 * @param edge 临时边。
 */
function handleConnectedEdge(edge: Edge): void {
  if (syncingGraph) return;
  if (parseConceptualRelationCellId(edge.id) !== null) {
    commitRelationEnds(edge);
    return;
  }
  const sourcePort = asRelationPort(edge.getSourcePortId());
  const targetPort = asRelationPort(edge.getTargetPortId());
  const sourceId = sourcePort ? parseConceptualObjectCellId(edge.getSourceCellId()) : null;
  const targetId = targetPort ? parseConceptualObjectCellId(edge.getTargetCellId()) : null;
  graph?.removeEdge(edge.id);
  if (sourceId === null || targetId === null || !sourcePort || !targetPort || sourceId === targetId) return;
  emit("connect", sourceId, targetId, sourcePort, targetPort);
}

/**
 * @description 标记正在拖动关系端点。
 * @param active 是否拖动中。
 * @param edge 当前边。
 */
function setWiring(active: boolean, edge: Edge | null = null): void {
  canvasRef.value?.classList.toggle("conceptual-model-graph__stage--wiring", active);
  wiringEdge = active ? edge : null;
}

/** @description 结束端点拖动并写回已有关系。 */
function finishWiring(): void {
  const edge = wiringEdge;
  setWiring(false);
  if (edge && parseConceptualRelationCellId(edge.id) !== null) commitRelationEnds(edge);
}

/** @description 创建图并监听选择、移动和连线。 */
function initGraph(): void {
  const container = canvasRef.value;
  if (!container || graph) return;
  graph = createConceptualModelGraph(container);
  setConceptualModelHtmlHandlers({
    onSelectObject: (objectId) => emit("select", { kind: "object", id: objectId }),
    onSelectAttribute: (_objectId, attributeId) => emit("select", { kind: "attribute", id: attributeId }),
    onAddAttribute: (objectId) => emit("add-attribute-to", objectId),
  });
  graph.on("blank:click", () => emit("clear-selection"));
  graph.on("edge:click", ({ edge }) => {
    const relationId = parseConceptualRelationCellId(edge.id);
    if (relationId !== null) emit("select", { kind: "relation", id: relationId });
  });
  graph.on("node:moved", ({ node }) => {
    if (syncingGraph) return;
    const objectId = parseConceptualObjectCellId(node.id);
    if (objectId === null) return;
    const position = node.getPosition();
    skipNextSync = true;
    emit("move-object", objectId, Math.round(position.x), Math.round(position.y));
    void nextTick(() => {
      skipNextSync = false;
    });
  });
  graph.on("edge:connected", ({ edge }) => handleConnectedEdge(edge));
  graph.on("edge:mousedown", ({ edge }) => setWiring(true, edge));
  graph.on("edge:mouseup", () => finishWiring());
  graph.on("blank:mouseup", () => finishWiring());
  graph.on("node:mouseup", () => finishWiring());
  graph.on("scale", ({ sx }) => emit("zoom-change", Math.round(sx * 100)));
  syncGraph();
}

/** @description 按当前内容适应画布。 */
function fit(): void {
  graph?.zoomToFit({ padding: 48, maxScale: 1.1 });
  if (graph) emit("zoom-change", Math.round(graph.zoom() * 100));
}

/**
 * @description 按增量缩放画布。
 * @param delta 缩放增量。
 */
function zoomBy(delta: number): void {
  if (!graph) return;
  graph.zoom(delta, { minScale: 0.6, maxScale: 1.6 });
  emit("zoom-change", Math.round(graph.zoom() * 100));
}

onMounted(() => {
  void nextTick(() => initGraph());
});

onBeforeUnmount(() => {
  setWiring(false);
  setConceptualModelHtmlHandlers(null);
  graph?.dispose();
  graph = null;
});

watch(
  () => [props.objects, props.relations, props.selected],
  () => {
    if (skipNextSync) return;
    syncGraph();
  },
  { deep: true },
);

defineExpose({ fit, zoomBy });
</script>

<style scoped lang="scss">
.conceptual-model-graph {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 620px;
}

.conceptual-model-graph__stage {
  width: 100%;
  height: 100%;
  min-height: 620px;
  outline: none;
  background: var(--aircas-color-panel-background-deep);
}

.conceptual-model-graph__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  max-width: 420px;
  padding: 20px 24px;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 10px;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-overlay);
  text-align: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.conceptual-model-graph__empty strong {
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}

.conceptual-model-graph__stage :deep(.x6-node foreignObject) {
  overflow: visible;
}

.conceptual-model-graph__stage :deep(.conceptual-model-node) {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  flex-direction: column;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 10px;
  color: var(--aircas-color-text-primary);
  background: linear-gradient(180deg, var(--aircas-color-overlay), var(--aircas-color-panel-background-deep));
  box-shadow: 0 0 18px var(--aircas-color-accent-cyan-soft);
}

.conceptual-model-graph__stage :deep(.conceptual-model-node.is-selected) {
  border-color: var(--aircas-color-accent-cyan);
  box-shadow:
    0 0 22px var(--aircas-color-accent-cyan-shadow),
    inset 0 0 16px var(--aircas-color-accent-cyan-fill);
}

.conceptual-model-graph__stage :deep(.conceptual-model-node__head) {
  display: flex;
  padding: 10px 12px 8px;
  flex-direction: column;
  gap: 2px;
  background: var(--aircas-color-section-header);
}

.conceptual-model-graph__stage :deep(.conceptual-model-node__stereo) {
  color: var(--aircas-color-accent-cyan);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.conceptual-model-graph__stage :deep(.conceptual-model-node__head strong) {
  font-size: 15px;
  line-height: 1.3;
}

.conceptual-model-graph__stage :deep(.conceptual-model-node__head em) {
  color: var(--aircas-color-text-muted);
  font-size: 11px;
  font-style: normal;
}

.conceptual-model-graph__stage :deep(.conceptual-model-node__attrs) {
  display: flex;
  min-height: 28px;
  padding: 6px;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  overflow: auto;
}

.conceptual-model-graph__stage :deep(.conceptual-model-node__attr) {
  display: flex;
  width: 100%;
  height: 26px;
  padding: 0 8px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 0;
  border-radius: 4px;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.conceptual-model-graph__stage :deep(.conceptual-model-node__attr.is-active),
.conceptual-model-graph__stage :deep(.conceptual-model-node__attr:hover) {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-accent-cyan-fill);
}

.conceptual-model-graph__stage :deep(.conceptual-model-node__attr em) {
  color: var(--aircas-color-accent-purple);
  font-style: normal;
}

.conceptual-model-graph__stage :deep(.conceptual-model-node__empty) {
  padding: 8px;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.conceptual-model-graph__stage :deep(.conceptual-model-node__add) {
  height: 32px;
  border: 0;
  border-top: 1px solid var(--aircas-color-border-soft);
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-blue-soft);
  font-size: 12px;
  cursor: pointer;
}

.conceptual-model-graph__stage :deep(.conceptual-model-node__add:hover) {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-accent-cyan-fill);
}

.conceptual-model-graph__stage :deep(.x6-port-body) {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.conceptual-model-graph__stage :deep(.x6-node:hover .x6-port-body),
.conceptual-model-graph__stage :deep(.x6-node.conceptual-model-node-selected .x6-port-body),
.conceptual-model-graph__stage--wiring :deep(.x6-port-body) {
  opacity: 1;
}
</style>
