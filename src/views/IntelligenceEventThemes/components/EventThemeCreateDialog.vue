<template>
  <el-dialog
    :model-value="visible"
    title="新增事件主题"
    width="min(720px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="event-create__body">
      <el-form label-width="112px" label-position="right">
        <el-form-item label="事件主题名称" required>
          <el-input v-model="draft.name" maxlength="80" show-word-limit placeholder="请输入事件主题名称" />
        </el-form-item>
        <el-form-item label="事件主题类别" required>
          <el-select v-model="draft.category" placeholder="请选择事件主题类别">
            <el-option v-for="category in categories" :key="category" :label="category" :value="category" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间窗口" required>
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :prefix-icon="Clock"
            class="event-create__time"
          />
        </el-form-item>
        <el-form-item label="地理区域" required>
          <el-select v-model="draft.region" placeholder="请选择地理区域">
            <el-option v-for="region in regions" :key="region" :label="region" :value="region" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域点位">
          <div class="event-create__area">
            <div class="event-create__map-toolbar">
              <el-button @click="mapVisible = !mapVisible">{{ mapVisible ? "收起地图" : "地图选点" }}</el-button>
              <el-button v-if="mapVisible" :disabled="!draft.points.length" @click="draft.points.pop()">撤销上一个点</el-button>
              <span>已选 {{ draft.points.length }} 个点，至少需要 3 个</span>
            </div>
            <EventAreaMap v-if="mapVisible" :points="draft.points" @add="addEventPoint" />
            <div v-if="mapVisible && draft.points.length" class="event-create__coordinates">
              <span v-for="(point, index) in draft.points" :key="index">
                点 {{ index + 1 }}　经度 {{ point[0].toFixed(6) }}°　纬度 {{ point[1].toFixed(6) }}°
              </span>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="事件主题描述" required>
          <el-input v-model="draft.description" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="请输入事件主题描述" />
        </el-form-item>
        <el-form-item label="关联本体空间" required>
          <el-select v-model="draft.spaceId" :loading="spaceLoading" placeholder="请选择关联本体空间">
            <el-option v-for="space in spaces" :key="space.spaceId" :label="space.displayName" :value="space.spaceId" />
          </el-select>
          <p v-if="spaceError" class="event-create__error" role="alert">{{ spaceError }} <el-button link @click="loadEventSpaces">重试</el-button></p>
        </el-form-item>
      </el-form>
      <p v-if="formError" class="event-create__error" role="alert">{{ formError }}</p>
    </div>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="confirmEventDraft">保存</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { onScopeDispose, reactive, ref, watch } from "vue";
import { Clock } from "@element-plus/icons-vue";
import { getOntologySpaceListInterface } from "@/apis";
import type { IntelligenceEventThemeCategory, OntologySpaceListItem } from "@/types";
import EventAreaMap from "./EventAreaMap.vue";
import { validateEventThemeDraft, type EventThemeDraft } from "../utils/eventThemeDraft";

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ "update:visible": [value: boolean]; create: [draft: EventThemeDraft] }>();
const categories: IntelligenceEventThemeCategory[] = ["装备部署", "冲突战争", "演习训练"];
const regions = ["乌克兰东部", "波斯湾", "西太平洋", "南海海域", "第一岛链", "关岛周边", "东海海域", "克什米尔地区", "菲律宾海"];
const draft = reactive<EventThemeDraft>({
  name: "",
  category: "",
  region: "",
  startTime: "",
  endTime: "",
  points: [],
  description: "",
  spaceId: null,
});
const timeRange = ref<[string, string] | null>(null);
const spaces = ref<OntologySpaceListItem[]>([]);
const spaceLoading = ref(false);
const spaceError = ref("");
const formError = ref("");
const mapVisible = ref(false);
let revision = 0;

/** @description 查询可关联的对象空间并忽略过期响应。 */
async function loadEventSpaces(): Promise<void> {
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

/** @description 将地图选中的经纬度加入区域点位。 @param point 经度和纬度。 */
function addEventPoint(point: [number, number]): void {
  draft.points.push(point);
}

/** @description 校验表单并将事件主题草稿交给列表页。 */
function confirmEventDraft(): void {
  draft.startTime = timeRange.value?.[0] ?? "";
  draft.endTime = timeRange.value?.[1] ?? "";
  formError.value = validateEventThemeDraft(draft);
  if (formError.value) return;
  emit("create", { ...draft, points: draft.points.map((point) => [...point]) });
}

watch(
  () => props.visible,
  (visible) => {
    revision++;
    mapVisible.value = false;
    if (!visible) return;
    Object.assign(draft, { name: "", category: "", region: "", startTime: "", endTime: "", points: [], description: "", spaceId: null });
    timeRange.value = null;
    formError.value = "";
    spaces.value = [];
    void loadEventSpaces();
  },
);
onScopeDispose(() => {
  revision++;
});
</script>
<style scoped lang="scss">
.event-create__body {
  max-height: min(70vh, 740px);
  overflow-y: auto;
  padding: 8px 16px 0 0;
}
.event-create__area {
  width: 100%;
}
.event-create__map-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--aircas-color-text-secondary);
}
.event-create__time {
  width: 100%;
}
.event-create__coordinates {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.event-create__error {
  margin: 4px 0;
  color: var(--aircas-color-danger);
}
</style>
