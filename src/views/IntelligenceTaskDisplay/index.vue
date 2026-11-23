<template>
  <section class="task-display">
    <TaskDisplayMap ref="mapRef" :mode="mapMode" :selected-id="selectedId" :menu-visible="menuVisible" @select="selectMapTarget" @detail="openTargetDetail" />
    <div class="task-display__toolbar">
      <el-button plain @click="router.push({ name: 'IntelligenceTaskThemes' })">返回任务</el-button
      ><el-button plain @click="eventVisible = !eventVisible">事件脉络</el-button><el-button plain>知识图谱</el-button><el-button plain>▷ 回放复盘</el-button>
    </div>
    <div class="task-display__controls">
      <el-radio-group :model-value="mapMode" @update:model-value="setMapMode"
        ><el-radio-button value="2d">2D</el-radio-button><el-radio-button value="3d">3D</el-radio-button></el-radio-group
      ><el-button plain @click="targetsVisible = !targetsVisible">目标列表</el-button>
    </div>
    <aside v-if="targetsVisible" class="task-display__targets">
      <header>
        <strong>目标列表</strong><span>共 {{ taskDisplayTargets.length }} 个</span
        ><button type="button" aria-label="关闭目标列表" @click="targetsVisible = false">×</button>
      </header>
      <el-collapse class="task-display__target-groups"
        ><el-collapse-item v-for="group in groups" :key="group.name" :name="group.name"
          ><template #title
            >{{ group.name }} <span class="task-display__count">{{ group.items.length }}</span></template
          ><button
            v-for="target in group.items"
            :key="target.id"
            type="button"
            class="task-display__target"
            :class="{ 'task-display__target--selected': target.id === selectedId }"
            :aria-pressed="target.id === selectedId"
            @click="locateTaskTarget(target.id)"
          >
            <svg class="task-display__target-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 7 7v14h10V7l-5-5Zm0 0v19M7 7h10" /></svg>
            <span :title="target.name">{{ target.name }}</span>
          </button></el-collapse-item
        ></el-collapse
      >
    </aside>
    <aside v-if="eventVisible" class="task-display__events">
      <header>
        <strong>事件脉络 · {{ taskDisplayTitle }}</strong
        ><button type="button" aria-label="关闭事件脉络" @click="eventVisible = false">×</button>
      </header>
      <div class="task-display__mindmap-scroll">
        <div class="task-display__mindmap">
          <div class="task-display__root">{{ taskDisplayTitle }}</div>
          <div class="task-display__branches">
            <div
              v-for="(phase, index) in taskDisplayEvents"
              :key="phase.name"
              class="task-display__branch"
              :class="{ 'task-display__branch--first': index === 0, 'task-display__branch--last': index === taskDisplayEvents.length - 1 }"
            >
              <div class="task-display__phase">
                <b>{{ index + 1 }}. {{ phase.name }}</b
                ><small>{{ phase.period }}</small
                ><small>{{ phase.events.length }} 个事件</small>
              </div>
              <div class="task-display__event-list">
                <div
                  v-for="(event, eventIndex) in phase.events"
                  :key="event"
                  class="task-display__event"
                  :class="{ 'task-display__event--first': eventIndex === 0, 'task-display__event--last': eventIndex === phase.events.length - 1 }"
                >
                  {{ event }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
    <aside v-if="selectedTarget && detailName" class="task-display__detail">
      <header>
        <strong>{{ selectedTarget.name }} · {{ detailName }}</strong
        ><button type="button" aria-label="关闭详情" @click="detailName = ''">×</button>
      </header>
      <h3>{{ detailName }}</h3>
      <dl>
        <template v-if="detailName === '基本信息'"
          ><div>
            <dt>目标名称</dt>
            <dd>{{ selectedTarget.name }}</dd>
          </div>
          <div>
            <dt>类型</dt>
            <dd>{{ selectedTarget.type }}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd>{{ selectedTarget.status }}</dd>
          </div>
          <div>
            <dt>常驻地点</dt>
            <dd>{{ selectedTarget.location }}</dd>
          </div>
          <div>
            <dt>所属本体空间</dt>
            <dd>{{ selectedTarget.space }}</dd>
          </div></template
        >
        <div v-else>
          <dt>内容</dt>
          <dd>暂无数据</dd>
        </div>
      </dl>
    </aside>
    <button type="button" class="task-display__assistant">☏ 智能参谋</button>
  </section>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { taskDisplayEvents, taskDisplayTargets, taskDisplayTitle } from "@/mocks/intelligenceTaskDisplayMock";
import TaskDisplayMap from "./components/TaskDisplayMap.vue";
import { findTaskTarget, groupTaskTargets } from "./utils/taskTargets";
const router = useRouter();
const mapRef = ref<InstanceType<typeof TaskDisplayMap> | null>(null);
const mapMode = ref<"2d" | "3d">("2d");
const targetsVisible = ref(false);
const eventVisible = ref(false);
const selectedId = ref<string | null>(null);
const menuVisible = ref(false);
const detailName = ref("");
const groups = computed(() => groupTaskTargets(taskDisplayTargets));
const selectedTarget = computed(() => (selectedId.value ? findTaskTarget(taskDisplayTargets, selectedId.value) : undefined));
/** @description 设置地图展示模式。 @param value 选择值。 */
function setMapMode(value: string | number | boolean | undefined): void {
  if (value === "2d" || value === "3d") mapMode.value = value;
}
/** @description 选择地图目标并显示操作菜单。 @param id 目标标识。 */
function selectMapTarget(id: string): void {
  selectedId.value = id;
  menuVisible.value = true;
  detailName.value = "";
}
/** @description 将地图定位到列表中的目标。 @param id 目标标识。 */
function locateTaskTarget(id: string): void {
  selectedId.value = id;
  menuVisible.value = false;
  detailName.value = "";
  mapRef.value?.locateTarget(id);
}
/** @description 打开目标信息卡片。 @param name 菜单名称。 */
function openTargetDetail(name: string): void {
  detailName.value = name;
  menuVisible.value = false;
}
</script>
<style scoped lang="scss">
.task-display {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.task-display__toolbar,
.task-display__controls {
  position: absolute;
  z-index: 3;
  top: 12px;
  display: flex;
  gap: 8px;
}
.task-display__toolbar {
  left: 12px;
}
.task-display__controls {
  right: 12px;
  flex-direction: column;
}
.task-display__targets,
.task-display__events,
.task-display__detail {
  position: absolute;
  z-index: 4;
  overflow: auto;
  border: 1px solid var(--aircas-color-primary);
  border-radius: 6px;
  color: var(--aircas-color-text-primary);
  background: color-mix(in srgb, var(--aircas-color-panel-background) 94%, transparent);
}
.task-display__targets {
  top: 110px;
  right: 12px;
  display: grid;
  width: 300px;
  max-width: calc(100% - 24px);
  max-height: min(75%, calc(100% - 122px));
  grid-template-rows: auto minmax(0, auto);
  overflow: hidden;
}
.task-display__target-groups {
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  border: 0;
}
.task-display__target-groups :deep(.el-collapse-item) {
  margin-bottom: 0;
}
.task-display__target-groups :deep(.el-collapse-item__header) {
  display: flex;
  padding: 0 12px;
  color: var(--aircas-color-primary);
  background: var(--aircas-color-card-background);
  font-weight: 600;
}
.task-display__target-groups :deep(.el-collapse-item__header.is-active) {
  border-bottom-color: var(--aircas-color-border);
}
.task-display__target-groups :deep(.el-collapse-item__arrow) {
  order: -1;
  margin: 0 8px 0 0;
}
.task-display__target-groups :deep(.el-collapse-item__wrap) {
  background: var(--aircas-color-card-background);
}
.task-display__target-groups :deep(.el-collapse-item__content) {
  padding: 0;
}
.task-display__targets header,
.task-display__events header,
.task-display__detail header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--aircas-color-border);
}
.task-display__targets header span {
  color: var(--aircas-color-text-secondary);
}
.task-display__targets header button,
.task-display__events header button,
.task-display__detail header button {
  margin-left: auto;
  border: 0;
  color: var(--aircas-color-text-primary);
  background: transparent;
  cursor: pointer;
}
.task-display__count {
  margin-left: auto;
  color: var(--aircas-color-text-secondary);
  font-weight: 400;
}
.task-display__target {
  display: flex;
  width: 100%;
  min-height: 38px;
  align-items: center;
  gap: 12px;
  padding: 8px 16px 8px 32px;
  border: 0;
  border-bottom: 1px solid var(--aircas-color-border);
  color: var(--aircas-color-text-primary);
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.task-display__target span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-display__target-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  fill: none;
  stroke: var(--aircas-color-primary);
  stroke-linejoin: round;
  stroke-width: 1.5;
}
.task-display__target:hover,
.task-display__target:focus-visible,
.task-display__target--selected {
  background: var(--aircas-color-hover);
}
.task-display__target:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: -2px;
}
.task-display__events {
  top: 55px;
  bottom: 12px;
  left: 12px;
  width: min(780px, 65%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.task-display__events header {
  flex-shrink: 0;
}
.task-display__mindmap-scroll {
  min-height: 0;
  flex: 1;
  overflow: auto;
}
.task-display__mindmap {
  display: flex;
  align-items: center;
  min-width: 620px;
  min-height: 100%;
  padding: 24px;
}
.task-display__root,
.task-display__phase {
  padding: 12px;
  border: 1px solid var(--aircas-color-primary);
  border-radius: 8px;
  background: var(--aircas-color-card-background);
}
.task-display__root {
  position: relative;
  width: 150px;
  flex-shrink: 0;
}
.task-display__root::after {
  position: absolute;
  top: 50%;
  left: 100%;
  width: 24px;
  border-top: 1px solid var(--aircas-color-primary);
  content: "";
}
.task-display__branches {
  display: grid;
  flex: 1;
  margin-left: 24px;
}
.task-display__branch {
  position: relative;
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 8px 0 8px 24px;
}
.task-display__branch::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-left: 1px solid var(--aircas-color-primary);
  content: "";
}
.task-display__branch--first::before {
  top: 50%;
}
.task-display__branch--last::before {
  bottom: 50%;
}
.task-display__phase {
  position: relative;
  display: flex;
  width: 145px;
  flex-shrink: 0;
  flex-direction: column;
  border-radius: 28px;
}
.task-display__phase::before,
.task-display__phase::after {
  position: absolute;
  top: 50%;
  border-top: 1px solid var(--aircas-color-primary);
  content: "";
}
.task-display__phase::before {
  right: 100%;
  width: 24px;
}
.task-display__phase::after {
  left: 100%;
  width: 16px;
}
.task-display__phase small {
  color: var(--aircas-color-text-secondary);
}
.task-display__event-list {
  display: grid;
  flex: 1;
}
.task-display__event {
  position: relative;
  margin: 3px 0;
  padding: 8px;
  border: 1px solid var(--aircas-color-border);
  border-left: 3px solid var(--aircas-color-success);
  border-radius: 4px;
  background: var(--aircas-color-card-background);
}
.task-display__event::before {
  position: absolute;
  top: -4px;
  bottom: -4px;
  left: -19px;
  border-left: 1px solid var(--aircas-color-primary);
  content: "";
}
.task-display__event::after {
  position: absolute;
  top: 50%;
  right: 100%;
  width: 16px;
  border-top: 1px solid var(--aircas-color-primary);
  content: "";
}
.task-display__event--first::before {
  top: 50%;
}
.task-display__event--last::before {
  bottom: 50%;
}
.task-display__detail {
  top: 40%;
  left: 52%;
  width: 340px;
}
.task-display__detail h3 {
  margin: 12px;
  color: var(--aircas-color-primary);
}
.task-display__detail dl {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 12px;
}
.task-display__detail dt {
  color: var(--aircas-color-text-secondary);
}
.task-display__detail dd {
  margin: 0;
}
.task-display__assistant {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 3;
  padding: 8px 16px;
  border: 1px solid var(--aircas-color-primary);
  border-radius: 20px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background);
}
</style>
