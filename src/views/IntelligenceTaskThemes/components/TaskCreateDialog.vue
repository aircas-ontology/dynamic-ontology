<template>
  <el-dialog
    :model-value="visible"
    :title="initialDraft ? '编辑任务' : '新增任务'"
    width="min(720px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="task-create__body">
      <el-form label-width="112px" label-position="right">
        <el-form-item label="任务名称" required><el-input v-model="draft.name" maxlength="80" show-word-limit placeholder="请输入任务名称" /></el-form-item>
        <el-form-item label="任务类型" required
          ><el-select v-model="draft.category" placeholder="请选择任务类型"
            ><el-option v-for="item in categories" :key="item" :label="item" :value="item" /></el-select
        ></el-form-item>
        <el-form-item label="任务区域" required
          ><el-select v-model="draft.region" filterable allow-create default-first-option placeholder="请选择或输入任务区域"
            ><el-option v-for="item in regions" :key="item" :label="item" :value="item" /></el-select
        ></el-form-item>
        <el-form-item label="区域点位">
          <div class="task-create__area">
            <div class="task-create__map-toolbar">
              <el-button @click="mapVisible = !mapVisible">{{ mapVisible ? "收起地图" : "地图选点" }}</el-button
              ><el-button v-if="mapVisible" :disabled="!draft.points.length" @click="draft.points.pop()">撤销上一个点</el-button
              ><span>已选 {{ draft.points.length }} 个点，至少需要 3 个</span>
            </div>
            <TaskAreaMap v-if="mapVisible" :points="draft.points" @add="addTaskPoint" />
            <div v-if="mapVisible && draft.points.length" class="task-create__coordinates">
              <span v-for="(point, index) in draft.points" :key="index"
                >点 {{ index + 1 }}　经度 {{ point[0].toFixed(6) }}°　纬度 {{ point[1].toFixed(6) }}°</span
              >
            </div>
          </div>
        </el-form-item>
        <el-form-item label="任务时间" required
          ><div class="task-create__time">
            <div class="task-create__time-range">
              <el-date-picker v-model="draft.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="开始时间" /><span>至</span
              ><el-date-picker v-model="draft.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="结束时间" :disabled="draft.ongoing" />
            </div>
            <el-checkbox :model-value="draft.ongoing" @update:model-value="draft.ongoing = $event === true">结束时间至今（持续进行）</el-checkbox>
          </div></el-form-item
        >
        <el-form-item label="任务描述" required
          ><el-input v-model="draft.description" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="请输入任务描述"
        /></el-form-item>
        <el-form-item label="关联本体空间" required
          ><el-select v-model="draft.spaceId" :loading="spaceLoading" placeholder="请选择关联本体空间"
            ><el-option v-for="space in spaces" :key="space.spaceId" :label="space.displayName" :value="space.spaceId"
          /></el-select>
          <p v-if="spaceError" class="task-create__error" role="alert">
            {{ spaceError }} <el-button link @click="loadTaskSpaces">重试</el-button>
          </p></el-form-item
        >
      </el-form>
      <p v-if="formError" class="task-create__error" role="alert">{{ formError }}</p>
    </div>
    <template #footer
      ><el-button @click="$emit('update:visible', false)">取消</el-button
      ><el-button type="primary" @click="confirmTaskDraft">{{ initialDraft ? "保存" : "创建任务" }}</el-button></template
    >
  </el-dialog>
</template>
<script setup lang="ts">
import { onScopeDispose, reactive, ref, watch } from "vue";
import { getOntologySpaceListInterface } from "@/apis";
import type { OntologySpaceListItem } from "@/types";
import TaskAreaMap from "./TaskAreaMap.vue";
import { validateTaskDraft, type TaskDraft } from "../utils/taskDraft";

const props = defineProps<{ visible: boolean; initialDraft?: TaskDraft | null }>();
const emit = defineEmits<{ "update:visible": [value: boolean]; create: [draft: TaskDraft] }>();
const categories = ["军事作战", "演习演练", "情报侦察", "综合保障", "其它"];
const regions = ["西太平洋", "南海海域", "东海海域", "第一岛链", "关岛周边", "乌克兰东部", "波斯湾", "台湾岛"];
const draft = reactive<TaskDraft>({
  name: "",
  category: "",
  region: "",
  description: "",
  spaceId: null,
  startTime: "",
  endTime: "",
  ongoing: false,
  points: [],
});
const spaces = ref<OntologySpaceListItem[]>([]);
const spaceLoading = ref(false);
const spaceError = ref("");
const formError = ref("");
const mapVisible = ref(false);
let revision = 0;

/** @description 查询可关联的对象空间并忽略过期响应。 */
async function loadTaskSpaces(): Promise<void> {
  const current = ++revision;
  spaceLoading.value = true;
  spaceError.value = "";
  try {
    const response = await getOntologySpaceListInterface({ type: 0 });
    if (current !== revision) return;
    if (response.code !== 200) throw new Error(response.message || "查询对象空间失败");
    spaces.value = response.data ?? [];
  } catch (cause) {
    if (current === revision) {
      spaces.value = [];
      spaceError.value = cause instanceof Error ? cause.message : "查询对象空间失败";
    }
  } finally {
    if (current === revision) spaceLoading.value = false;
  }
}
/** @description 将地图选中的经纬度加入任务区域。 @param point 经度和纬度。 */
function addTaskPoint(point: [number, number]): void {
  draft.points.push(point);
}
/** @description 校验表单并将任务草稿交给列表页。 */
function confirmTaskDraft(): void {
  formError.value = validateTaskDraft(draft);
  if (formError.value) return;
  emit("create", { ...draft, points: draft.points.map((point) => [...point]) });
  emit("update:visible", false);
}
watch(
  () => props.visible,
  (visible) => {
    revision++;
    mapVisible.value = false;
    if (!visible) return;
    Object.assign(
      draft,
      props.initialDraft
        ? { ...props.initialDraft, points: props.initialDraft.points.map(([lng, lat]) => [lng, lat]) }
        : { name: "", category: "", region: "", description: "", spaceId: null, startTime: "", endTime: "", ongoing: false, points: [] },
    );
    mapVisible.value = !!props.initialDraft?.points.length;
    formError.value = "";
    spaces.value = [];
    void loadTaskSpaces();
  },
);
onScopeDispose(() => {
  revision++;
});
</script>
<style scoped lang="scss">
.task-create__body {
  max-height: min(70vh, 740px);
  overflow-y: auto;
  padding: 8px 16px 0 0;
}
.task-create__area,
.task-create__time {
  width: 100%;
}
.task-create__map-toolbar,
.task-create__time-range {
  display: flex;
  align-items: center;
  gap: 8px;
}
.task-create__map-toolbar {
  margin-bottom: 8px;
  color: var(--aircas-color-text-secondary);
}
.task-create__time-range :deep(.el-date-editor) {
  flex: 1;
  width: 0;
}
.task-create__coordinates {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.task-create__error {
  margin: 4px 0;
  color: var(--aircas-color-danger);
}
</style>
