<template>
  <section class="task-themes">
    <header class="task-themes__toolbar">
      <div>
        <h2>
          任务主题 <small>共 {{ taskThemes.length }} 项</small>
        </h2>
      </div>
      <div v-if="!deleteMode">
        <el-button plain @click="openCreateTask">＋ 新建任务主题</el-button><el-button type="danger" plain @click="deleteMode = true">♧ 删除</el-button>
      </div>
      <div v-else>
        <el-button type="danger" plain :disabled="!selectedTaskIds.length" @click="confirmTaskDeletion">确认删除（{{ selectedTaskIds.length }}）</el-button
        ><el-button plain @click="cancelTaskDeletion">取消</el-button>
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
          <strong>{{ task.category }} · {{ task.period }}</strong>
          <div class="task-card__actions">
            <el-button v-if="!deleteMode" size="small" plain @click.stop="openEditTask(task)">编辑</el-button
            ><el-button size="small" plain @click.stop="enterTask">进入任务 →</el-button>
          </div>
        </footer>
      </article>
    </div>
    <TaskCreateDialog v-model:visible="taskDialogVisible" :initial-draft="editingDraft" @create="saveTaskTheme" />
  </section>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { intelligenceTaskThemes } from "@/mocks/intelligenceFusionTaskThemes";
import type { IntelligenceTaskTheme } from "@/types";
import TaskCreateDialog from "./components/TaskCreateDialog.vue";
import type { TaskDraft } from "./utils/taskDraft";
import { taskThemeToDraft, updateTaskTheme } from "./utils/taskDraft";
import { removeSelectedTasks, toggleTaskSelection } from "./utils/taskSelection";

const taskDialogVisible = ref(false);
const router = useRouter();
/** @description 进入独立的任务展示页面。 */
function enterTask(): void {
  if (!deleteMode.value) void router.push({ name: "IntelligenceTaskDisplay" });
}
const taskThemes = ref([...intelligenceTaskThemes]);
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
  taskThemes.value = removeSelectedTasks(taskThemes.value, selectedTaskIds.value);
  cancelTaskDeletion();
}
/** @description 在当前页面中展示新建的任务草稿。 @param draft 已校验的任务草稿。 */
function saveTaskTheme(draft: TaskDraft): void {
  if (editingId.value !== null) {
    taskThemes.value = taskThemes.value.map((task) => (task.id === editingId.value ? updateTaskTheme(task, draft) : task));
    return;
  }
  taskThemes.value.push({
    id: `local-${Date.now()}`,
    title: draft.name,
    region: draft.region,
    description: draft.description,
    category: draft.category,
    spaceId: draft.spaceId,
    points: draft.points.map(([lng, lat]) => [lng, lat]),
    period: `${draft.startTime} ~ ${draft.ongoing ? "至今" : draft.endTime}`,
    counts: { target: 0, sea: 0, air: 0, land: 0, event: 0 },
  });
}
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
