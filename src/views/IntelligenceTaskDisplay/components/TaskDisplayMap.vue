<template>
  <div :id="mapId" class="task-display-map">
    <p v-if="error" role="alert">{{ error }}</p>
    <Teleport v-if="menuElement && selectedTarget" :to="menuElement">
      <div class="task-display-map__radial" @click.stop @pointerdown.stop>
        <button v-for="(item, index) in menuItems" :key="item" type="button" :style="{ '--index': index }" @click="emit('detail', item)">{{ item }}</button>
        <span>{{ selectedTarget.name }}</span>
      </div>
    </Teleport>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import * as mars3d from "mars3d";
import { initViewer, type ViewerHandle } from "@/utils/initEarth";
import { taskDisplayArea, taskDisplayTargets } from "@/mocks/intelligenceTaskDisplayMock";
import { findTaskTarget } from "../utils/taskTargets";
import { createTargetMenuController } from "../utils/targetMenu";
const props = defineProps<{ mode: "2d" | "3d"; selectedId: string | null; menuVisible: boolean }>();
const emit = defineEmits<{ select: [id: string]; detail: [name: string] }>();
const mapId = `task-display-map-${Math.random().toString(36).slice(2)}`;
const error = ref("");
let handle: ViewerHandle | null = null;
let layer: mars3d.layer.GraphicLayer | null = null;
let menuLayer: mars3d.layer.GraphicLayer | null = null;
let handler: mars3d.Cesium.ScreenSpaceEventHandler | null = null;
const menuElement = shallowRef<HTMLDivElement | null>(null);
const selectedTarget = computed(() => (props.selectedId ? findTaskTarget(taskDisplayTargets, props.selectedId) : undefined));
const menuItems = ["基本信息", "特征参数", "位置运动", "装备运行状态", "人员相关信息", "关联事件", "目标隐含关系", "图谱"];
const menuController = createTargetMenuController((target) => {
  const element = document.createElement("div");
  const graphic = new mars3d.graphic.DivGraphic({
    position: [target.longitude, target.latitude, 0],
    style: { html: element, horizontalOrigin: mars3d.Cesium.HorizontalOrigin.CENTER, verticalOrigin: mars3d.Cesium.VerticalOrigin.BOTTOM },
    pointerEvents: true,
  });
  menuLayer?.addGraphic(graphic);
  menuElement.value = element;
  return () => {
    menuElement.value = null;
    menuLayer?.removeGraphic(graphic);
  };
});

/** @description 根据当前选择同步地图上的目标菜单。 */
function syncTargetMenu(): void {
  if (menuLayer && props.menuVisible && selectedTarget.value) menuController.show(selectedTarget.value);
  else menuController.clear();
}

/** @description 绘制区域与目标并突出当前选中目标。 */
function renderTaskTargets(): void {
  if (!layer) return;
  layer.clear();
  const area = taskDisplayArea.map(([lng, lat]) => [lng, lat, 0]);
  const first = area[0];
  if (first) area.push(first);
  layer.addGraphic(new mars3d.graphic.PolylineEntity({ positions: area, style: { color: "#4dd2ff", width: 3 } }));
  taskDisplayTargets.forEach((target) => {
    layer?.addGraphic(
      new mars3d.graphic.PointEntity({
        position: [target.longitude, target.latitude, 0],
        attr: { targetId: target.id },
        style: {
          color: "#1d85ff",
          pixelSize: target.id === props.selectedId ? 18 : 12,
          outlineColor: "#4dd2ff",
          outlineWidth: target.id === props.selectedId ? 4 : 2,
          label: { text: target.name, pixelOffsetY: 20 },
        },
      }),
    );
  });
  handle?.viewer.scene.requestRender();
}

/** @description 定位到目标坐标。 @param id 目标标识。 */
function locateTarget(id: string): void {
  const target = findTaskTarget(taskDisplayTargets, id);
  if (target && handle)
    handle.viewer.setCameraView({ lat: target.latitude, lng: target.longitude, alt: 250000, heading: 0, pitch: props.mode === "2d" ? -90 : -60 });
}
defineExpose({ locateTarget });
onMounted(() => {
  try {
    handle = initViewer(mapId);
    const map = handle.viewer;
    map.scene.imageryLayers.removeAll();
    map.scene.imageryLayers.addImageryProvider(new mars3d.Cesium.UrlTemplateImageryProvider({ url: DOMAIN_CONFIG.TASK_MAP_TILE_URL }));
    map.scene.morphTo2D(0);
    map.setCameraView({ lat: 23.6, lng: 121.1, alt: 800000, heading: 0, pitch: -90 });
    layer = new mars3d.layer.GraphicLayer({ name: "task-display" });
    map.addLayer(layer);
    menuLayer = new mars3d.layer.GraphicLayer({ name: "task-target-menu" });
    map.addLayer(menuLayer);
    layer.on(mars3d.EventType.click, (event: { graphic?: { attr?: { targetId?: unknown } } }) => {
      const id = event.graphic?.attr?.targetId;
      if (typeof id === "string") emit("select", id);
    });
    renderTaskTargets();
    syncTargetMenu();
  } catch {
    error.value = "地图初始化失败，请检查地图服务配置";
    handler?.destroy();
    handler = null;
    handle?.dispose();
    handle = null;
  }
});
watch(() => props.selectedId, renderTaskTargets);
watch(() => [props.selectedId, props.menuVisible], syncTargetMenu);
watch(
  () => props.mode,
  (mode) => {
    if (!handle) return;
    if (mode === "2d") handle.viewer.scene.morphTo2D(0);
    else handle.viewer.scene.morphTo3D(0);
  },
);
onBeforeUnmount(() => {
  menuController.clear();
  handler?.destroy();
  handler = null;
  handle?.dispose();
  handle = null;
  layer = null;
  menuLayer = null;
});
</script>
<style scoped lang="scss">
.task-display-map {
  position: absolute;
  inset: 0;
}
.task-display-map p {
  position: absolute;
  z-index: 2;
  color: var(--aircas-color-danger);
}
.task-display-map :deep(.task-display-map__radial) {
  position: relative;
  width: 280px;
  height: 185px;
}
.task-display-map :deep(.task-display-map__radial button) {
  position: absolute;
  left: calc(50% + 105px * cos((var(--index) * 180deg / 7) + 180deg));
  top: calc(85% + 105px * sin((var(--index) * 180deg / 7) + 180deg));
  width: 56px;
  height: 56px;
  transform: translate(-50%, -50%);
  border: 2px solid var(--aircas-color-primary);
  border-radius: 50%;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background-deep);
  font-size: 11px;
  cursor: pointer;
}
.task-display-map :deep(.task-display-map__radial button:focus-visible) {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 3px;
}
.task-display-map :deep(.task-display-map__radial span) {
  position: absolute;
  top: 88%;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px;
  background: var(--aircas-color-panel-background-deep);
  white-space: nowrap;
}
</style>
