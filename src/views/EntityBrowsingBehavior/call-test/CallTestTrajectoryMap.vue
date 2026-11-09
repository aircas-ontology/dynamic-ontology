<template>
  <div class="call-test-map">
    <div :id="mapId" ref="mapContainerRef" class="call-test-map__container"></div>
    <div class="call-test-map__legend">
      <span><i class="call-test-map__legend-dot call-test-map__legend-dot--current"></i>当前位置</span>
      <span><i class="call-test-map__legend-track"></i>历史轨迹</span>
      <span><i class="call-test-map__legend-line"></i>预测轨迹</span>
      <span><i class="call-test-map__legend-band"></i>误差包络</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { useDocumentTheme } from "@/composables/shared/useDocumentTheme";
import type { CallTestInput, CallTestRunStatus, CallTestTrajectoryPoint } from "@/types";
import { useCallTestMap } from "./useCallTestMap";

const props = defineProps<{ status: CallTestRunStatus; trajectory: readonly CallTestTrajectoryPoint[]; input: CallTestInput }>();
const { isDark } = useDocumentTheme();
const mapContainerRef = ref<HTMLElement | null>(null);
const mapId = `call-test-map-${useId().replaceAll(":", "")}`;
const statusRef = computed(() => props.status);
const trajectoryRef = computed(() => props.trajectory);
const inputRef = computed(() => props.input);
const { init, render, destroy } = useCallTestMap(mapContainerRef, statusRef, trajectoryRef, inputRef);
onMounted(init);
watch([statusRef, trajectoryRef, inputRef], render, { deep: true });
watch(isDark, render);
onBeforeUnmount(destroy);
</script>

<style scoped lang="scss">
.call-test-map {
  position: relative;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 5px;
  background: var(--aircas-color-panel-background-deep);
}
.call-test-map__container {
  width: 100%;
  height: 100%;
}
.call-test-map__legend {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  display: flex;
  gap: 12px;
  padding: 6px 9px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 4px;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-overlay);
  font-size: 12px;
  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
}
.call-test-map__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--aircas-color-success);
}
.call-test-map__legend-track {
  width: 18px;
  height: 2px;
  background: var(--aircas-color-success);
}
.call-test-map__legend-line {
  width: 18px;
  height: 2px;
  background: var(--aircas-color-warning);
}
.call-test-map__legend-band {
  width: 18px;
  height: 8px;
  background: var(--aircas-color-effect-warning-fill);
}
:global(.call-test-map-popup) {
  display: grid;
  gap: 5px;
  min-width: 190px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
:global(.call-test-map-popup strong) {
  color: var(--aircas-color-success);
  font-size: 14px;
}
</style>
