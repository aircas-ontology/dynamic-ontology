<template>
  <div ref="rootRef" class="relation-graph-2d-view" @click="closeMenu" @contextmenu.prevent>
    <el-empty v-if="!safeItems.length" description="暂无关系类" :image-size="72" />
    <div v-show="safeItems.length" ref="canvasRef" class="relation-graph-2d-view__canvas" aria-label="关系二维图" />
    <div v-if="safeItems.length" class="relation-graph-2d-view__hint">
      拖拽平移 / 节点拖动 · 滚轮缩放 · 悬停查看关系<span v-if="!readonly"> · 右键连线编辑</span>
    </div>
    <div
      v-if="!readonly && contextMenu.visible"
      class="relation-graph-2d-context-menu"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @click.stop
      @contextmenu.prevent
    >
      <button type="button" class="relation-graph-2d-context-menu__item" @click="handleEdit">
        <el-icon><Edit /></el-icon>编辑
      </button>
      <button type="button" class="relation-graph-2d-context-menu__item relation-graph-2d-context-menu__item-danger" @click="handleDelete">
        <el-icon><Delete /></el-icon>删除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Delete, Edit } from "@element-plus/icons-vue";
import type { OntologyRelationClass } from "@/types";
import { createRelationGraph2d, type RelationGraph2dApi } from "../composables/useRelationGraph2d";
import { useDocumentTheme } from "@/composables/shared/useDocumentTheme";

const props = withDefaults(
  defineProps<{
    items?: OntologyRelationClass[];
    seedNames?: string[];
    categoryColors?: Record<string, string>;
    readonly?: boolean;
  }>(),
  {
    items: () => [],
    seedNames: () => [],
    readonly: false,
  },
);

const emit = defineEmits<{
  edit: [item: OntologyRelationClass];
  delete: [item: OntologyRelationClass];
}>();

const rootRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);
const { isDark } = useDocumentTheme();
let graphApi: RelationGraph2dApi | null = null;
let resizeObserver: ResizeObserver | null = null;

const contextMenu = ref({ visible: false, x: 0, y: 0, relationId: "" });
const safeItems = computed(() => (Array.isArray(props.items) ? props.items : []));
const relationMap = computed(() => {
  const map = new Map<string, OntologyRelationClass>();
  safeItems.value.forEach((item) => map.set(item.id, item));
  return map;
});

/**
 * @description 关闭右键菜单。
 */
function closeMenu() {
  contextMenu.value = { visible: false, x: 0, y: 0, relationId: "" };
}

/**
 * @description 在画布坐标系下打开指定关系的右键菜单。
 * @param relationId 关系唯一标识。
 * @param clientX 指针客户区 X。
 * @param clientY 指针客户区 Y。
 */
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

/**
 * @description 触发当前菜单关系的编辑事件。
 */
function handleEdit() {
  const relation = relationMap.value.get(contextMenu.value.relationId);
  closeMenu();
  if (relation) emit("edit", relation);
}

/**
 * @description 触发当前菜单关系的删除事件。
 */
function handleDelete() {
  const relation = relationMap.value.get(contextMenu.value.relationId);
  closeMenu();
  if (relation) emit("delete", relation);
}

/**
 * @description 将当前 props 同步到二维图实例。
 */
function syncGraph() {
  graphApi?.setData({
    items: safeItems.value,
    seedNames: props.seedNames,
    categoryColors: props.categoryColors,
  });
  graphApi?.resize();
}

/**
 * @description 在画布就绪时创建二维图实例。
 */
function ensureGraph() {
  if (graphApi || !canvasRef.value) return;
  graphApi = createRelationGraph2d({
    container: canvasRef.value,
    onEdgeContextMenu: (relationId, clientX, clientY) => {
      if (props.readonly || !relationMap.value.has(relationId)) return;
      openMenuForRelation(relationId, clientX, clientY);
    },
  });
}

onMounted(() => {
  ensureGraph();
  syncGraph();
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

watch(isDark, () => graphApi?.refreshTheme());

watch(
  () => [props.items, props.seedNames, props.categoryColors] as const,
  () => {
    closeMenu();
    void nextTick(() => {
      if (!canvasRef.value) return;
      ensureGraph();
      syncGraph();
    });
  },
  { deep: true },
);
</script>

<style scoped lang="scss">
.relation-graph-2d-view {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background:
    radial-gradient(ellipse 70% 50% at 50% 45%, color-mix(in srgb, var(--aircas-color-effect-primary-fill) 70%, transparent), transparent 72%),
    linear-gradient(165deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.relation-graph-2d-view__canvas {
  position: absolute;
  inset: 0;
}

.relation-graph-2d-view__hint {
  position: absolute;
  right: 12px;
  bottom: 10px;
  z-index: 2;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  pointer-events: none;
}

.relation-graph-2d-view :deep(.relation-graph-2d__svg) {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

.relation-graph-2d-view :deep(.relation-graph-2d__edge-label) {
  fill: var(--aircas-color-text-secondary);
  font-size: 11px;
  font-weight: 600;
  paint-order: stroke;
  stroke: var(--aircas-color-panel-background);
  stroke-width: 3px;
  stroke-linejoin: round;
  pointer-events: none;
}

.relation-graph-2d-view :deep(.relation-graph-2d__node-label) {
  font-size: 12px;
  font-weight: 600;
  pointer-events: none;
}

.relation-graph-2d-context-menu {
  position: absolute;
  z-index: 5;
  display: flex;
  min-width: 112px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 6px;
  background: var(--aircas-color-panel-background);
  box-shadow: var(--aircas-shadow-popup);
}

.relation-graph-2d-context-menu__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 0;
  color: var(--aircas-color-text-regular);
  background: transparent;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.relation-graph-2d-context-menu__item:hover,
.relation-graph-2d-context-menu__item:focus-visible {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-hover);
  outline: none;
}

.relation-graph-2d-context-menu__item-danger {
  color: var(--aircas-color-danger);
}

.relation-graph-2d-context-menu__item-danger:hover,
.relation-graph-2d-context-menu__item-danger:focus-visible {
  color: var(--aircas-color-danger);
  background: var(--aircas-color-effect-danger-fill);
}
</style>
