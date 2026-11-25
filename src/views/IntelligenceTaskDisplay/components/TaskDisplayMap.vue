<template>
  <div class="task-display-map">
    <div ref="mapElement" class="task-display-map" />
    <p v-if="error" role="alert">{{ error }}</p>
    <div
      v-if="props.menuVisible && selectedTarget && menuPosition"
      class="task-display-map__radial"
      :style="{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }"
      @click.stop
      @pointerdown.stop
    >
      <button v-for="(item, index) in menuItems" :key="item" type="button" :style="{ '--index': index }" @click="emit('detail', item)">{{ item }}</button>
      <span>{{ selectedTarget.name }}</span>
    </div>
    <aside
      v-if="props.targetEventsVisible && selectedTarget && menuPosition"
      class="task-display-map__event-card"
      :style="{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }"
      @pointerdown.stop
      @click.stop
    >
      <header>
        <strong>{{ selectedTarget.name }} · 关联事件</strong><button type="button" aria-label="关闭关联事件卡片" @click="emit('closeTargetEvents')">×</button>
      </header>
      <div class="task-display-map__event-card-title">
        关联事件 <span>{{ targetEvents.length }}</span>
      </div>
      <div v-if="targetEvents.length" class="task-display-map__event-list">
        <button v-for="event in targetEvents" :key="event.id" type="button" @click="emit('openEvent', event.id)">{{ event.time }} {{ event.name }}</button>
      </div>
      <p v-else class="task-display-map__event-empty">暂无关联事件</p>
    </aside>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as Cesium from "mars3d-cesium";
import "mars3d-cesium/Build/Cesium/Widgets/widgets.css";
import { taskDisplayTargets, taskDisplayEvents } from "@/mocks/intelligenceTaskDisplayMock";
import { findTaskTarget } from "../utils/taskTargets";
import { buildReplaySchedule } from "../utils/eventReplay";
import { getTargetEvents } from "../utils/targetEvents";
const props = defineProps<{
  mode: "2d" | "3d";
  regionPoints: readonly [number, number][];
  selectedId: string | null;
  menuVisible: boolean;
  targetEventsVisible: boolean;
  replayActive: boolean;
  replayPlaying: boolean;
  replaySpeed: number;
  replayTime: number;
}>();
const emit = defineEmits<{ select: [id: string]; detail: [name: string]; replayTick: [time: number]; closeTargetEvents: []; openEvent: [id: string] }>();
const mapElement = ref<HTMLElement | null>(null);
const error = ref("");
const menuPosition = ref<{ x: number; y: number } | null>(null);
const selectedTarget = computed(() => (props.selectedId ? findTaskTarget(taskDisplayTargets, props.selectedId) : undefined));
const targetEvents = computed(() =>
  getTargetEvents(
    taskDisplayEvents.flatMap((phase) => phase.events),
    selectedTarget.value?.name ?? "",
  ),
);
const menuItems = ["基本信息", "特征参数", "位置运动", "装备运行状态", "人员相关信息", "关联事件", "目标隐含关系", "图谱"];
const schedule = buildReplaySchedule(
  taskDisplayEvents.flatMap((phase) => phase.events),
  taskDisplayTargets,
);
let viewer: Cesium.Viewer | undefined;
let handler: Cesium.ScreenSpaceEventHandler | undefined;
let removeTick: (() => void) | undefined;
let removePostRender: (() => void) | undefined;
let taskAreaEntity: Cesium.Entity | undefined;
const replayEntities: Cesium.Entity[] = [];
let lastEmittedSecond = -1;
/** @description 从当前主题解析地图颜色。 @param token 主题变量。 @returns Cesium 颜色。 */
function resolveMapColor(token: string): Cesium.Color {
  return Cesium.Color.fromCssColorString(getComputedStyle(document.documentElement).getPropertyValue(token).trim()) ?? Cesium.Color.CYAN;
}
/** @description 以目标列表相同的路径绘制地图图标。 @returns 高分辨率图标画布。 */
function createTargetIcon(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法绘制目标图标");
  context.scale(4, 4);
  context.strokeStyle = resolveMapColor("--aircas-color-primary").toCssColorString();
  context.lineWidth = 1.5;
  context.lineJoin = "round";
  context.stroke(new Path2D("M12 2 7 7v14h10V7l-5-5Zm0 0v19M7 7h10"));
  return canvas;
}
/** @description 用 Cesium 实体绘制地图目标。 */
function renderTaskTargets(): void {
  if (!viewer) return;
  const icon = createTargetIcon();
  taskDisplayTargets.forEach((target) =>
    viewer?.entities.add({
      id: target.id,
      position: Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude),
      billboard: { image: icon, width: 24, height: 24, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      label: {
        text: target.name,
        font: "14px sans-serif",
        pixelOffset: new Cesium.Cartesian2(0, 22),
        fillColor: Cesium.Color.WHITE,
        showBackground: true,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    }),
  );
}
/**
 * @description 清除旧区域并按当前任务详情区域点位重绘闭合边界，同时定位到区域范围。
 */
function renderTaskArea(): void {
  if (!viewer) return;
  if (taskAreaEntity) viewer.entities.remove(taskAreaEntity);
  taskAreaEntity = undefined;
  if (props.regionPoints.length < 3) return;

  const positions = [...props.regionPoints, props.regionPoints[0]!].flatMap(([longitude, latitude]) => [longitude, latitude]);
  const cartesianPositions = Cesium.Cartesian3.fromDegreesArray(positions);
  taskAreaEntity = viewer.entities.add({
    id: "task-area",
    polyline: { positions: cartesianPositions, width: 3, material: resolveMapColor("--aircas-color-primary") },
  });
  viewer.camera.flyTo({ destination: Cesium.Rectangle.fromCartesianArray(cartesianPositions) });
}
/** @description 将历史事件绘制为 Cesium Billboard 卡片图片。 @param title 事件标题。 @param time 事件时间。 @param description 事件说明。 @returns 卡片画布。 */
function createEventCard(title: string, time: string, description: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 760;
  canvas.height = 240;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法绘制事件卡片");
  context.scale(2, 2);
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--aircas-color-panel-background-deep").trim();
  context.fillRect(0, 0, 380, 120);
  context.fillStyle = resolveMapColor("--aircas-color-primary").toCssColorString();
  context.font = "bold 16px sans-serif";
  context.fillText(title.slice(0, 22), 14, 26);
  context.fillStyle = resolveMapColor("--aircas-color-text-primary").toCssColorString();
  context.font = "13px sans-serif";
  context.fillText(time, 14, 49);
  for (let index = 0; index < 2; index++) context.fillText(description.slice(index * 25, (index + 1) * 25), 14, 73 + index * 21);
  return canvas;
}
/** @description 创建由 Cesium 时间区间控制的卡片和扩散圆；同一事件支持多个关联目标。 */
function createReplayEntities(): void {
  if (!viewer) return;
  schedule.forEach((item) =>
    item.targetIds.forEach((id) => {
      const target = findTaskTarget(taskDisplayTargets, id);
      if (!target || !viewer) return;
      const start = Cesium.JulianDate.fromDate(new Date(item.start));
      const end = Cesium.JulianDate.fromDate(new Date(item.end));
      const availability = new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({ start, stop: end, isStopIncluded: false })]);
      const position = Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude);
      const card = viewer.entities.add({
        availability,
        position,
        show: false,
        billboard: {
          image: createEventCard(item.event.name, item.event.time, item.event.description),
          width: 380,
          height: 120,
          pixelOffset: new Cesium.Cartesian2(26, -48),
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      const radius = new Cesium.CallbackProperty(
        (time: Cesium.JulianDate | undefined) => 1500 + (((time ? Cesium.JulianDate.secondsDifference(time, start) : 0) % 3600) / 3600) * 12000,
        false,
      );
      const circle = viewer.entities.add({
        availability,
        position,
        show: false,
        ellipse: {
          semiMajorAxis: radius,
          semiMinorAxis: radius,
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty((time: Cesium.JulianDate | undefined) => {
              const phase = ((time ? Cesium.JulianDate.secondsDifference(time, start) : 0) % 3600) / 3600;
              return resolveMapColor("--aircas-color-primary").withAlpha((1 - phase) * 0.5);
            }, false),
          ),
          outline: true,
          outlineColor: resolveMapColor("--aircas-color-primary"),
        },
      });
      replayEntities.push(card, circle);
    }),
  );
}
/** @description 将进度条、倍速和暂停状态同步到 Cesium 时钟。 */
function syncReplayClock(): void {
  if (!viewer) return;
  viewer.clock.shouldAnimate = props.replayActive && props.replayPlaying;
  viewer.clock.multiplier = 3600 * props.replaySpeed;
  replayEntities.forEach((entity) => {
    entity.show = props.replayActive;
  });
  if (props.replayActive && Math.abs(Cesium.JulianDate.toDate(viewer.clock.currentTime).getTime() - props.replayTime) > 1500) {
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(props.replayTime));
  }
}
/** @description 定位到目标坐标。 @param id 目标标识。 */
function locateTarget(id: string): void {
  const target = findTaskTarget(taskDisplayTargets, id);
  if (!target || !viewer) return;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, 250000),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(props.mode === "2d" ? -90 : -60), roll: 0 },
  });
}
/** @description 释放地图实例、时钟订阅和屏幕事件。 */
function disposeTaskMap(): void {
  removeTick?.();
  removePostRender?.();
  handler?.destroy();
  removeTick = undefined;
  removePostRender = undefined;
  handler = undefined;
  if (viewer && !viewer.isDestroyed()) viewer.destroy();
  viewer = undefined;
  taskAreaEntity = undefined;
  replayEntities.length = 0;
}
defineExpose({ locateTarget });
onMounted(() => {
  try {
    if (!mapElement.value) return;
    viewer = new Cesium.Viewer(mapElement.value, {
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
    });
    viewer.useBrowserRecommendedResolution = false;
    viewer.resolutionScale = 1;
    viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({ url: DOMAIN_CONFIG.TASK_MAP_TILE_URL }));
    viewer.camera.setView({ destination: Cesium.Rectangle.fromDegrees(118.5, 20.5, 123.5, 26.5) });
    renderTaskTargets();
    renderTaskArea();
    createReplayEntities();
    const first = schedule[0];
    const last = schedule.at(-1);
    if (first && last) {
      viewer.clock.startTime = Cesium.JulianDate.fromDate(new Date(first.start));
      viewer.clock.stopTime = Cesium.JulianDate.fromDate(new Date(last.end));
      viewer.clock.currentTime = Cesium.JulianDate.clone(viewer.clock.startTime);
      viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
    }
    viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((event: { position: Cesium.Cartesian2 }) => {
      const picked: unknown = viewer?.scene.pick(event.position);
      if (
        typeof picked === "object" &&
        picked !== null &&
        "id" in picked &&
        picked.id instanceof Cesium.Entity &&
        findTaskTarget(taskDisplayTargets, picked.id.id)
      )
        emit("select", picked.id.id);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    removePostRender = viewer.scene.postRender.addEventListener(() => {
      const target = selectedTarget.value;
      if (!target || (!props.menuVisible && !props.targetEventsVisible) || !viewer) {
        menuPosition.value = null;
        return;
      }
      const point = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude));
      menuPosition.value = point ? { x: point.x, y: point.y } : null;
    });
    removeTick = viewer.clock.onTick.addEventListener((clock: Cesium.Clock) => {
      if (!props.replayActive) return;
      const time = Cesium.JulianDate.toDate(clock.currentTime).getTime();
      const second = Math.floor(time / 1000);
      if (second !== lastEmittedSecond) {
        lastEmittedSecond = second;
        emit("replayTick", time);
      }
    });
    syncReplayClock();
  } catch {
    error.value = "地图初始化失败，请检查地图服务配置";
    disposeTaskMap();
  }
});
watch(() => [props.replayActive, props.replayPlaying, props.replaySpeed, props.replayTime], syncReplayClock);
watch(() => props.regionPoints, renderTaskArea);
watch(
  () => props.mode,
  (mode) => {
    if (mode === "2d") viewer?.scene.morphTo2D(0);
    else viewer?.scene.morphTo3D(0);
  },
);
onBeforeUnmount(disposeTaskMap);
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
.task-display-map__event-card {
  position: absolute;
  z-index: 3;
  width: min(340px, 80vw);
  max-height: 260px;
  transform: translate(22px, -50%);
  overflow: auto;
  border: 1px solid var(--aircas-color-primary);
  border-radius: 6px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background);
}
.task-display-map__event-card header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--aircas-color-border);
}
.task-display-map__event-card header button {
  margin-left: auto;
  border: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
}
.task-display-map__event-card-title {
  padding: 10px 12px 4px;
  color: var(--aircas-color-primary);
}
.task-display-map__event-card-title span {
  float: right;
  color: var(--aircas-color-text-secondary);
}
.task-display-map__event-list {
  display: grid;
  padding: 0 12px 10px;
}
.task-display-map__event-list button {
  padding: 6px 0;
  border: 0;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.task-display-map__event-list button:hover,
.task-display-map__event-list button:focus-visible {
  color: var(--aircas-color-primary);
}
.task-display-map p.task-display-map__event-empty {
  position: static;
  margin: 0;
  padding: 8px 12px 12px;
  color: var(--aircas-color-text-secondary);
}
.task-display-map :deep(.task-display-map__radial) {
  position: absolute;
  transform: translate(-50%, -100%);
  width: 360px;
  height: 250px;
}
.task-display-map :deep(.task-display-map__radial button) {
  position: absolute;
  left: calc(50% + 140px * cos((var(--index) * 180deg / 7) + 180deg));
  top: calc(82% + 140px * sin((var(--index) * 180deg / 7) + 180deg));
  width: 56px;
  height: 56px;
  transform: translate(-50%, -50%) scale(0.35);
  opacity: 0;
  border: 2px solid var(--aircas-color-primary);
  border-radius: 50%;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background-deep);
  font-size: 11px;
  cursor: pointer;
  animation: task-display-menu-item-open 360ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--index) * 45ms);
}
@keyframes task-display-menu-item-open {
  from {
    transform: translate(-50%, -50%) scale(0.35);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}
.task-display-map :deep(.task-display-map__radial button:focus-visible) {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 3px;
}
.task-display-map :deep(.task-display-map__radial span) {
  position: absolute;
  top: 89%;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px;
  background: var(--aircas-color-panel-background-deep);
  white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  .task-display-map :deep(.task-display-map__radial button) {
    animation: none;
    transform: translate(-50%, -50%);
    opacity: 1;
  }
}
</style>
