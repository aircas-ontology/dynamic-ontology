<template>
  <div ref="container" class="event-display-map">
    <div ref="creditContainer" class="event-display-map__credits" aria-hidden="true"></div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as Cesium from "mars3d-cesium";
import "mars3d-cesium/Build/Cesium/Widgets/widgets.css";
import type { EventDisplayEvent, EventDisplayTarget } from "@/types";

const props = defineProps<{
  regionPoints: [number, number][];
  targets: EventDisplayTarget[];
  events: EventDisplayEvent[];
  visibleTargetIds: string[];
  selectedTargetId: string;
  showEvents: boolean;
}>();
const emit = defineEmits<{ select: [targetId: string] }>();
const container = ref<HTMLElement | null>(null);
const creditContainer = ref<HTMLElement | null>(null);
let viewer: Cesium.Viewer | null = null;
let handler: Cesium.ScreenSpaceEventHandler | null = null;
const targetEntities = new Map<string, Cesium.Entity>();
const eventEntities: Cesium.Entity[] = [];

/** @description 按当前勾选和选中状态更新目标标记样式。 */
function renderTargetStyles(): void {
  props.targets.forEach((target) => {
    const entity = targetEntities.get(target.id);
    if (!entity || !entity.point || !entity.label) return;
    const selected = target.id === props.selectedTargetId;
    entity.show = props.visibleTargetIds.includes(target.id);
    entity.point.pixelSize = new Cesium.ConstantProperty(selected ? 13 : 8);
    entity.point.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString(selected ? "#ffd45e" : "#38d6ff"));
    entity.label.fillColor = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString(selected ? "#ffd45e" : "#ffffff"));
  });
}

/** @description 按当前视野范围设置二维地图视角。 */
function focusRegion(): void {
  if (!viewer) return;
  const coordinates = [...props.regionPoints, ...props.targets.map((target) => target.coordinates)];
  if (!coordinates.length) return;
  const longitudes = coordinates.map(([lng]) => lng);
  const latitudes = coordinates.map(([, lat]) => lat);
  viewer.camera.setView({
    destination: Cesium.Rectangle.fromDegrees(
      Math.min(...longitudes) - 1.5,
      Math.min(...latitudes) - 1.2,
      Math.max(...longitudes) + 1.5,
      Math.max(...latitudes) + 1.2,
    ),
  });
}

onMounted(() => {
  if (!container.value || !creditContainer.value) return;
  const map = new Cesium.Viewer(container.value, {
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
  viewer = map;
  map.useBrowserRecommendedResolution = false;
  map.resolutionScale = 1;
  map.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({ url: DOMAIN_CONFIG.TASK_MAP_TILE_URL }));
  focusRegion();

  const regionPositions = Cesium.Cartesian3.fromDegreesArray(props.regionPoints.flatMap(([lng, lat]) => [lng, lat]));
  const firstPosition = regionPositions[0];
  if (regionPositions.length >= 3 && firstPosition) {
    map.entities.add({
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(regionPositions),
        material: Cesium.Color.fromCssColorString("#38d6ff").withAlpha(0.12),
      },
    });
    map.entities.add({
      polyline: {
        positions: [...regionPositions, firstPosition],
        width: 2,
        material: Cesium.Color.fromCssColorString("#38d6ff"),
      },
    });
  }

  props.targets.forEach((target) => {
    const [lng, lat] = target.coordinates;
    const entity = new Cesium.Entity({
      id: target.id,
      position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
      point: {
        pixelSize: 8,
        color: Cesium.Color.fromCssColorString("#38d6ff"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
      },
      label: {
        text: `${target.name}\n${target.country} · ${target.type}`,
        font: "12px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString("#04121f"),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      },
    });
    map.entities.add(entity);
    targetEntities.set(target.id, entity);
  });

  props.events.forEach((event) => {
    const [lng, lat] = event.coordinates;
    const entity = map.entities.add({
      id: `event-marker-${event.id}`,
      position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
      point: {
        pixelSize: 7,
        color: Cesium.Color.fromCssColorString("#f7b955"),
        outlineColor: Cesium.Color.fromCssColorString("#2a1a05"),
        outlineWidth: 1,
      },
      label: {
        text: event.title,
        font: "11px sans-serif",
        fillColor: Cesium.Color.fromCssColorString("#ffe0a3"),
        outlineColor: Cesium.Color.fromCssColorString("#2a1a05"),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -14),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      },
      show: props.showEvents,
    });
    eventEntities.push(entity);
  });

  renderTargetStyles();

  handler = new Cesium.ScreenSpaceEventHandler(map.scene.canvas);
  handler.setInputAction((event: { position: Cesium.Cartesian2 }) => {
    const picked: unknown = map.scene.pick(event.position);
    if (!picked || typeof picked !== "object" || !("id" in picked)) return;
    const entity = picked.id;
    if (entity instanceof Cesium.Entity && props.targets.some((target) => target.id === entity.id)) {
      emit("select", entity.id);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
});

watch([() => props.visibleTargetIds, () => props.selectedTargetId], renderTargetStyles, { deep: true });
watch(
  () => props.showEvents,
  (showEvents) => {
    eventEntities.forEach((entity) => {
      entity.show = showEvents;
    });
  },
);

onBeforeUnmount(() => {
  handler?.destroy();
  handler = null;
  targetEntities.clear();
  eventEntities.length = 0;
  if (viewer && !viewer.isDestroyed()) viewer.destroy();
  viewer = null;
});
</script>
<style scoped lang="scss">
.event-display-map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.event-display-map__credits {
  display: none;
}
.event-display-map :deep(.cesium-widget-credits),
.event-display-map :deep(.cesium-credit-logoContainer) {
  display: none !important;
}
</style>
