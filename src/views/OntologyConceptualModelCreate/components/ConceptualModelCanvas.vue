<template>
  <section :ref="bindPanelRef" class="conceptual-model-create__canvas-panel" aria-label="概念模型画布" @dragover.prevent @drop="onDropPalette">
    <div class="conceptual-model-create__canvas" @pointerdown.self="$emit('clear-selection')">
      <div class="conceptual-model-create__stage" :style="{ transform: `scale(${zoom / 100})` }">
        <svg class="conceptual-model-create__edges" viewBox="0 0 1200 760">
          <defs>
            <marker id="model-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" />
            </marker>
          </defs>
          <g v-for="relation in relations" :key="relation.id">
            <line
              class="conceptual-model-create__edge"
              :class="{ 'is-selected': selected?.kind === 'relation' && selected.id === relation.id }"
              :x1="pointFor(relation, 'source').x"
              :y1="pointFor(relation, 'source').y"
              :x2="pointFor(relation, 'target').x"
              :y2="pointFor(relation, 'target').y"
              marker-end="url(#model-arrow)"
              @click.stop="$emit('select', { kind: 'relation', id: relation.id })"
            />
            <text
              class="conceptual-model-create__edge-label"
              :class="{ 'is-selected': selected?.kind === 'relation' && selected.id === relation.id }"
              :x="(pointFor(relation, 'source').x + pointFor(relation, 'target').x) / 2"
              :y="(pointFor(relation, 'source').y + pointFor(relation, 'target').y) / 2 - 8"
              text-anchor="middle"
            >
              {{ relation.displayName }}
            </text>
            <circle
              v-for="endpoint in relationEndpoints"
              :key="`${relation.id}-${endpoint}`"
              class="conceptual-model-create__edge-port"
              :class="[`is-${endpoint}`, { 'is-selected': selected?.kind === 'relation' && selected.id === relation.id }]"
              :cx="pointFor(relation, endpoint).x"
              :cy="pointFor(relation, endpoint).y"
              r="6"
              @pointerdown.stop="$emit('start-relation-port-drag', relation.id, endpoint, $event)"
              @click.stop="$emit('select', { kind: 'relation', id: relation.id })"
            />
          </g>
        </svg>
        <div v-if="!objects.length" class="conceptual-model-create__empty">
          <strong>从左侧拖入 UML 组件</strong>
          <span>开始构建你的空间概念模型</span>
        </div>
        <article
          v-for="object in objects"
          :key="object.id"
          class="conceptual-model-create__object"
          :class="{ 'is-selected': selected?.kind === 'object' && selected.id === object.id }"
          :style="{ left: `${object.x}px`, top: `${object.y}px` }"
          @pointerdown.stop="$emit('start-object-drag', object.id, $event)"
          @click.stop="$emit('select', { kind: 'object', id: object.id })"
        >
          <span class="conceptual-model-create__object-type">&lt;&lt;object&gt;&gt;</span>
          <strong>{{ object.displayName }}</strong>
          <small>{{ object.displayName }}</small>
          <div v-if="object.attributes.length" class="conceptual-model-create__attributes">
            <button
              v-for="attr in object.attributes"
              :key="attr.id"
              type="button"
              @pointerdown.stop
              @click.stop="$emit('select', { kind: 'attribute', id: attr.id })"
            >
              + {{ attr.displayName }} <em>{{ attr.dataType }}</em>
            </button>
          </div>
          <span v-else class="conceptual-model-create__object-empty">将属性拖到此处，或点击下方添加</span>
          <button type="button" class="conceptual-model-create__add" @pointerdown.stop @click.stop="$emit('add-attribute', object.id)">添加属性</button>
          <button
            v-for="port in ports"
            :key="port"
            type="button"
            class="conceptual-model-create__port"
            :class="`is-${port}`"
            :aria-label="`${object.displayName}${port}连接点`"
            @pointerdown.stop="$emit('connect-port', object.id, port, $event)"
          ></button>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import type { ConceptualModelObject, ConceptualModelPort, ConceptualModelRelation, ConceptualModelSelection } from "@/types";

const props = defineProps<{
  setPanelEl: (el: HTMLElement | null) => void;
  zoom: number;
  objects: ConceptualModelObject[];
  relations: ConceptualModelRelation[];
  selected: ConceptualModelSelection | null;
  ports: ConceptualModelPort[];
  relationEndpoints: Array<"source" | "target">;
  pointFor: (relation: ConceptualModelRelation, endpoint: "source" | "target") => { x: number; y: number };
}>();

const emit = defineEmits<{
  "drop-palette": [event: DragEvent];
  "clear-selection": [];
  select: [selection: ConceptualModelSelection];
  "start-relation-port-drag": [id: number, endpoint: "source" | "target", event: PointerEvent];
  "start-object-drag": [id: number, event: PointerEvent];
  "add-attribute": [objectId: number];
  "connect-port": [objectId: number, port: ConceptualModelPort, event: PointerEvent];
}>();

/**
 * @description 将画布面板根节点回写到页面 composable 的 panelRef，供拖拽坐标计算使用。
 * @param el 模板 ref 回调元素
 */
function bindPanelRef(el: Element | ComponentPublicInstance | null) {
  props.setPanelEl(el instanceof HTMLElement ? el : null);
}

/**
 * @description 处理组件库拖放到画布。
 * @param event 拖放事件
 */
function onDropPalette(event: DragEvent) {
  emit("drop-palette", event);
}
</script>

<style scoped lang="scss">
.conceptual-model-create__canvas-panel {
  min-width: 0;
  border: 1px solid var(--aircas-color-border);
  border-radius: 10px;
  background: var(--aircas-color-panel-background);
  overflow: hidden;
}

.conceptual-model-create__canvas {
  height: 100%;
  min-height: 620px;
  overflow: auto;
  background: var(--aircas-color-panel-background-deep);
}

.conceptual-model-create__stage {
  position: relative;
  width: 1200px;
  height: 760px;
  transform-origin: 0 0;
}

.conceptual-model-create__edges {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.conceptual-model-create__edges marker path {
  fill: var(--aircas-color-accent-cyan);
}

.conceptual-model-create__edge {
  stroke: var(--aircas-color-accent-cyan);
  stroke-width: 2;
  pointer-events: stroke;
  cursor: pointer;
}

.conceptual-model-create__edge.is-selected {
  stroke: var(--aircas-color-accent-purple);
  stroke-width: 3;
}

.conceptual-model-create__edge-label {
  fill: var(--aircas-color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  paint-order: stroke;
  pointer-events: none;
  stroke: var(--aircas-color-panel-background-deep);
  stroke-width: 4px;
}

.conceptual-model-create__edge-label.is-selected {
  fill: var(--aircas-color-accent-purple);
}

.conceptual-model-create__edge-port {
  fill: var(--aircas-color-accent-cyan);
  stroke: var(--aircas-color-panel-background);
  stroke-width: 2;
  pointer-events: all;
  cursor: grab;
}

.conceptual-model-create__edge-port.is-target {
  fill: var(--aircas-color-accent-purple);
}

.conceptual-model-create__edge-port.is-selected {
  r: 7;
}

.conceptual-model-create__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  color: var(--aircas-color-text-muted);
}

.conceptual-model-create__object {
  position: absolute;
  z-index: 2;
  display: flex;
  width: 190px;
  min-height: 120px;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
  box-shadow: 0 8px 18px var(--aircas-color-divider);
  cursor: move;
}

.conceptual-model-create__object.is-selected {
  border-color: var(--aircas-color-accent-cyan);
  box-shadow: 0 0 14px var(--aircas-color-accent-cyan-soft);
}

.conceptual-model-create__object-type {
  color: var(--aircas-color-accent-cyan);
  font-size: 10px;
}

.conceptual-model-create__object small {
  color: var(--aircas-color-text-secondary);
}

.conceptual-model-create__attributes {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-top: 1px solid var(--aircas-color-border-soft);
  padding-top: 5px;
  font-size: 11px;
}

.conceptual-model-create__attributes button {
  border: 0;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.conceptual-model-create__attributes em {
  float: right;
  color: var(--aircas-color-text-muted);
  font-style: normal;
}

.conceptual-model-create__object-empty {
  margin-top: 8px;
  color: var(--aircas-color-text-muted);
  font-size: 10px;
}

.conceptual-model-create__add {
  align-self: flex-start;
  padding: 0;
  border: 0;
  color: var(--aircas-color-accent-cyan);
  background: transparent;
  font-size: 11px;
  cursor: pointer;
}

.conceptual-model-create__port {
  position: absolute;
  width: 10px;
  height: 10px;
  padding: 0;
  border: 2px solid var(--aircas-color-panel-background);
  border-radius: 50%;
  background: var(--aircas-color-accent-cyan);
  cursor: crosshair;
}

.conceptual-model-create__port.is-top {
  top: -6px;
  left: calc(50% - 5px);
}

.conceptual-model-create__port.is-right {
  top: calc(50% - 5px);
  right: -6px;
}

.conceptual-model-create__port.is-bottom {
  bottom: -6px;
  left: calc(50% - 5px);
}

.conceptual-model-create__port.is-left {
  top: calc(50% - 5px);
  left: -6px;
  background: var(--aircas-color-accent-purple);
}
</style>
