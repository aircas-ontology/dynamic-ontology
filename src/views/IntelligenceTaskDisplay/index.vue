<template>
  <section class="task-display">
    <TaskDisplayMap
      ref="mapRef"
      :mode="mapMode"
      :region-points="taskRegionPoints"
      :selected-id="selectedId"
      :menu-visible="menuVisible"
      :target-events-visible="targetEventCardVisible"
      :replay-active="replayActive"
      :replay-playing="replayPlaying"
      :replay-speed="replaySpeed"
      :replay-time="replayTime"
      @replay-tick="updateReplayTime"
      @select="selectMapTarget"
      @detail="openTargetDetail"
      @close-target-events="targetEventCardVisible = false"
      @open-event="openEventDetail"
    />
    <div class="task-display__toolbar">
      <el-button plain @click="router.push({ name: 'IntelligenceTaskThemes' })">返回任务</el-button
      ><el-button plain @click="eventVisible = !eventVisible">事件脉络</el-button><el-button plain @click="openTaskKnowledgeGraph">知识图谱</el-button
      ><el-button plain @click="startEventReplay">▷ 回放复盘</el-button>
    </div>
    <div class="task-display__controls">
      <el-radio-group :model-value="mapMode" @update:model-value="setMapMode"
        ><el-radio-button value="2d">2D</el-radio-button><el-radio-button value="3d">3D</el-radio-button></el-radio-group
      ><el-button plain @click="targetsVisible = !targetsVisible">目标列表</el-button>
    </div>
    <aside v-if="targetsVisible" class="task-display__targets">
      <header>
        <strong>目标列表</strong><span>共 {{ categories.length }} 个分类</span
        ><button type="button" aria-label="关闭目标列表" @click="targetsVisible = false">×</button>
      </header>
      <p v-if="categoryMessage" role="status">{{ categoryMessage }}</p>
      <ul v-else class="task-display__target-groups">
        <el-collapse v-model="expandedCategoryIds">
          <el-collapse-item v-for="category in categories" :key="category.categoryId" :name="String(category.categoryId)">
            <template #title>
              <span class="task-display__category-heading">
                <span>{{ category.name || category.categoryId }}</span
                ><span class="task-display__count">{{ category.items.length }}</span>
              </span>
            </template>
            <p v-if="!category.items.length" class="task-display__target-empty">暂无实例</p>
            <button v-for="item in category.items" :key="item.id" type="button" class="task-display__target">
              <span>{{ item.name }}</span>
            </button>
          </el-collapse-item>
        </el-collapse>
      </ul>
    </aside>
    <aside v-if="eventVisible" class="task-display__events">
      <header>
        <strong>事件脉络 · {{ taskDisplayTitle }}</strong
        ><button type="button" aria-label="关闭事件脉络" @click="eventVisible = false">×</button>
      </header>
      <div class="task-display__mindmap-scroll">
        <div ref="mindmapRef" class="task-display__mindmap">
          <svg class="task-display__mindmap-lines" :viewBox="`0 0 ${mindmapSize.width} ${mindmapSize.height}`" aria-hidden="true">
            <path v-for="(path, index) in mindmapPaths" :key="index" :d="path" />
          </svg>
          <div data-mindmap-node="root" class="task-display__root">{{ taskDisplayTitle }}</div>
          <div class="task-display__branches">
            <div
              v-for="(phase, index) in taskDisplayEvents"
              :key="phase.name"
              class="task-display__branch"
              :class="{ 'task-display__branch--first': index === 0, 'task-display__branch--last': index === taskDisplayEvents.length - 1 }"
            >
              <div :data-mindmap-node="`phase-${index}`" class="task-display__phase">
                <b>{{ index + 1 }}. {{ phase.name }}</b
                ><small>{{ phase.period }}</small
                ><small>{{ phase.events.length }} 个事件</small>
              </div>
              <div class="task-display__event-list">
                <button
                  v-for="(event, eventIndex) in phase.events"
                  :key="event.id"
                  type="button"
                  class="task-display__event"
                  :data-mindmap-node="`event-${index}-${eventIndex}`"
                  :class="{ 'task-display__event--first': eventIndex === 0, 'task-display__event--last': eventIndex === phase.events.length - 1 }"
                  @click="openEventDetail(event.id)"
                >
                  {{ event.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
    <aside v-if="graphVisible" class="task-display__graph-panel">
      <header>
        <strong>{{ graphTarget ? `知识图谱 · ${graphTarget.name}` : `领域知识图谱 · ${taskDisplayTitle}` }}</strong
        ><button type="button" aria-label="关闭知识图谱" @click="closeKnowledgeGraph">×</button>
      </header>
      <div class="task-display__graph-summary">
        <div>
          <small>{{ graphTarget ? "中心目标" : "1 主题" }}</small
          ><strong>{{ graphTarget ? 1 : 1 }}</strong
          ><span>{{ graphTarget ? graphTarget.name : "个主题" }}</span>
        </div>
        <div>
          <small>{{ graphTarget ? "关联目标" : "2 实例关联" }}</small
          ><strong>{{ graphTarget ? graphTargetRelationTargetCount : taskDisplayTargets.length }}</strong
          ><span>个实例</span>
        </div>
        <div>
          <small>{{ graphTarget ? "关联事件" : "3 事件关联" }}</small
          ><strong>{{ graphTarget ? graphTargetRelationEventCount : eventDetails.length }}</strong
          ><span>个事件</span>
        </div>
      </div>
      <div class="task-display__graph-filters">
        <el-tag type="primary" effect="plain">{{ graphTarget ? "中心目标" : "目标" }} {{ graphTarget ? 1 : taskDisplayTargets.length }}</el-tag>
        <el-tag type="warning" effect="plain">事件 {{ graphTarget ? graphTargetRelationEventCount : eventDetails.length }}</el-tag>
        <el-tag type="info" effect="plain">关系 {{ displayedGraphRelationCount }}</el-tag>
      </div>
      <div class="task-display__graph-canvas">
        <OntologyRelationGraph2d :items="displayedGraphRelations" :seed-names="[graphTarget?.name ?? taskDisplayTitle]" circular-layout readonly />
      </div>
    </aside>
    <el-dialog :model-value="currentEvent !== undefined" width="min(640px, 92vw)" append-to-body @update:model-value="handleEventDialogVisibility">
      <template #header>
        <div v-if="currentEvent" class="task-display__event-dialog-title">
          <strong>{{ currentEvent.name }}</strong
          ><el-tag type="success" effect="plain">{{ currentEvent.status }}</el-tag>
        </div>
      </template>
      <div v-if="currentEvent" class="task-display__event-dialog">
        <h3>基本信息</h3>
        <dl class="task-display__event-details">
          <div>
            <dt>事件时间</dt>
            <dd>{{ currentEvent.time }}</dd>
          </div>
          <div>
            <dt>任务进程</dt>
            <dd>{{ currentEvent.progress }}</dd>
          </div>
          <div>
            <dt>发生位置</dt>
            <dd>{{ currentEvent.location }}</dd>
          </div>
          <div>
            <dt>经纬度</dt>
            <dd>{{ currentEvent.coordinates }}</dd>
          </div>
          <div>
            <dt>所属任务</dt>
            <dd>{{ taskDisplayTitle }}</dd>
          </div>
          <div>
            <dt>事件编号</dt>
            <dd>{{ currentEvent.id }}</dd>
          </div>
        </dl>
        <h3>事件来源</h3>
        <dl class="task-display__event-details">
          <div>
            <dt>来源类型</dt>
            <dd>{{ currentEvent.sourceType }}</dd>
          </div>
          <div>
            <dt>来源平台</dt>
            <dd>{{ currentEvent.sourcePlatform }}</dd>
          </div>
        </dl>
        <div class="task-display__confidence"><span>置信度</span><el-progress :percentage="currentEvent.confidence" /></div>
        <h3>事件信息</h3>
        <p>{{ currentEvent.description }}</p>
        <h3>
          关联目标 <small>{{ currentEvent.targets.length }}</small>
        </h3>
        <div v-if="currentEvent.targets.length" class="task-display__event-targets">
          <div v-for="target in currentEvent.targets" :key="target.name">
            {{ target.name }} <span>{{ target.category }}</span>
          </div>
        </div>
        <p v-else>暂无关联目标</p>
      </div>
      <template #footer>
        <el-button :disabled="eventIndex <= 0" @click="moveEventDetail(-1)">上一条</el-button>
        <el-button :disabled="eventIndex >= eventDetails.length - 1" @click="moveEventDetail(1)">下一条</el-button>
        <span class="task-display__event-position">{{ eventIndex + 1 }} / {{ eventDetails.length }}</span>
      </template>
    </el-dialog>
    <TargetHiddenRelations v-if="selectedTarget && detailName === '目标隐含关系'" :target="selectedTarget" @close="detailName = ''" />
    <aside
      v-if="selectedTarget && detailName && detailName !== '关联事件' && detailName !== '目标隐含关系' && detailName !== '图谱'"
      class="task-display__detail"
    >
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
    <aside v-if="targetTimelineVisible && selectedTarget" class="task-display__target-timeline">
      <header>
        <strong>事件脉络 · {{ selectedTarget.name }}</strong
        ><button type="button" aria-label="关闭目标事件脉络" @click="targetTimelineVisible = false">×</button>
      </header>
      <div v-if="selectedTargetEvents.length" class="task-display__timeline-scroll">
        <div class="task-display__timeline-list">
          <div v-for="group in targetEventGroups" :key="group.time" class="task-display__timeline-group">
            <button v-for="event in group.events" :key="event.id" type="button" class="task-display__timeline-event" @click="openEventDetail(event.id)">
              <time>{{ event.time }}</time
              ><strong>{{ event.name }}</strong
              ><span>{{ event.location }}</span
              ><span>{{ event.status }}</span>
            </button>
          </div>
        </div>
      </div>
      <p v-else>暂无关联事件</p>
    </aside>
    <div v-if="replayActive" class="task-display__replay">
      <el-button @click="replayPlaying = !replayPlaying">{{ replayPlaying ? "Ⅱ" : "▷" }}</el-button>
      <time>{{ replayTimeLabel }}</time>
      <div class="task-display__replay-progress" aria-label="历史事件时间进度">
        <el-slider :model-value="replayTime" :min="replayStart" :max="replayEnd" :step="1000" :show-tooltip="false" @update:model-value="seekEventReplay" />
        <div>
          <span>{{ formatReplayTime(replayStart) }}</span
          ><span>{{ formatReplayTime(replayEnd) }}</span>
        </div>
      </div>
      <el-select v-model="replaySpeed" placeholder="回放倍速"
        ><el-option v-for="speed in [0.5, 1, 2, 4, 8]" :key="speed" :value="speed" :label="`${speed}x`"
      /></el-select>
      <el-button @click="stopEventReplay">× 结束</el-button>
    </div>
    <button type="button" class="task-display__assistant">☏ 智能参谋</button>
  </section>
</template>
<script setup lang="ts">
import { ElMessage } from "element-plus";
import type { CollapseModelValue } from "element-plus";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { taskDisplayEvents, taskDisplayTargets, taskDisplayTitle } from "@/mocks/intelligenceTaskDisplayMock";
import OntologyRelationGraph2d from "@/components/OntologyRelationGraph2d.vue";
import TaskDisplayMap from "./components/TaskDisplayMap.vue";
import TargetHiddenRelations from "./components/TargetHiddenRelations.vue";
import type { OntologyCategoryTreeNode, OntologyRelationClass } from "@/types";
import { buildReplaySchedule } from "./utils/eventReplay";
import { getTargetEvents, groupEventsByTime } from "./utils/targetEvents";
import { getOntologyCategoryTreeInterface, getTaskTopicDetailInterface, postOntologyEntityQueryInterface } from "@/apis";
import { findTaskTarget } from "./utils/taskTargets";
import { buildHiddenRelations } from "./utils/hiddenRelations";
import { buildTargetCategoryItems, collectCategoryOntologyIdentifiers, type TargetCategoryItem } from "./utils/targetCategoryInstances";
import { parseTaskRegionPoints, type TaskRegionPoint } from "./utils/taskRegion";
const router = useRouter();
const mapRef = ref<InstanceType<typeof TaskDisplayMap> | null>(null);
const mapMode = ref<"2d" | "3d">("2d");
const targetsVisible = ref(false);
const eventVisible = ref(false);
const graphVisible = ref(false);
const graphTargetId = ref<string | null>(null);
const selectedId = ref<string | null>(null);
const menuVisible = ref(false);
const targetEventCardVisible = ref(false);
const targetTimelineVisible = ref(false);
const detailName = ref("");
const eventIndex = ref(-1);
const mindmapRef = ref<HTMLElement | null>(null);
const mindmapSize = ref({ width: 0, height: 0 });
const mindmapPaths = ref<string[]>([]);
let mindmapResizeObserver: ResizeObserver | undefined;
const eventDetails = computed(() => taskDisplayEvents.flatMap((phase) => phase.events));
const graphRelations = computed<OntologyRelationClass[]>(() => {
  const relations: OntologyRelationClass[] = [];
  taskDisplayTargets.forEach((target) => {
    relations.push(createTaskGraphRelation(`topic-${target.id}`, taskDisplayTitle, target.name, "关联目标"));
    eventDetails.value.forEach((event) => {
      if (event.targets.some((item) => item.name === target.name)) {
        relations.push(createTaskGraphRelation(`${target.id}-${event.id}`, target.name, event.name, "关联事件"));
      }
    });
  });
  return relations;
});
const graphRelationCount = computed(() => graphRelations.value.length);
const graphTarget = computed(() => (graphTargetId.value ? findTaskTarget(taskDisplayTargets, graphTargetId.value) : undefined));
const targetGraphRelations = computed<OntologyRelationClass[]>(() => {
  if (!graphTarget.value) return [];
  const eventRelations = buildHiddenRelations(graphTarget.value, taskDisplayTargets, eventDetails.value, "event", 2);
  const equipmentRelations = buildHiddenRelations(graphTarget.value, taskDisplayTargets, eventDetails.value, "equipment", 1);
  return [...eventRelations, ...equipmentRelations];
});
const displayedGraphRelations = computed(() => (graphTarget.value ? targetGraphRelations.value : graphRelations.value));
const displayedGraphRelationCount = computed(() => displayedGraphRelations.value.length);
const graphTargetRelationEventCount = computed(
  () =>
    new Set(
      targetGraphRelations.value
        .filter((relation) => relation.categoryId === "event" && relation.sourceName === graphTarget.value?.name)
        .map((relation) => relation.targetName),
    ).size,
);
const graphTargetRelationTargetCount = computed(
  () => new Set(targetGraphRelations.value.filter((relation) => relation.categoryName === "关联目标").map((relation) => relation.targetName)).size,
);
/** @description 将主题图谱的关联转换为公共二维关系图的数据契约。 @param id 关系标识。 @param sourceName 源节点名称。 @param targetName 目标节点名称。 @param displayName 关系名称。 @returns 二维图关系。 */
function createTaskGraphRelation(id: string, sourceName: string, targetName: string, displayName: string): OntologyRelationClass {
  return {
    id,
    sourceName,
    targetName,
    displayName,
    apiName: id,
    categoryId: "task-graph",
    categoryName: displayName,
    sourceOntologyId: "",
    targetOntologyId: "",
    cardinality: "一对多",
    description: "",
  };
}
const replaySchedule = buildReplaySchedule(
  taskDisplayEvents.flatMap((phase) => phase.events),
  taskDisplayTargets,
);
const replayStart = replaySchedule[0]?.start ?? 0;
const replayEnd = replaySchedule.at(-1)?.end ?? 1;
const replayActive = ref(false);
const replayPlaying = ref(false);
const replaySpeed = ref(1);
const replayTime = ref(replayStart);
const replayTimeLabel = computed(() => formatReplayTime(replayTime.value));
/** @description 格式化上海时区的回放时间。 @param time 时间戳。 @returns 日期时间。 */
function formatReplayTime(time: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(time);
}
/** @description 从首条历史事件开始回放。 */
function startEventReplay(): void {
  if (!replaySchedule.length) return;
  replayTime.value = replayStart;
  targetTimelineVisible.value = false;
  targetEventCardVisible.value = false;
  replayActive.value = true;
  replayPlaying.value = true;
  menuVisible.value = false;
}
/** @description 同步 Cesium 时钟并在结束时暂停。 @param time 当前时间。 */
function updateReplayTime(time: number): void {
  replayTime.value = Math.min(replayEnd, Math.max(replayStart, time));
  if (replayTime.value >= replayEnd) replayPlaying.value = false;
}
/** @description 拖动时间条跳转到历史时刻。 @param value 进度条时间。 */
function seekEventReplay(value: number | number[]): void {
  if (typeof value === "number") updateReplayTime(value);
}
/** @description 结束回放并清除历史事件效果。 */
function stopEventReplay(): void {
  replayActive.value = false;
  replayPlaying.value = false;
}
const currentEvent = computed(() => eventDetails.value[eventIndex.value]);
const route = useRoute();
const taskRegionPoints = ref<TaskRegionPoint[]>([]);
interface TargetCategory {
  categoryId: number;
  name?: string;
  items: TargetCategoryItem[];
}
const categories = ref<TargetCategory[]>([]);
const expandedCategoryIds = ref<CollapseModelValue>([]);
const categoryMessage = ref("");

watch(
  () => route.query.taskId,
  async (taskId, _, onCleanup) => {
    let active = true;
    onCleanup(() => {
      active = false;
    });
    taskRegionPoints.value = [];
    if (typeof taskId !== "string" || !taskId.trim()) return;

    try {
      const response = await getTaskTopicDetailInterface(taskId);
      if (!active) return;
      if (response.code !== 200) throw new Error(response.message || "任务主题详情加载失败");
      taskRegionPoints.value = parseTaskRegionPoints(response.data?.regionPoint);
    } catch (error) {
      if (active) ElMessage.error(error instanceof Error ? error.message : "任务主题详情加载失败");
    }
  },
  { immediate: true },
);

/**
 * @description 查询单个一级分类下所有对象的实例，并转换为目标列表展示数据。
 * @param category 一级分类树节点。
 * @returns 包含分类名称与实例列表的目标分类数据。
 */
async function queryCategoryInstances(category: OntologyCategoryTreeNode): Promise<TargetCategory> {
  const ontologyIdentifiers = collectCategoryOntologyIdentifiers(category);
  if (!ontologyIdentifiers.length) return { categoryId: category.categoryId, name: category.name, items: [] };

  const response = await postOntologyEntityQueryInterface(
    ontologyIdentifiers.map((ontologyUniqueIdentifier) => ({ ontologyUniqueIdentifier, entityPrimaryKeys: [] })),
  );
  if (response.code !== 200) throw new Error(response.message || "实例加载失败");
  return {
    categoryId: category.categoryId,
    name: category.name,
    items: buildTargetCategoryItems(response.data ?? []),
  };
}

watch(
  () => route.query.spaceId,
  async (spaceId, _, onCleanup) => {
    let active = true;
    onCleanup(() => {
      active = false;
    });
    categories.value = [];
    expandedCategoryIds.value = [];
    if (typeof spaceId !== "string" || !spaceId.trim()) {
      categoryMessage.value = "任务未绑定本体空间";
      return;
    }
    categoryMessage.value = "正在加载分类…";
    try {
      const response = await getOntologyCategoryTreeInterface({ spaceId });
      if (!active) return;
      if (response.code !== 200) throw new Error(response.message || "分类加载失败");
      const topLevelCategories = response.data?.children ?? [];
      if (!topLevelCategories.length) {
        categoryMessage.value = "暂无一级分类";
        return;
      }
      categoryMessage.value = "正在加载实例…";
      const queriedCategories = await Promise.all(topLevelCategories.map(queryCategoryInstances));
      if (!active) return;
      categories.value = queriedCategories;
      expandedCategoryIds.value = queriedCategories.map((category) => String(category.categoryId));
      categoryMessage.value = "";
    } catch (error) {
      if (active) categoryMessage.value = error instanceof Error ? error.message : "分类加载失败";
    }
  },
  { immediate: true },
);
const selectedTarget = computed(() => (selectedId.value ? findTaskTarget(taskDisplayTargets, selectedId.value) : undefined));
const selectedTargetEvents = computed(() => getTargetEvents(eventDetails.value, selectedTarget.value?.name ?? ""));
const targetEventGroups = computed(() => groupEventsByTime(selectedTargetEvents.value));
/** @description 打开选中事件的详情。 @param id 事件标识。 */
function openEventDetail(id: string): void {
  eventIndex.value = eventDetails.value.findIndex((event) => event.id === id);
}
/** @description 按顺序切换相邻事件，忽略越界操作。 @param direction 切换方向。 */
function moveEventDetail(direction: -1 | 1): void {
  const nextIndex = eventIndex.value + direction;
  if (eventIndex.value >= 0 && nextIndex >= 0 && nextIndex < eventDetails.value.length) eventIndex.value = nextIndex;
}
/** @description 关闭事件详情。 */
function closeEventDetail(): void {
  eventIndex.value = -1;
}
/** @description 同步弹窗关闭状态。 @param visible 弹窗是否可见。 */
function handleEventDialogVisibility(visible: boolean): void {
  if (!visible) closeEventDetail();
}
/** @description 根据节点实际位置生成事件脉络的贝塞尔曲线连接线。 */
function updateMindmapPaths(): void {
  const container = mindmapRef.value;
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  mindmapSize.value = { width: containerRect.width, height: containerRect.height };
  const getNodeCenter = (selector: string, side: "left" | "right") => {
    const node = container.querySelector<HTMLElement>(`[data-mindmap-node="${selector}"]`);
    if (!node) return undefined;
    const rect = node.getBoundingClientRect();
    return {
      x: (side === "left" ? rect.left : rect.right) - containerRect.left,
      y: rect.top - containerRect.top + rect.height / 2,
    };
  };
  const paths: string[] = [];
  taskDisplayEvents.forEach((phase, phaseIndex) => {
    const rootPoint = getNodeCenter("root", "right");
    const phasePoint = getNodeCenter(`phase-${phaseIndex}`, "left");
    if (rootPoint && phasePoint) paths.push(createMindmapCurve(rootPoint, phasePoint));
    phase.events.forEach((_, eventIndex) => {
      const eventPoint = getNodeCenter(`event-${phaseIndex}-${eventIndex}`, "left");
      const phaseRightPoint = getNodeCenter(`phase-${phaseIndex}`, "right");
      if (phaseRightPoint && eventPoint) paths.push(createMindmapCurve(phaseRightPoint, eventPoint));
    });
  });
  mindmapPaths.value = paths;
}
/** @description 创建一条水平布局的三次贝塞尔曲线。 @param start 起点坐标。 @param end 终点坐标。 @returns SVG path 数据。 */
function createMindmapCurve(start: { x: number; y: number }, end: { x: number; y: number }): string {
  const controlOffset = Math.max(28, Math.abs(end.x - start.x) * 0.45);
  return `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`;
}
/** @description 设置地图展示模式。 @param value 选择值。 */
function setMapMode(value: string | number | boolean | undefined): void {
  if (value === "2d" || value === "3d") mapMode.value = value;
}
/** @description 选择地图目标并显示操作菜单。 @param id 目标标识。 */
function selectMapTarget(id: string): void {
  selectedId.value = id;
  menuVisible.value = true;
  detailName.value = "";
  targetEventCardVisible.value = false;
}
/** @description 关闭知识图谱侧边栏并清除当前目标图谱上下文。 */
function closeKnowledgeGraph(): void {
  graphVisible.value = false;
  graphTargetId.value = null;
}
/** @description 打开任务级知识图谱并清除目标级图谱上下文。 */
function openTaskKnowledgeGraph(): void {
  graphTargetId.value = null;
  graphVisible.value = true;
}
/** @description 打开目标信息卡片。 @param name 菜单名称。 */
function openTargetDetail(name: string): void {
  detailName.value = name;
  menuVisible.value = false;
  targetEventCardVisible.value = name === "关联事件";
  targetTimelineVisible.value = name === "关联事件";
  if (name === "关联事件") stopEventReplay();
  if (name === "目标隐含关系") graphVisible.value = false;
  if (name === "图谱") {
    graphTargetId.value = selectedId.value;
    graphVisible.value = true;
    eventVisible.value = false;
    targetTimelineVisible.value = false;
    targetEventCardVisible.value = false;
  }
}
onMounted(() => {
  nextTick(updateMindmapPaths);
  mindmapResizeObserver = new ResizeObserver(updateMindmapPaths);
  if (mindmapRef.value) mindmapResizeObserver.observe(mindmapRef.value);
});
watch(eventVisible, (visible) => {
  if (!visible) return;
  nextTick(() => {
    updateMindmapPaths();
    if (mindmapRef.value && mindmapResizeObserver) mindmapResizeObserver.observe(mindmapRef.value);
  });
});
onBeforeUnmount(() => mindmapResizeObserver?.disconnect());
</script>
<style scoped lang="scss">
.task-display {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.task-display__target-timeline {
  position: absolute;
  z-index: 4;
  right: 12px;
  bottom: 12px;
  left: 12px;
  height: min(280px, 40%);
  overflow: hidden;
  border: 1px solid var(--aircas-color-primary);
  border-radius: 6px;
  color: var(--aircas-color-text-primary);
  background: color-mix(in srgb, var(--aircas-color-panel-background) 96%, transparent);
}
.task-display__target-timeline header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
}
.task-display__target-timeline header button {
  margin-left: auto;
  border: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
}
.task-display__target-timeline > p {
  padding: 0 12px;
  color: var(--aircas-color-text-secondary);
}
.task-display__timeline-scroll {
  overflow: auto;
  height: calc(100% - 50px);
  padding: 8px 16px 24px;
}
.task-display__timeline-list {
  display: flex;
  width: max-content;
  gap: 16px;
  align-items: stretch;
  padding-bottom: 16px;
  border-bottom: 3px solid var(--aircas-color-success);
}
.task-display__timeline-group {
  position: relative;
  display: flex;
  gap: 16px;
  align-items: stretch;
}
.task-display__timeline-event {
  display: flex;
  width: 190px;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--aircas-color-success);
  border-radius: 6px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background-deep);
  text-align: left;
  cursor: pointer;
}
.task-display__timeline-group::before {
  position: absolute;
  top: 100%;
  left: 50%;
  height: 16px;
  border-left: 2px solid var(--aircas-color-success);
  content: "";
  pointer-events: none;
}
.task-display__timeline-group::after {
  position: absolute;
  z-index: 1;
  top: calc(100% + 10px);
  left: 50%;
  width: 12px;
  height: 12px;
  transform: translateX(-50%);
  border: 2px solid var(--aircas-color-panel-background-deep);
  border-radius: 50%;
  background: var(--aircas-color-success);
  content: "";
  pointer-events: none;
}
.task-display__timeline-event time {
  color: var(--aircas-color-success);
}
.task-display__timeline-event span {
  color: var(--aircas-color-text-secondary);
}
.task-display__timeline-event:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 2px;
}
.task-display__replay {
  position: absolute;
  z-index: 6;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 14px;
  width: min(1000px, calc(100% - 40px));
  padding: 12px 16px;
  border: 1px solid var(--aircas-color-primary);
  border-radius: 8px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background-deep);
}
.task-display__replay time {
  white-space: nowrap;
  font-size: 13px;
}
.task-display__replay-progress {
  flex: 1;
  min-width: 80px;
}
.task-display__replay-progress > div {
  display: flex;
  justify-content: space-between;
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
}
.task-display__replay .el-select {
  width: 84px;
  flex-shrink: 0;
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
.task-display__target-groups li {
  padding: 8px 12px;
  list-style: none;
  border-bottom: 1px solid var(--aircas-color-border);
}
.task-display__target-groups {
  padding: 0;
  margin: 0;
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
.task-display__category-heading {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
}
.task-display__target-empty {
  padding: 8px 16px 8px 32px;
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
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
  position: relative;
  display: flex;
  align-items: center;
  min-width: 620px;
  min-height: 100%;
  padding: 24px;
}
.task-display__mindmap-lines {
  position: absolute;
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.task-display__mindmap-lines path {
  fill: none;
  stroke: var(--aircas-color-primary);
  stroke-width: 1;
}
.task-display__root,
.task-display__phase {
  position: relative;
  z-index: 1;
  padding: 12px;
  border: 1px solid var(--aircas-color-primary);
  border-radius: 8px;
  background: var(--aircas-color-card-background);
}
.task-display__root {
  width: 150px;
  flex-shrink: 0;
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
.task-display__phase {
  position: relative;
  display: flex;
  width: 145px;
  flex-shrink: 0;
  flex-direction: column;
  border-radius: 28px;
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
  color: var(--aircas-color-text-primary);
  text-align: left;
  cursor: pointer;
}
.task-display__event:hover,
.task-display__event:focus-visible {
  background: var(--aircas-color-hover);
}
.task-display__event:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 2px;
}
.task-display__graph-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.task-display__graph-panel {
  position: absolute;
  z-index: 5;
  top: 55px;
  right: 12px;
  bottom: 12px;
  width: min(640px, calc(100% - 24px));
  overflow: auto;
  padding: 0 16px 16px;
  border: 1px solid var(--aircas-color-primary);
  border-radius: 6px;
  color: var(--aircas-color-text-primary);
  background: color-mix(in srgb, var(--aircas-color-panel-background) 96%, transparent);
}
.task-display__graph-panel > header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 -16px 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--aircas-color-border);
  background: var(--aircas-color-panel-background);
}
.task-display__graph-panel > header button {
  margin-left: auto;
  border: 0;
  color: var(--aircas-color-text-primary);
  background: transparent;
  cursor: pointer;
}
.task-display__graph-summary > div {
  padding: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-card-background);
}
.task-display__graph-summary small,
.task-display__graph-summary span {
  display: block;
  color: var(--aircas-color-text-secondary);
}
.task-display__graph-summary strong {
  margin-right: 4px;
  color: var(--aircas-color-primary);
  font-size: 24px;
}
.task-display__graph-filters {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}
.task-display__graph-canvas {
  display: flex;
  height: max(400px, 55vh);
  min-height: 0;
  padding: 8px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background);
}
.task-display__event-dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 24px;
  font-size: 18px;
}
.task-display__event-dialog {
  max-height: 65vh;
  overflow: auto;
}
.task-display__event-dialog h3 {
  margin: 16px 0 8px;
  color: var(--aircas-color-primary);
}
.task-display__event-dialog p {
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.task-display__event-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
}
.task-display__event-details div {
  display: flex;
  gap: 8px;
  min-width: 0;
}
.task-display__event-details dt,
.task-display__confidence > span,
.task-display__event-targets span {
  flex-shrink: 0;
  color: var(--aircas-color-text-secondary);
}
.task-display__event-details dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}
.task-display__confidence {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.task-display__confidence .el-progress {
  flex: 1;
}
.task-display__event-targets div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
}
.task-display__event-position {
  margin-left: 8px;
  color: var(--aircas-color-text-secondary);
}
@media (max-width: 600px) {
  .task-display__event-details {
    grid-template-columns: 1fr;
  }
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
