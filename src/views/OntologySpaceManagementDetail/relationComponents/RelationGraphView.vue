<template>
  <div
    ref="rootRef"
    class="relation-graph-view"
    :class="{ 'relation-graph-view--holographic': layoutMode === 'network' }"
    @click="closeMenu"
    @contextmenu.prevent
  >
    <el-empty v-if="!safeItems.length" description="暂无关系类" :image-size="72" />
    <div v-show="safeItems.length" ref="canvasRef" class="relation-graph-view__canvas" aria-label="关系三维图" />
    <template v-if="layoutMode === 'network'">
      <div class="relation-graph-view__noise" aria-hidden="true" />
      <div class="relation-graph-view__scanlines" aria-hidden="true" />
      <div class="relation-graph-view__vignette" aria-hidden="true" />
    </template>
    <div v-if="safeItems.length && layoutMode === 'network'" class="relation-graph-view__hint">
      拖拽旋转 · 滚轮缩放 · 悬停查看关系<span v-if="!readonly"> · 右键连线编辑</span>
    </div>
    <div
      v-if="!readonly && contextMenu.visible"
      class="relation-graph-context-menu"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @click.stop
      @contextmenu.prevent
    >
      <button type="button" class="relation-graph-context-menu__item" @click="handleEdit">
        <el-icon><Edit /></el-icon>编辑
      </button>
      <button type="button" class="relation-graph-context-menu__item relation-graph-context-menu__item-danger" @click="handleDelete">
        <el-icon><Delete /></el-icon>删除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Delete, Edit } from "@element-plus/icons-vue";
import type { OntologyRelationClass, RelationGraphLayoutMode } from "@/types";
import { createRelationGraph3d, type RelationGraph3dApi } from "../composables/useRelationGraph3d";

const props = withDefaults(
  defineProps<{
    items?: OntologyRelationClass[];
    layoutMode?: RelationGraphLayoutMode;
    seedNames?: string[];
    maxHop?: number;
    categoryColors?: Record<string, string>;
    readonly?: boolean;
  }>(),
  {
    items: () => [],
    layoutMode: "star",
    seedNames: () => [],
    maxHop: 2,
    readonly: false,
  },
);

const emit = defineEmits<{
  edit: [item: OntologyRelationClass];
  delete: [item: OntologyRelationClass];
}>();

const rootRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);
let graphApi: RelationGraph3dApi | null = null;
let resizeObserver: ResizeObserver | null = null;

const contextMenu = ref({ visible: false, x: 0, y: 0, relationId: "" });
const safeItems = computed(() => (Array.isArray(props.items) ? props.items : []));
const relationMap = computed(() => {
  const map = new Map<string, OntologyRelationClass>();
  safeItems.value.forEach((item) => map.set(item.id, item));
  return map;
});

function closeMenu() {
  contextMenu.value = { visible: false, x: 0, y: 0, relationId: "" };
}

function openMenuForRelation(relationId: string, clientX: number, clientY: number) {
  if (props.readonly || !rootRef.value) return;
  const rect = rootRef.value.getBoundingClientRect();
  contextMenu.value = {
    visible: true,
    x: clientX - rect.left,
    y: clientY - rect.top,
    relationId,
  };
}

function handleEdit() {
  const relation = relationMap.value.get(contextMenu.value.relationId);
  closeMenu();
  if (relation) emit("edit", relation);
}

function handleDelete() {
  const relation = relationMap.value.get(contextMenu.value.relationId);
  closeMenu();
  if (relation) emit("delete", relation);
}

async function syncGraph() {
  const api = graphApi;
  if (!api) return;
  await api.setData({
    items: safeItems.value,
    layoutMode: props.layoutMode,
    seedNames: props.seedNames,
    maxHop: props.maxHop,
    categoryColors: props.categoryColors,
  });
  if (graphApi !== api) return;
  api.resize();
}

function ensureGraph() {
  if (graphApi || !canvasRef.value) return;
  graphApi = createRelationGraph3d({
    container: canvasRef.value,
    onEdgeContextMenu: (relationId, clientX, clientY) => {
      if (props.readonly || !relationMap.value.has(relationId)) return;
      openMenuForRelation(relationId, clientX, clientY);
    },
  });
}

onMounted(() => {
  ensureGraph();
  void syncGraph();
  if (canvasRef.value) {
    resizeObserver = new ResizeObserver(() => graphApi?.resize());
    resizeObserver.observe(canvasRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  graphApi?.dispose();
  graphApi = null;
});

watch(
  () => [props.items, props.layoutMode, props.seedNames, props.maxHop, props.categoryColors] as const,
  () => {
    closeMenu();
    void nextTick(async () => {
      if (!canvasRef.value) return;
      ensureGraph();
      await syncGraph();
    });
  },
  { deep: true },
);
</script>

<style lang="scss" scoped>
.relation-graph-view {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(165deg, var(--aircas-color-section-background), var(--aircas-color-panel-background-deep));
}
.relation-graph-view__canvas {
  width: 100%;
  height: 100%;
  min-height: 320px;
  cursor: grab;
}
.relation-graph-view--holographic {
  background: var(--aircas-color-page-background);
  justify-content: center;
}
.relation-graph-view__noise,
.relation-graph-view__scanlines,
.relation-graph-view__vignette {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.relation-graph-view__noise {
  opacity: 0.055;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E");
  mix-blend-mode: screen;
}
.relation-graph-view__scanlines {
  opacity: 0.12;
  background: repeating-linear-gradient(to bottom, transparent 0, transparent 3px, var(--aircas-color-accent-cyan-soft) 4px);
}
.relation-graph-view__vignette {
  background: radial-gradient(circle, transparent 50%, var(--aircas-color-overlay) 118%);
}
.relation-graph-view__hint {
  z-index: 3;
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  text-align: center;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  pointer-events: none;
}
.relation-graph-context-menu {
  position: absolute;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 112px;
  padding: 6px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
  box-shadow: 0 8px 24px var(--aircas-color-divider);
}
.relation-graph-context-menu__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--aircas-color-transparent);
  border-radius: 4px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-transparent);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}
.relation-graph-context-menu__item:hover {
  border-color: var(--aircas-color-border);
  background: var(--aircas-color-accent-blue-soft);
}
.relation-graph-context-menu__item-danger {
  color: var(--aircas-color-danger);
}
</style>
