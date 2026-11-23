<template>
  <div :id="mapId" ref="container" class="task-area-map">
    <span class="task-area-map__hint">单击地图添加点位</span>
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as mars3d from "mars3d";
import { initViewer, type ViewerHandle } from "@/utils/initEarth";

const props = defineProps<{ points: [number, number][] }>();
const emit = defineEmits<{ add: [point: [number, number]] }>();
const mapId = `task-area-map-${Math.random().toString(36).slice(2)}`;
const container = ref<HTMLElement | null>(null);
const error = ref("");
let handle: ViewerHandle | null = null;
let handler: mars3d.Cesium.ScreenSpaceEventHandler | null = null;
let layer: mars3d.layer.GraphicLayer | null = null;

/** @description 按当前坐标更新标记和区域连线。 */
function renderPoints(): void {
  if (!layer) return;
  layer.clear();
  props.points.forEach(([lng, lat], index) => {
    layer?.addGraphic(
      new mars3d.graphic.PointEntity({
        position: [lng, lat, 0],
        style: { color: "#4dd2ff", pixelSize: 10, outlineColor: "#ffffff", outlineWidth: 2, label: { text: String(index + 1), pixelOffsetY: -18 } },
      }),
    );
  });
  if (props.points.length >= 2) {
    const points = props.points.map(([lng, lat]) => [lng, lat, 0]);
    const first = points[0];
    if (points.length >= 3 && first) points.push(first);
    layer.addGraphic(new mars3d.graphic.PolylineEntity({ positions: points, style: { color: "#4dd2ff", width: 2 } }));
  }
}

onMounted(() => {
  try {
    handle = initViewer(mapId);
    const map = handle.viewer;
    map.scene.imageryLayers.removeAll();
    map.scene.imageryLayers.addImageryProvider(new mars3d.Cesium.UrlTemplateImageryProvider({ url: DOMAIN_CONFIG.TASK_MAP_TILE_URL }));
    map.scene.morphTo2D(0);
    map.setCameraView({ lat: 24.38979, lng: 121.420244, alt: 2071391.4, heading: 0, pitch: -90 });
    layer = new mars3d.layer.GraphicLayer({ name: "task-area-points" });
    map.addLayer(layer);
    handler = new mars3d.Cesium.ScreenSpaceEventHandler(map.scene.canvas);
    handler.setInputAction((event: { position: mars3d.Cesium.Cartesian2 }) => {
      const ray = map.camera.getPickRay(event.position);
      const position = ray ? map.scene.globe.pick(ray, map.scene) : undefined;
      if (!position) return;
      const coordinate = mars3d.Cesium.Cartographic.fromCartesian(position);
      emit("add", [mars3d.Cesium.Math.toDegrees(coordinate.longitude), mars3d.Cesium.Math.toDegrees(coordinate.latitude)]);
    }, mars3d.Cesium.ScreenSpaceEventType.LEFT_CLICK);
    renderPoints();
  } catch {
    error.value = "地图初始化失败，请检查地图服务配置";
    handler?.destroy();
    handler = null;
    handle?.dispose();
    handle = null;
  }
});
watch(() => props.points, renderPoints, { deep: true });
onBeforeUnmount(() => {
  handler?.destroy();
  handler = null;
  handle?.dispose();
  handle = null;
  layer = null;
});
</script>
<style scoped lang="scss">
.task-area-map {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
}
.task-area-map__hint {
  position: absolute;
  z-index: 1;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background);
  pointer-events: none;
}
.task-area-map p {
  position: absolute;
  z-index: 2;
  color: var(--aircas-color-danger);
}
</style>
