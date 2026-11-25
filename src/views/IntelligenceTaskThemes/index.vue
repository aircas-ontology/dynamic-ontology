<template>
  <section class="task-themes">
    <el-alert v-if="requestError" :title="requestError" type="error" show-icon closable @close="requestError = ''" />
    <el-alert v-if="typeError" :title="typeError" type="warning" show-icon closable @close="typeError = ''" />
    <header class="task-themes__toolbar">
      <div>
        <h2>
          任务主题 <small>共 {{ taskThemes.length }} 项</small>
        </h2>
      </div>
      <div v-if="!deleteMode">
        <el-button plain :loading="requestLoading" @click="openCreateTask">＋ 新建任务主题</el-button
        ><el-button type="danger" plain :disabled="requestLoading" @click="deleteMode = true">♧ 删除</el-button>
      </div>
      <div v-else>
        <el-button type="danger" plain :loading="requestSubmitting" :disabled="!selectedTaskIds.length" @click="confirmTaskDeletion"
          >确认删除（{{ selectedTaskIds.length }}）</el-button
        ><el-button plain :disabled="requestSubmitting" @click="cancelTaskDeletion">取消</el-button>
      </div>
    </header>
    <div class="task-themes__grid">
      <article
        v-for="task in taskThemes"
        :key="task.id"
        class="task-card"
        :class="{ 'task-card--selected': deleteMode && selectedTaskIds.includes(task.id), 'task-card--selectable': deleteMode }"
        @click="deleteMode && toggleSelectedTask(task.id)"
      >
        <div class="task-card__visual">
          <h3>{{ task.title }}</h3>
          <span>{{ task.region }}</span>
          <div class="task-card__map">◈　◌　◉<br />　◌　◇　◈</div>
          <span v-if="deleteMode" class="task-card__checkbox" @click.stop>
            <el-checkbox :model-value="selectedTaskIds.includes(task.id)" :ariaLabel="`选择删除${task.title}`" @change="toggleSelectedTask(task.id)" />
          </span>
        </div>
        <p>{{ task.description }}</p>
        <div class="task-card__counts">
          <span
            v-for="(value, label) in {
              目标: task.counts.target,
              海上: task.counts.sea,
              空中: task.counts.air,
              陆上: task.counts.land,
              事件: task.counts.event,
            }"
            :key="label"
            >{{ label }}<b>{{ value }}</b></span
          >
        </div>
        <footer>
          <strong>{{ typeNames.get(String(task.category)) ?? task.category }} · {{ task.period }}</strong>
          <div class="task-card__actions">
            <el-button v-if="!deleteMode" size="small" plain @click.stop="openEditTask(task)">编辑</el-button
            ><el-button size="small" plain @click.stop="enterTask(task)">进入任务 →</el-button>
          </div>
        </footer>
      </article>
    </div>
    <TaskCreateDialog v-model:visible="taskDialogVisible" :initial-draft="editingDraft" @create="saveTaskTheme" />
  </section>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { deleteTaskTopicInterface, getTaskTopicDictionaryInterface, getTaskTopicListInterface, postTaskTopicInterface, putTaskTopicInterface } from "@/apis";
import type { IntelligenceTaskTheme } from "@/types";
import type { TaskTopicCreateParams, TaskTopicItem } from "@/types";
import TaskCreateDialog from "./components/TaskCreateDialog.vue";
import type { TaskDraft } from "./utils/taskDraft";
import { formatBeijingDateTime, parseRegionPoints, stringifyRegionPoints, taskThemeToDraft } from "./utils/taskDraft";
import { toggleTaskSelection } from "./utils/taskSelection";

const taskDialogVisible = ref(false);
const router = useRouter();
/** @description 携带所选任务的北京时间进入态势页。 @param task 当前任务。 */
function enterTask(task: IntelligenceTaskTheme): void {
  if (deleteMode.value) return;
  const [startTime] = task.period.split(" ~ ");
  void router.push({ name: "IntelligenceTaskDisplay", query: { taskId: task.id, startTime, spaceId: task.spaceId ?? undefined } });
}
const taskThemes = ref<IntelligenceTaskTheme[]>([]);
const requestError = ref("");
const requestLoading = ref(false);
const requestSubmitting = ref(false);
const editingId = ref<string | null>(null);
const editingDraft = ref<TaskDraft | null>(null);
/** @description 打开空白任务表单。 */
function openCreateTask(): void {
  editingId.value = null;
  editingDraft.value = null;
  taskDialogVisible.value = true;
}
/** @description 打开任务编辑表单。 @param task 待编辑任务。 */
function openEditTask(task: IntelligenceTaskTheme): void {
  editingId.value = task.id;
  editingDraft.value = taskThemeToDraft(task);
  taskDialogVisible.value = true;
}
const deleteMode = ref(false);
const selectedTaskIds = ref<string[]>([]);
/** @description 切换任务的待删除状态。 @param id 任务标识。 */
function toggleSelectedTask(id: string): void {
  selectedTaskIds.value = toggleTaskSelection(selectedTaskIds.value, id);
}
/** @description 取消批量删除并清空选择。 */
function cancelTaskDeletion(): void {
  deleteMode.value = false;
  selectedTaskIds.value = [];
}
/** @description 从当前页面移除选中的任务。 */
function confirmTaskDeletion(): void {
  if (!selectedTaskIds.value.length) return;
  void deleteSelectedTaskThemes();
}
/** @description 将接口任务记录转换为页面卡片模型。 @param item 接口任务记录。 @returns 页面任务主题。 */
function mapTaskTopic(item: TaskTopicItem): IntelligenceTaskTheme {
  return {
    id: String(item.id),
    title: item.taskName,
    region: item.taskRegion,
    points: parseRegionPoints(item.regionPoint),
    description: item.description ?? "",
    category: item.taskType,
    spaceId: Number(item.ontologySpace) || null,
    period: `${formatBeijingDateTime(item.startTime)} ~ ${formatBeijingDateTime(item.endTime)}`,
    counts: { target: item.targetCount ?? 0, sea: item.seaCount ?? 0, air: item.airCount ?? 0, land: item.landCount ?? 0, event: item.eventCount ?? 0 },
  };
}
/** @description 将页面草稿转换为任务主题接口参数。 @param draft 已确认草稿。 @returns 接口请求参数。 */
function mapTaskDraftToRequest(draft: TaskDraft): TaskTopicCreateParams {
  return {
    taskName: draft.name,
    taskType: String(draft.category),
    taskRegion: String(draft.region),
    regionPoint: stringifyRegionPoints(draft.points),
    startTime: draft.startTime,
    endTime: draft.ongoing ? "" : draft.endTime,
    description: draft.description,
    ontologySpace: draft.spaceId === null ? "" : String(draft.spaceId),
    status: 0,
  };
}
/** @description 查询任务主题列表并刷新页面卡片。 */
async function loadTaskThemes(): Promise<void> {
  requestLoading.value = true;
  requestError.value = "";
  try {
    const response = await getTaskTopicListInterface();
    if (response.code !== 200) throw new Error(response.message || "查询任务主题失败");
    taskThemes.value = (response.data ?? []).map(mapTaskTopic);
  } catch (cause) {
    taskThemes.value = [];
    requestError.value = cause instanceof Error ? cause.message : "查询任务主题失败";
  } finally {
    requestLoading.value = false;
  }
}
/** @description 提交新建或编辑任务主题并刷新列表。 @param draft 已确认草稿。 */
async function saveTaskTheme(draft: TaskDraft): Promise<void> {
  requestSubmitting.value = true;
  requestError.value = "";
  try {
    const payload = mapTaskDraftToRequest(draft);
    const response =
      editingId.value === null
        ? await postTaskTopicInterface(payload)
        : await putTaskTopicInterface({
            ...payload,
            id: editingId.value,
          });
    if (response.code !== 200) throw new Error(response.message || (editingId.value === null ? "创建任务主题失败" : "编辑任务主题失败"));
    taskDialogVisible.value = false;
    await loadTaskThemes();
  } catch (cause) {
    requestError.value = cause instanceof Error ? cause.message : "保存任务主题失败";
  } finally {
    requestSubmitting.value = false;
  }
}
/** @description 删除选中的任务主题并刷新列表。 */
async function deleteSelectedTaskThemes(): Promise<void> {
  requestSubmitting.value = true;
  requestError.value = "";
  try {
    for (const id of selectedTaskIds.value) {
      const response = await deleteTaskTopicInterface(id);
      if (response.code !== 200) throw new Error(response.message || "删除任务主题失败");
    }
    cancelTaskDeletion();
    await loadTaskThemes();
  } catch (cause) {
    requestError.value = cause instanceof Error ? cause.message : "删除任务主题失败";
  } finally {
    requestSubmitting.value = false;
  }
}
const typeNames = ref(new Map<string, string>());
const typeError = ref("");
/** @description 查询任务类型，在当前列表页按字典 ID 缓存显示名称。 */
async function loadTaskTypeNames(): Promise<void> {
  try {
    const response = await getTaskTopicDictionaryInterface("task_type");
    if (response.code !== 200) throw new Error(response.message || "任务类型字典加载失败");
    for (const item of response.data ?? []) {
      if (item.dictName) typeNames.value.set(String(item.id), item.dictName);
    }
  } catch (error) {
    typeError.value = error instanceof Error ? error.message : "任务类型字典加载失败";
  }
}
onMounted(() => {
  void loadTaskThemes();
  void loadTaskTypeNames();
});
</script>
<style scoped lang="scss">
.task-themes__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.task-themes h2 {
  margin: 0 0 26px;
  color: var(--aircas-color-primary);
  font-size: 22px;
}
.task-themes h2 small {
  margin-left: 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}
.task-themes__grid {
  display: grid;
  grid-template-columns: repeat(3, 508px);
  gap: 30px;
}
.task-card {
  width: 508px;
  height: 322px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-primary);
  border-radius: 8px;
  background: color-mix(in srgb, var(--aircas-color-panel-background) 92%, transparent);
}
.task-card--selected {
  border-color: var(--aircas-color-danger);
  box-shadow: 0 0 0 1px var(--aircas-color-danger);
}
.task-card--selectable {
  cursor: pointer;
}
.task-card__checkbox {
  position: absolute;
  z-index: 2;
  left: 12px;
  bottom: 12px;
}
.task-card__visual {
  position: relative;
  min-height: 158px;
  padding: 12px;
  background: linear-gradient(150deg, var(--aircas-color-panel-background-deep), var(--aircas-color-hover));
  background-image:
    linear-gradient(
      color-mix(in srgb, var(--aircas-color-panel-background-deep) 48%, transparent),
      color-mix(in srgb, var(--aircas-color-panel-background-deep) 48%, transparent)
    ),
    url("@/assets/pages/ontologySpaceManagement/images/navy.webp");
  background-position: center;
  background-size: cover;
}
.task-card__visual h3 {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 18px;
}
.task-card__visual > span {
  z-index: 1;
  position: absolute;
  right: 14px;
  top: 14px;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 6px;
  padding: 2px 8px;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-cyan-soft);
  font-size: 12px;
  font-weight: 600;
}
.task-card__map {
  display: flex;
  height: 102px;
  align-items: center;
  justify-content: center;
  color: var(--aircas-color-primary);
  font-size: 24px;
  line-height: 2;
  letter-spacing: 10px;
  opacity: 0.8;
}
.task-card p {
  display: -webkit-box;
  min-height: 58px;
  max-height: 58px;
  margin: 0;
  padding: 10px 12px;
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.task-card__counts {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 6px 12px;
  border-bottom: 1px solid var(--aircas-color-border);
}
.task-card__counts span {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}
.task-card__counts b {
  margin-top: 4px;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}
.task-card footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  min-width: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  font-weight: 600;
}
.task-card footer strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-card__actions {
  display: flex;
  flex-shrink: 0;
  margin-left: 8px;
}
@media (max-width: 1200px) {
  .task-themes__grid {
    grid-template-columns: repeat(2, 508px);
  }
}
@media (max-width: 760px) {
  .task-themes__grid {
    grid-template-columns: 508px;
  }
  .intelligence-layout__time {
    gap: 10px;
  }
  .intelligence-layout__time h1 {
    font-size: 20px;
  }
  .intelligence-layout__time b {
    font-size: 14px;
  }
  .task-themes__grid {
    grid-template-columns: 1fr;
  }
}
</style>
