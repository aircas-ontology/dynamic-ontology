<template>
  <div
    ref="rootRef"
    class="relation-graph-view"
    :class="{ 'relation-graph-view--holographic': layoutMode === 'network' }"
    @click="closeMenu"
    @contextmenu.prevent
  >
    <div v-if="graphError" class="relation-graph-view__error" role="alert">
      <p>{{ graphError }}</p>
      <el-button @click="initializeGraph">重试</el-button>
    </div>
    <AircasLoading v-else-if="graphInitializing">正在初始化三维图…</AircasLoading>
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
import { createRelationGraph3d, type RelationGraph3dApi } from "./OntologyRelationGraph3d/createRelationGraph3d";
import { useDocumentTheme } from "@/composables/shared/useDocumentTheme";
import AircasLoading from "@/components/AircasLoading.vue";

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
const { isDark } = useDocumentTheme();
const canvasRef = ref<HTMLElement | null>(null);
let graphApi: RelationGraph3dApi | null = null;
let resizeObserver: ResizeObserver | null = null;
const graphError = ref("");
const graphInitializing = ref(true);
let disposed = false;

const contextMenu = ref({ visible: false, x: 0, y: 0, relationId: "" });
const safeItems = computed(() => (Array.isArray(props.items) ? props.items : []));
const relationMap = computed(() => {
  const map = new Map<string, OntologyRelationClass>();
  safeItems.value.forEach((item) => map.set(item.id, item));
  return map;
});

/** @description 关闭关系管理菜单。 */
function closeMenu() {
  contextMenu.value = { visible: false, x: 0, y: 0, relationId: "" };
}

/** @description 管理模式下打开指定关系菜单；只读模式不显示。 @param relationId 输入参数。 @param clientX 输入参数。 @param clientY 输入参数。 */
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

/** @description 发出关系编辑事件并关闭菜单。 */
function handleEdit() {
  const relation = relationMap.value.get(contextMenu.value.relationId);
  closeMenu();
  if (relation) emit("edit", relation);
}

/** @description 发出关系删除事件并关闭菜单。 */
function handleDelete() {
  const relation = relationMap.value.get(contextMenu.value.relationId);
  closeMenu();
  if (relation) emit("delete", relation);
}

/** @description 同步共享关系图数据并在失败时释放场景。 */
async function syncGraph() {
  const api = graphApi;
  if (!api) return;
  try {
    await api.setData({
      items: safeItems.value,
      layoutMode: props.layoutMode,
      seedNames: props.seedNames,
      maxHop: props.maxHop,
      categoryColors: props.categoryColors,
    });
    if (graphApi !== api) return;
    api.resize();
    graphInitializing.value = false;
    graphError.value = "";
  } catch (cause) {
    if (disposed || graphApi !== api) return;
    graphError.value = cause instanceof Error ? cause.message : "三维关系图加载失败";
    graphInitializing.value = false;
    api.dispose();
    graphApi = null;
  }
}

/** @description 仅在可用容器上创建一个共享关系图实例。 */
function ensureGraph() {
  if (disposed || graphApi || !canvasRef.value) return;
  try {
    graphApi = createRelationGraph3d({
      container: canvasRef.value,
      onEdgeContextMenu: (relationId, clientX, clientY) => {
        if (props.readonly || !relationMap.value.has(relationId)) return;
        openMenuForRelation(relationId, clientX, clientY);
      },
    });
  } catch (cause) {
    graphInitializing.value = false;
    graphError.value = cause instanceof Error ? cause.message : "三维关系图初始化失败";
  }
}

/** @description 初始化或重试三维关系图，复用同一容器并避免重复观察器。 */
function initializeGraph(): void {
  if (disposed) return;
  graphError.value = "";
  graphInitializing.value = true;
  ensureGraph();
  void syncGraph();
  if (canvasRef.value && !resizeObserver) {
    resizeObserver = new ResizeObserver(() => graphApi?.resize());
    resizeObserver.observe(canvasRef.value);
  }
}
onMounted(initializeGraph);

onBeforeUnmount(() => {
  disposed = true;
  resizeObserver?.disconnect();
  resizeObserver = null;
  graphApi?.dispose();
  graphApi = null;
});

watch(isDark, () => graphApi?.refreshTheme());

watch(
  () => [props.items, props.layoutMode, props.seedNames, props.maxHop, props.categoryColors] as const,
  () => {
    closeMenu();
    void nextTick(async () => {
      if (disposed || !canvasRef.value) return;
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
  background:
    radial-gradient(ellipse 80% 48% at 50% 72%, color-mix(in srgb, var(--aircas-color-effect-primary-fill) 90%, transparent) 0%, transparent 70%),
    radial-gradient(ellipse 58% 42% at 50% 38%, color-mix(in srgb, var(--aircas-color-effect-blue-fill) 80%, transparent) 0%, transparent 65%),
    linear-gradient(
      165deg,
      color-mix(in srgb, var(--aircas-color-panel-background) 72%, var(--aircas-color-panel-background) 28%),
      color-mix(in srgb, var(--aircas-color-panel-background-deep) 55%, var(--aircas-color-panel-background) 45%)
    );
}

:root:not(.dark) .relation-graph-view:not(.relation-graph-view--holographic) {
  background:
    radial-gradient(ellipse 80% 48% at 50% 72%, color-mix(in srgb, var(--aircas-color-effect-primary-fill) 90%, transparent) 0%, transparent 70%),
    radial-gradient(ellipse 58% 42% at 50% 38%, color-mix(in srgb, var(--aircas-color-effect-blue-fill) 80%, transparent) 0%, transparent 65%),
    linear-gradient(165deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}
.relation-graph-view__canvas {
  width: 100%;
  height: 100%;
  min-height: 320px;
  cursor: grab;
}
.relation-graph-view__error {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--aircas-color-panel-background);
  color: var(--aircas-color-text-secondary);
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
  background: repeating-linear-gradient(to bottom, transparent 0, transparent 3px, color-mix(in srgb, var(--aircas-color-primary) 7%, transparent) 4px);
}
.relation-graph-view__vignette {
  background: radial-gradient(circle, transparent 50%, color-mix(in srgb, var(--aircas-color-black) 72%, transparent) 118%);
}
.relation-graph-view__hint {
  z-index: 3;
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  text-align: center;
  color: var(--aircas-color-text-secondary);
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
  box-shadow: 0 8px 24px var(--aircas-color-border-light);
}

:root:not(.dark) .relation-graph-context-menu {
  background: var(--aircas-color-card-background);
}
.relation-graph-context-menu__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--aircas-color-effect-blue-border);
  border-radius: 4px;
  color: var(--aircas-color-category-blue);
  background: var(--aircas-color-effect-blue-soft);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}
.relation-graph-context-menu__item:hover,
.relation-graph-context-menu__item:focus-visible {
  color: var(--aircas-color-text-primary);
  border-color: var(--aircas-color-category-blue);
  background: var(--aircas-color-effect-blue-fill);
}
.relation-graph-context-menu__item-danger {
  color: var(--aircas-color-danger);
  border-color: var(--aircas-color-danger);
  background: var(--aircas-color-effect-danger-fill);
  box-shadow: inset 0 0 12px var(--aircas-color-effect-danger-fill);
}
.relation-graph-context-menu__item-danger:hover,
.relation-graph-context-menu__item-danger:focus-visible {
  color: var(--aircas-color-danger);
  border-color: var(--aircas-color-danger);
  background: color-mix(in srgb, var(--aircas-color-danger) 32%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--aircas-color-danger) 35%, transparent);
}
</style>
