<template>
  <div ref="container" class="event-area-map">
    <span class="event-area-map__hint">单击地图添加点位</span>
    <p v-if="error" role="alert">{{ error }}</p>
    <div ref="creditContainer" class="event-area-map__credits" aria-hidden="true"></div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as Cesium from "mars3d-cesium";
import "mars3d-cesium/Build/Cesium/Widgets/widgets.css";

const props = defineProps<{ points: [number, number][] }>();
const emit = defineEmits<{ add: [point: [number, number]] }>();
const container = ref<HTMLElement | null>(null);
const creditContainer = ref<HTMLElement | null>(null);
const error = ref("");
let viewer: Cesium.Viewer | null = null;
let handler: Cesium.ScreenSpaceEventHandler | null = null;
const entities: Cesium.Entity[] = [];

/** @description 按当前坐标更新标记和区域连线。 */
function renderPoints(): void {
  if (!viewer) return;
  const map = viewer;
  entities.forEach((entity) => map.entities.remove(entity));
  entities.length = 0;
  props.points.forEach(([lng, lat], index) => {
    entities.push(
      map.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString("#4dd2ff"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: String(index + 1),
          font: "12px sans-serif",
          fillColor: Cesium.Color.WHITE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
        },
      }),
    );
  });
  if (props.points.length >= 2) {
    const positions = props.points.map(([lng, lat]) => Cesium.Cartesian3.fromDegrees(lng, lat, 0));
    const first = positions[0];
    if (positions.length >= 3 && first) positions.push(first);
    entities.push(
      map.entities.add({
        polyline: { positions, width: 2, material: Cesium.Color.fromCssColorString("#4dd2ff") },
      }),
    );
  }
}

onMounted(() => {
  try {
    if (!container.value || !creditContainer.value) return;
    viewer = new Cesium.Viewer(container.value, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      baseLayer: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      sceneMode: Cesium.SceneMode.SCENE2D,
      shouldAnimate: false,
      creditContainer: creditContainer.value,
    });
    const map = viewer;
    map.useBrowserRecommendedResolution = false;
    map.resolutionScale = 1;
    map.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({ url: DOMAIN_CONFIG.TASK_MAP_TILE_URL }));
    map.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(121.420244, 24.38979, 2071391.4),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
    });
    handler = new Cesium.ScreenSpaceEventHandler(map.scene.canvas);
    handler.setInputAction((event: { position: Cesium.Cartesian2 }) => {
      const ray = map.camera.getPickRay(event.position);
      const position = ray ? map.scene.globe.pick(ray, map.scene) : undefined;
      if (!position) return;
      const coordinate = Cesium.Cartographic.fromCartesian(position);
      emit("add", [Cesium.Math.toDegrees(coordinate.longitude), Cesium.Math.toDegrees(coordinate.latitude)]);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    renderPoints();
  } catch {
    error.value = "地图初始化失败，请检查地图服务配置";
    handler?.destroy();
    handler = null;
    if (viewer && !viewer.isDestroyed()) viewer.destroy();
    viewer = null;
  }
});
watch(() => props.points, renderPoints, { deep: true });
onBeforeUnmount(() => {
  handler?.destroy();
  handler = null;
  if (viewer && !viewer.isDestroyed()) viewer.destroy();
  viewer = null;
  entities.length = 0;
});
</script>
<style scoped lang="scss">
.event-area-map {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
}
.event-area-map__hint {
  position: absolute;
  z-index: 1;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background);
  pointer-events: none;
}
.event-area-map__credits {
  display: none;
}
.event-area-map :deep(.cesium-widget-credits),
.event-area-map :deep(.cesium-credit-logoContainer) {
  display: none !important;
}
.event-area-map p {
  position: absolute;
  z-index: 2;
  color: var(--aircas-color-danger);
}
</style>
