<template>
  <section v-if="theme" class="event-display">
    <aside class="event-display__left">
      <article class="event-display__summary">
        <h2>{{ theme.name }}</h2>
        <dl>
          <div>
            <dt>事件类型</dt>
            <dd>{{ theme.category }}</dd>
          </div>
          <div>
            <dt>地理区域</dt>
            <dd>{{ theme.region }}</dd>
          </div>
          <div>
            <dt>时间窗口</dt>
            <dd>{{ theme.startTime }}<br />至 {{ theme.endTime }}</dd>
          </div>
          <div>
            <dt>关联空间</dt>
            <dd>{{ eventDisplayRelatedSpaces.join("、") }}</dd>
          </div>
        </dl>
        <p>{{ theme.description }}</p>
      </article>
      <section class="event-display__targets">
        <h3>事件目标</h3>
        <div class="event-display__country-tabs" role="tablist" aria-label="事件目标筛选">
          <button
            v-for="country in countryOptions"
            :key="country"
            type="button"
            :class="{ active: activeCountry === country }"
            role="tab"
            :aria-selected="activeCountry === country"
            @click="activeCountry = country"
          >
            {{ country }}
          </button>
        </div>
        <div class="event-display__target-list">
          <template v-for="group in targetGroups" :key="group.country">
            <header class="event-display__group-title">
              <span>{{ group.country }}目标</span><span>{{ group.targets.length }}个</span>
            </header>
            <div
              v-for="target in group.targets"
              :key="target.id"
              class="event-display__target"
              :class="{ selected: target.id === selectedTargetId }"
              @click="selectedTargetId = target.id"
            >
              <span class="event-display__target-check" @click.stop>
                <el-checkbox :model-value="visibleTargetIds.includes(target.id)" @change="toggleTarget(target.id)" />
              </span>
              <div>
                <strong>{{ target.name }}</strong>
                <small>{{ target.country }} · {{ target.type }}</small>
              </div>
            </div>
          </template>
        </div>
      </section>
    </aside>

    <div class="event-display__center">
      <EventDisplayMap
        :region-points="theme.points"
        :targets="eventDisplayTargets"
        :events="eventDisplayEvents"
        :visible-target-ids="visibleTargetIds"
        :selected-target-id="selectedTargetId"
        :show-events="showEventMarkers"
        @select="selectedTargetId = $event"
      />
      <div class="event-display__toolbar">
        <span class="event-display__toolbar-label">时间选择</span>
        <el-date-picker v-model="displayStart" type="datetime" value-format="YYYY-MM-DD HH:mm" size="small" placeholder="开始时间" />
        <span>至</span>
        <el-date-picker v-model="displayEnd" type="datetime" value-format="YYYY-MM-DD HH:mm" size="small" placeholder="结束时间" />
        <span class="event-display__toolbar-label">区域选择</span>
        <el-select v-model="regionFilter" size="small" class="event-display__region-select">
          <el-option label="全部区域" value="全部区域" />
          <el-option :label="theme.region" :value="theme.region" />
        </el-select>
        <el-button size="small">地图选点</el-button>
      </div>
      <footer class="event-display__timeline">
        <button type="button" class="event-display__play" aria-label="播放或暂停" @click="togglePlayback">
          {{ playing ? "❚❚" : "▶" }}
        </button>
        <time>{{ currentLabel }}</time>
        <div class="event-display__axis">
          <span
            v-for="(tick, index) in ticks"
            :key="tick.label"
            class="event-display__tick"
            :class="{ 'is-first': index === 0, 'is-last': index === ticks.length - 1 }"
            :style="{ left: `${tick.progress}%` }"
            >{{ tick.label }}</span
          >
          <div class="event-display__track"></div>
          <div class="event-display__playhead" :style="{ left: `${progress}%` }"></div>
        </div>
        <el-select v-model="playbackSpeed" size="small" class="event-display__speed">
          <el-option v-for="speed in playbackSpeeds" :key="speed" :label="`${speed}x`" :value="speed" />
        </el-select>
        <button type="button" class="event-display__reset" aria-label="重置时间" @click="resetPlayback">↺</button>
      </footer>
    </div>

    <aside class="event-display__right">
      <header>
        <h3>事件脉络</h3>
        <el-checkbox :model-value="showEventMarkers" @change="showEventMarkers = Boolean($event)">地图显示</el-checkbox>
      </header>
      <div class="event-display__events">
        <article v-for="(event, index) in eventDisplayEvents" :key="event.id" :class="{ active: index === 0 }">
          <time>{{ event.time }}</time>
          <strong>{{ event.title }}</strong>
          <p>{{ event.description }}</p>
        </article>
      </div>
    </aside>
  </section>
  <p v-else class="event-display__empty">未找到事件主题</p>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { EventDisplayTargetCountry, IntelligenceEventTheme } from "@/types";
import { eventDisplayEvents, eventDisplayRelatedSpaces, eventDisplayTargets } from "@/mocks/intelligenceEventDisplayMock/intelligenceEventDisplayMock";
import { intelligenceEventThemes } from "@/mocks/intelligenceEventThemesMock/intelligenceEventThemesMock";
import EventDisplayMap from "./components/EventDisplayMap.vue";
import { buildTimelineTicks, getTimelineProgress } from "./utils/eventDisplayTimeline";

const route = useRoute();
const theme = computed<IntelligenceEventTheme | undefined>(
  () => intelligenceEventThemes.find((item) => item.id === route.query.themeId) ?? intelligenceEventThemes[0],
);
const countryOptions = ["全部", "美国", "日本"] as const;
const activeCountry = ref<(typeof countryOptions)[number]>("全部");
const visibleTargetIds = ref(eventDisplayTargets.map((target) => target.id));
const selectedTargetId = ref(eventDisplayTargets[0]?.id ?? "");
const showEventMarkers = ref(true);
const regionFilter = ref("全部区域");
const displayStart = ref("");
const displayEnd = ref("");
const playbackSpeeds = [60, 600, 3600];
const playbackSpeed = ref(600);
const playing = ref(false);
const currentMs = ref(0);
let playbackTimer: ReturnType<typeof setInterval> | undefined;

/** @description 解析「年-月-日 时:分」文本为本地毫秒时间戳。 @param value 时间文本。 @returns 毫秒时间戳。 */
function parseDisplayTime(value: string): number {
  return Date.parse(value.replace(" ", "T"));
}

/** @description 格式化底部时间轴的当前时间。 @param timestamp 毫秒时间戳。 @returns 完整时间文本。 */
function formatDisplayClock(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const startMs = computed(() => parseDisplayTime(theme.value?.startTime ?? ""));
const endMs = computed(() => parseDisplayTime(theme.value?.endTime ?? ""));
const ticks = computed(() => (theme.value ? buildTimelineTicks(theme.value.startTime, theme.value.endTime) : []));
const progress = computed(() =>
  theme.value && Number.isFinite(startMs.value) ? getTimelineProgress(theme.value.startTime, theme.value.endTime, formatDisplayClock(currentMs.value)) : 0,
);
const currentLabel = computed(() => formatDisplayClock(currentMs.value));
const targetGroups = computed(() => {
  const countries: EventDisplayTargetCountry[] = activeCountry.value === "全部" ? ["美国", "日本"] : [activeCountry.value];
  return countries
    .map((country) => ({ country, targets: eventDisplayTargets.filter((target) => target.country === country) }))
    .filter((group) => group.targets.length > 0);
});

watch(
  theme,
  (value) => {
    displayStart.value = value?.startTime ?? "";
    displayEnd.value = value?.endTime ?? "";
    currentMs.value = parseDisplayTime(value?.startTime ?? "");
  },
  { immediate: true },
);

/** @description 切换目标在地图上的显示状态。 @param targetId 目标标识。 */
function toggleTarget(targetId: string): void {
  visibleTargetIds.value = visibleTargetIds.value.includes(targetId)
    ? visibleTargetIds.value.filter((id) => id !== targetId)
    : [...visibleTargetIds.value, targetId];
}

/** @description 停止时间轴播放并清除计时器。 */
function stopPlayback(): void {
  if (playbackTimer) clearInterval(playbackTimer);
  playbackTimer = undefined;
  playing.value = false;
}

/** @description 按当前倍速播放或暂停时间轴。 */
function togglePlayback(): void {
  if (playing.value) {
    stopPlayback();
    return;
  }
  if (!Number.isFinite(startMs.value) || !Number.isFinite(endMs.value)) return;
  if (currentMs.value >= endMs.value) currentMs.value = startMs.value;
  playing.value = true;
  playbackTimer = setInterval(() => {
    currentMs.value = Math.min(endMs.value, currentMs.value + playbackSpeed.value * 1000);
    if (currentMs.value >= endMs.value) stopPlayback();
  }, 1000);
}

/** @description 停止播放并将时间轴重置到开始时刻。 */
function resetPlayback(): void {
  stopPlayback();
  currentMs.value = startMs.value;
}

onBeforeUnmount(stopPlayback);
</script>
<style scoped lang="scss">
.event-display {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 240px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-page-background);
}
.event-display__left {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-right: 1px solid var(--aircas-color-border);
}
.event-display__summary {
  padding: 14px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background);
}
.event-display__summary h2 {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
}
.event-display__summary dl {
  display: flex;
  margin: 0;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}
.event-display__summary dl div {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 8px;
}
.event-display__summary dt {
  color: var(--aircas-color-text-secondary);
}
.event-display__summary dd {
  margin: 0;
  line-height: 1.5;
}
.event-display__summary p {
  margin: 12px 0 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}
.event-display__targets {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 12px 14px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background);
}
.event-display__targets h3 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
}
.event-display__country-tabs {
  display: flex;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--aircas-color-border);
}
.event-display__country-tabs button {
  min-width: 52px;
  padding: 4px 10px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  font-size: 12px;
  cursor: pointer;
}
.event-display__country-tabs button.active {
  border-color: var(--aircas-color-primary);
  color: var(--aircas-color-primary);
  background: color-mix(in srgb, var(--aircas-color-primary) 16%, transparent);
}
.event-display__target-list {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding-top: 8px;
}
.event-display__group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 2px 6px;
  color: var(--aircas-color-warning, #f0a020);
  font-size: 12px;
}
.event-display__target {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
}
.event-display__target:hover {
  background: var(--aircas-color-hover);
}
.event-display__target.selected {
  border-color: var(--aircas-color-primary);
  background: var(--aircas-color-hover);
}
.event-display__target-check {
  display: inline-flex;
  flex-shrink: 0;
}
.event-display__target div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}
.event-display__target strong {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-display__target small {
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
}
.event-display__center {
  position: relative;
  min-width: 0;
  overflow: hidden;
  container-type: inline-size;
}
.event-display__toolbar {
  position: absolute;
  z-index: 2;
  top: 12px;
  right: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: nowrap;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: color-mix(in srgb, var(--aircas-color-panel-background) 92%, transparent);
}
.event-display__toolbar-label {
  flex-shrink: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}
.event-display__toolbar :deep(.el-date-editor) {
  width: auto;
  min-width: 60px;
  flex: 1 1 120px;
  max-width: 150px;
}
.event-display__region-select {
  width: 104px;
  flex-shrink: 0;
}
.event-display__toolbar :deep(.el-button) {
  flex-shrink: 0;
  padding: 0 8px;
}
@container (max-width: 560px) {
  .event-display__toolbar {
    gap: 2px;
    padding: 6px;
  }
  .event-display__toolbar-label {
    display: none;
  }
  .event-display__region-select {
    width: 70px;
  }
  .event-display__toolbar :deep(.el-date-editor) {
    min-width: 58px;
  }
  .event-display__toolbar :deep(.el-button) {
    padding: 0 4px;
  }
}
.event-display__timeline {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--aircas-color-border);
  background: color-mix(in srgb, var(--aircas-color-panel-background) 94%, transparent);
}
.event-display__play,
.event-display__reset {
  flex-shrink: 0;
  border: 1px solid var(--aircas-color-border);
  border-radius: 50%;
  color: var(--aircas-color-text-primary);
  background: transparent;
  font-size: 12px;
  cursor: pointer;
}
.event-display__play {
  width: 26px;
  height: 26px;
}
.event-display__reset {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}
.event-display__timeline time {
  flex-shrink: 0;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.event-display__axis {
  position: relative;
  height: 34px;
  flex: 1;
  min-width: 70px;
}
.event-display__tick {
  position: absolute;
  top: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 10px;
  white-space: nowrap;
  transform: translateX(-50%);
}
.event-display__tick.is-first {
  transform: none;
}
.event-display__tick.is-last {
  transform: translateX(-100%);
}
.event-display__track {
  position: absolute;
  right: 0;
  bottom: 8px;
  left: 0;
  height: 4px;
  border-radius: 2px;
  background:
    repeating-linear-gradient(90deg, var(--aircas-color-primary) 0 1px, transparent 1px 12px) center bottom / 100% 4px no-repeat,
    var(--aircas-color-border);
  opacity: 0.9;
}
.event-display__playhead {
  position: absolute;
  bottom: 2px;
  width: 2px;
  height: 16px;
  background: var(--aircas-color-primary);
  transform: translateX(-50%);
}
.event-display__speed {
  width: 84px;
  flex-shrink: 0;
}
.event-display__right {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 12px;
  border-left: 1px solid var(--aircas-color-border);
}
.event-display__right header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--aircas-color-border);
}
.event-display__right h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.event-display__events {
  position: relative;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 12px 0 4px 14px;
}
.event-display__events::before {
  position: absolute;
  top: 14px;
  bottom: 8px;
  left: 3px;
  width: 1px;
  content: "";
  background: var(--aircas-color-border);
}
.event-display__events article {
  position: relative;
  margin-bottom: 12px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 4px;
}
.event-display__events article::before {
  position: absolute;
  top: 12px;
  left: -15px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  content: "";
  background: var(--aircas-color-primary);
}
.event-display__events article.active {
  border-color: var(--aircas-color-primary);
  background: var(--aircas-color-hover);
}
.event-display__events time {
  display: block;
  color: var(--aircas-color-text-secondary);
  font-size: 10px;
}
.event-display__events strong {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
}
.event-display__events p {
  margin: 6px 0 0;
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
  line-height: 1.6;
}
.event-display__empty {
  padding: 24px;
}
</style>
