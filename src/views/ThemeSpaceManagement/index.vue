<template>
  <div class="theme-space-management">
    <button
      :class="{ 'is-embedded': isEmbedded }"
      class="theme-space-management__help"
      type="button"
      aria-label="打开新手引导"
      title="新手引导"
      @click="openOnboardingGuide()"
    >
      <el-icon><QuestionFilled /></el-icon>
    </button>
    <div class="theme-space-management__toolbar-row">
      <SectionToolbar title="主题管理" space-label="主题" v-model:keyword="keyword" v-model:order="order" v-model:view-mode="viewMode" />
      <el-button type="primary" data-onboarding="theme-create-open" @click="openCreateThemeSpaceDialog()">
        <el-icon><Plus /></el-icon>新建主题
      </el-button>
    </div>
    <section class="theme-space-management__list" aria-label="主题列表">
      <div v-if="themeSpacesLoading" class="theme-space-management__empty">正在加载主题…</div>
      <div v-else-if="themeSpacesError" class="theme-space-management__empty">{{ themeSpacesError }}</div>
      <div v-else-if="!filteredSpaces.length" class="theme-space-management__empty">暂无主题，请调整搜索条件</div>
      <div v-else-if="viewMode === 'card'" class="theme-space-management__grid">
        <article v-for="space in pagedSpaces" :key="space.id" class="theme-space-card">
          <div class="theme-space-card__name">
            <span class="theme-space-card__icon">
              <img v-if="space.iconUrl" :src="space.iconUrl" :alt="`${space.displayName}主题图片`" />
              <el-icon v-else :size="22"><Box /></el-icon>
            </span>
            <div>
              <strong>{{ space.displayName }}</strong>
              <small>{{ space.apiName }}</small>
            </div>
          </div>
          <p>{{ space.description }}</p>
          <dl>
            <div>
              <dt>
                <el-icon><DataLine /></el-icon>对象
              </dt>
              <dd>{{ space.metrics.ontology }}</dd>
            </div>
            <div>
              <dt>
                <el-icon><Connection /></el-icon>关系
              </dt>
              <dd>{{ space.metrics.relation }}</dd>
            </div>
            <div>
              <dt>
                <el-icon><Operation /></el-icon>行为
              </dt>
              <dd>{{ space.metrics.behavior }}</dd>
            </div>
            <div>
              <dt>
                <el-icon><Tickets /></el-icon>实体
              </dt>
              <dd>{{ space.metrics.entity }}</dd>
            </div>
          </dl>
          <footer>
            <div class="theme-space-card__meta">
              <span>创建：{{ space.createdTime }}</span>
              <span>更新：{{ space.updatedTime }}</span>
            </div>
            <div>
              <el-button type="primary" plain data-onboarding="theme-enter" @click="browseThemeSpace(space)">浏览</el-button>
              <el-button type="primary" plain @click="openExportThemeSpaceDialog(space)">导出</el-button>
              <el-button type="primary" plain @click="notifyApplicationDisplayUnavailable()">应用展示</el-button>
            </div>
          </footer>
        </article>
      </div>
      <el-table v-else class="theme-space-table" :data="pagedSpaces" stripe row-key="id">
        <el-table-column label="主题名称" min-width="280">
          <template #default="{ row }">
            <div class="theme-space-table__name">
              <span class="theme-space-table__icon">
                <img v-if="asThemeSpace(row).iconUrl" :src="asThemeSpace(row).iconUrl" :alt="`${asThemeSpace(row).displayName}主题图片`" />
                <el-icon v-else :size="22"><Box /></el-icon>
              </span>
              <div>
                <strong>{{ asThemeSpace(row).displayName }}</strong>
                <small>{{ asThemeSpace(row).apiName }}</small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="对象" width="90" align="center">
          <template #default="{ row }">{{ asThemeSpace(row).metrics.ontology }}</template>
        </el-table-column>
        <el-table-column label="关系" width="90" align="center">
          <template #default="{ row }">{{ asThemeSpace(row).metrics.relation }}</template>
        </el-table-column>
        <el-table-column label="行为" width="90" align="center">
          <template #default="{ row }">{{ asThemeSpace(row).metrics.behavior }}</template>
        </el-table-column>
        <el-table-column label="实体" width="90" align="center">
          <template #default="{ row }">{{ asThemeSpace(row).metrics.entity }}</template>
        </el-table-column>
        <el-table-column prop="createdTime" label="创建时间" width="180" />
        <el-table-column prop="updatedTime" label="更新时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" plain data-onboarding="theme-enter" @click="browseThemeSpace(asThemeSpace(row))">浏览</el-button>
            <el-button type="primary" plain @click="openExportThemeSpaceDialog(asThemeSpace(row))">导出</el-button>
            <el-button type="primary" plain @click="notifyApplicationDisplayUnavailable()">应用展示</el-button>
          </template>
        </el-table-column>
      </el-table>
      <footer class="theme-space-management__pagination">
        <span>共 {{ filteredSpaces.length }} 条</span>
        <el-pagination
          v-model:current-page="page"
          background
          layout="prev, pager, next, sizes"
          :total="filteredSpaces.length"
          :page-sizes="[5, 10, 20]"
          :page-size="pageSize"
          @update:page-size="pageSize = $event"
        />
      </footer>
    </section>
    <el-dialog v-model="createDialogVisible" title="新建主题" width="420px">
      <el-form label-position="top">
        <el-form-item label="选择对象空间" data-onboarding="theme-create-space-select">
          <el-select v-model="selectedObjectSpace" placeholder="请选择对象空间" :loading="objectSpacesLoading" style="width: 100%">
            <el-option v-for="space in objectSpaces" :key="space.id" :label="space.displayName" :value="space.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button data-onboarding="theme-create-cancel" @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" data-onboarding="theme-create-confirm" @click="confirmCreateThemeSpace">确认</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="exportDialogVisible" title="导出主题" width="min(460px, 94vw)">
      <p>导出「{{ exportSpace?.displayName }}」。</p>
      <el-radio-group v-model="exportType">
        <el-radio value="SCHEMA">仅结构</el-radio>
        <el-radio value="INSTANCE">含实例数据</el-radio>
      </el-radio-group>
      <p v-if="exportError" class="theme-space-management__error">{{ exportError }}</p>
      <template #footer>
        <el-button :disabled="exportBusy" @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="exportBusy" @click="confirmExportThemeSpace">导出</el-button>
      </template>
    </el-dialog>
    <OnboardingGuideOverlay v-model="guideVisible" :steps="themeOnboardingGuideSteps" :start-id="guideStartId" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { getExportOntologySpaceInterface, getOntologySpaceListInterface } from "@/apis";
import type { OntologySpaceExportType, OntologySpaceItem } from "@/types";
import { mapOntologySpaceList } from "@/utils/mapOntologySpaceList";
import { downloadSpaceFile } from "../OntologySpaceManagement/utils/downloadSpaceJson";
import { resolveExportOntologySpaceFileName } from "../OntologySpaceManagement/utils/resolveExportOntologySpaceFileName";
import { Box, Connection, DataLine, Operation, Plus, QuestionFilled, Tickets } from "@element-plus/icons-vue";
import SectionToolbar from "../OntologySpaceManagement/components/SectionToolbar.vue";
import OnboardingGuideOverlay from "@/components/OnboardingGuide/OnboardingGuideOverlay.vue";
import { useOnboardingGuide } from "@/composables/shared/useOnboardingGuide";
import { ONBOARDING_GUIDE_ENTRY_IDS, THEME_ONBOARDING_GUIDE_STEPS } from "@/views/onboardingGuideSteps";

const themeOnboardingGuideSteps = THEME_ONBOARDING_GUIDE_STEPS;
const {
  visible: guideVisible,
  startId: guideStartId,
  openOnboardingGuide,
} = useOnboardingGuide({
  steps: themeOnboardingGuideSteps,
  page: "theme-list",
  entryStepId: ONBOARDING_GUIDE_ENTRY_IDS["theme-list"],
});

const keyword = ref("");
const order = ref<"asc" | "desc">("asc");
const page = ref(1);
const pageSize = ref(10);
const viewMode = ref<"card" | "table">("card");
const createDialogVisible = ref(false);
const selectedObjectSpace = ref("");
const themeSpaces = ref<OntologySpaceItem[]>([]);
const themeSpacesLoading = ref(false);
const themeSpacesError = ref("");
const objectSpaces = ref<OntologySpaceItem[]>([]);
const objectSpacesLoading = ref(false);
const exportDialogVisible = ref(false);
const exportSpace = ref<OntologySpaceItem | null>(null);
const exportType = ref<OntologySpaceExportType>("INSTANCE");
const exportBusy = ref(false);
const exportError = ref("");

const filteredSpaces = computed(() =>
  [...themeSpaces.value]
    .filter((space) => !keyword.value.trim() || `${space.displayName}${space.apiName}`.toLowerCase().includes(keyword.value.trim().toLowerCase()))
    .sort((a, b) => (order.value === "asc" ? a.displayName.localeCompare(b.displayName, "zh-CN") : b.displayName.localeCompare(a.displayName, "zh-CN"))),
);
const pagedSpaces = computed(() => filteredSpaces.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));

const router = useRouter();
const route = useRoute();
const isEmbedded = computed(() => typeof route.query.userName === "string" && route.query.userName.trim().length > 0);

/**
 * @description 提示应用展示功能尚未接入。
 */
function notifyApplicationDisplayUnavailable(): void {
  ElMessage.info("应用展示功能暂未接入");
}

/**
 * @description 打开主题导出弹窗。
 * @param space 当前主题。
 */
function openExportThemeSpaceDialog(space: OntologySpaceItem): void {
  exportSpace.value = space;
  exportType.value = "INSTANCE";
  exportError.value = "";
  exportDialogVisible.value = true;
}

/**
 * @description 调用对象空间导出接口并下载主题文件。
 */
async function confirmExportThemeSpace(): Promise<void> {
  if (!exportSpace.value || exportBusy.value) return;
  const spaceId = Number(exportSpace.value.id);
  if (!Number.isInteger(spaceId)) {
    exportError.value = "缺少空间 id，无法导出。";
    return;
  }
  exportBusy.value = true;
  exportError.value = "";
  try {
    const file = await getExportOntologySpaceInterface({ spaceId, exportType: exportType.value });
    const fileName = resolveExportOntologySpaceFileName({
      contentDisposition: file.contentDisposition,
      contentType: file.contentType,
      apiName: exportSpace.value.apiName,
      spaceId,
    });
    downloadSpaceFile(fileName, file.blob);
    exportDialogVisible.value = false;
    ElMessage.success("导出文件已生成");
  } catch (cause) {
    exportError.value = cause instanceof Error ? cause.message : "导出失败，请重试。";
  } finally {
    exportBusy.value = false;
  }
}

/**
 * @description 打开新建主题弹窗并默认选中第一条已加载的对象空间，随后刷新对象空间列表。
 */
function openCreateThemeSpaceDialog(): void {
  selectedObjectSpace.value = objectSpaces.value[0]?.id ?? "";
  void loadObjectSpaces();
  createDialogVisible.value = true;
}

/**
 * @description 查询对象空间管理使用的对象空间列表供主题选择。
 */
async function loadObjectSpaces(): Promise<void> {
  objectSpacesLoading.value = true;
  try {
    const response = await getOntologySpaceListInterface({ type: 0 });
    if (response.code !== 200) throw new Error(response.message || "对象空间列表加载失败");
    objectSpaces.value = mapOntologySpaceList(response.data);
    selectedObjectSpace.value ||= objectSpaces.value[0]?.id ?? "";
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : "对象空间列表加载失败");
  } finally {
    objectSpacesLoading.value = false;
  }
}

/**
 * @description 查询主题列表供页面卡片与表格展示。
 */
async function loadThemeSpaces(): Promise<void> {
  themeSpacesLoading.value = true;
  themeSpacesError.value = "";
  try {
    const response = await getOntologySpaceListInterface({ type: 1 });
    if (response.code !== 200) throw new Error(response.message || "主题列表加载失败");
    themeSpaces.value = mapOntologySpaceList(response.data);
  } catch (cause) {
    themeSpacesError.value = cause instanceof Error ? cause.message : "主题列表加载失败";
    ElMessage.error(themeSpacesError.value);
  } finally {
    themeSpacesLoading.value = false;
  }
}

onMounted(() => {
  void loadThemeSpaces();
});

/**
 * @description 校验已选对象空间后关闭弹窗并跳转子空间创建流程。
 */
function confirmCreateThemeSpace(): void {
  const selectedSpace = objectSpaces.value.find((space) => space.id === selectedObjectSpace.value);
  if (!selectedSpace) {
    ElMessage.warning("请选择对象空间");
    return;
  }
  createDialogVisible.value = false;
  void router.push({
    name: "OntologySubspaceCreate",
    params: { spaceId: selectedSpace.id },
    query: {
      spaceId: selectedSpace.id,
      spaceName: selectedSpace.displayName,
      from: "theme-space-management",
      ...(guideVisible.value ? { guide: "1" } : {}),
    },
  });
}

/**
 * @description 进入主题对应的实体浏览页。
 * @param space 目标主题。
 */
function browseThemeSpace(space: OntologySpaceItem): void {
  void router.push({
    name: "EntityBrowsingObject",
    params: { spaceId: space.id },
    query: {
      spaceName: space.displayName,
      from: "theme-space-management",
      spaceType: "1",
    },
  });
}

/**
 * @description 将表格行收窄为主题条目。
 * @param row 表格行。
 * @returns 主题条目。
 */
function asThemeSpace(row: unknown): OntologySpaceItem {
  return row as OntologySpaceItem;
}

watch([keyword, order, pageSize], () => {
  page.value = 1;
});
</script>

<style scoped lang="scss">
.theme-space-management {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 100%;
  padding: 12px;
  overflow: auto;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  background: var(--aircas-color-page-background);
}

.theme-space-management :deep(.section-toolbar p) {
  font-size: 16px;
}

.theme-space-table :deep(.el-table__body .el-table__cell) {
  font-size: 16px;
}

.theme-space-management__help {
  position: fixed;
  top: 58px;
  right: 18px;
  z-index: 4;
  display: inline-flex;
  padding: 6px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-panel-background);
  cursor: pointer;
}

.theme-space-management__help.is-embedded {
  top: 8px;
}

.theme-space-management__help:hover {
  color: var(--aircas-color-primary);
}

.theme-space-management__help:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 2px;
}

.theme-space-management__toolbar-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.theme-space-management__toolbar-row > :deep(.section-toolbar) {
  flex: 1;
  min-width: 0;
  padding: 0;
}

.theme-space-management__list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

.theme-space-management__grid {
  flex: 1;
  min-height: 320px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  align-items: stretch;
  align-content: start;
  gap: 12px;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--aircas-color-effect-primary-border);
  border-radius: 8px;
  background: linear-gradient(160deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
  box-shadow:
    inset 0 0 28px var(--aircas-color-effect-page-glow),
    0 0 18px var(--aircas-color-effect-blue-soft);
}

:root:not(.dark) .theme-space-management__grid {
  background: linear-gradient(160deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
  box-shadow:
    inset 0 0 28px var(--aircas-color-effect-page-glow),
    0 0 18px var(--aircas-color-effect-blue-soft);
}

.theme-space-table {
  flex: 1;
  min-height: 320px;
  border: 1px solid var(--aircas-color-effect-primary-border);
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(160deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
  box-shadow:
    inset 0 0 28px var(--aircas-color-effect-page-glow),
    0 0 18px var(--aircas-color-effect-blue-soft);
}

.theme-space-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, var(--aircas-color-section-header), var(--aircas-color-panel-background-deep));
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 700;
}

.theme-space-table__name {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.theme-space-table__name img {
  display: grid;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  overflow: hidden;
  place-items: center;
  border: 1px solid var(--aircas-color-effect-primary-border);
  border-radius: 8px;
  object-fit: cover;
  background: var(--aircas-color-section-header);
  box-shadow: 0 0 12px var(--aircas-color-effect-primary-soft);
}

.theme-space-table__icon,
.theme-space-card__icon {
  display: inline-flex;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--aircas-color-effect-primary-border);
  border-radius: 8px;
  color: var(--aircas-color-primary);
  background: var(--aircas-color-section-header);
  box-shadow: 0 0 12px var(--aircas-color-effect-primary-soft);
}

.theme-space-table__icon img,
.theme-space-card__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.theme-space-table__name div {
  min-width: 0;
}

.theme-space-table__name strong,
.theme-space-table__name small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-space-table__name strong {
  font-size: 16px;
  font-weight: 650;
}

.theme-space-table__name small {
  margin-top: 4px;
  color: var(--aircas-color-text-secondary);
  font-size: 16px;
}

.theme-space-card {
  display: flex;
  min-width: 0;
  align-self: start;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(140deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background));
  box-shadow: 0 2px 12px var(--aircas-color-effect-page-glow);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

:root:not(.dark) .theme-space-card {
  background: linear-gradient(140deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}

.theme-space-card:hover {
  border-color: var(--aircas-color-primary);
  box-shadow:
    0 0 16px var(--aircas-color-effect-primary-soft),
    inset 0 0 14px var(--aircas-color-effect-blue-soft);
  transform: translateY(-2px);
}

.theme-space-card__name {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.theme-space-card__name img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border: 1px solid var(--aircas-color-effect-primary-border);
  border-radius: 8px;
  background: var(--aircas-color-section-header);
  box-shadow: 0 0 12px var(--aircas-color-effect-blue-soft);
}

.theme-space-card__name .theme-space-card__icon {
  background: var(--aircas-color-section-header);
}

.theme-space-card__name div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.theme-space-card__name strong,
.theme-space-card__name small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-space-card__name strong {
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 650;
}

.theme-space-card p,
.theme-space-card small,
.theme-space-card__meta,
.theme-space-card dt {
  color: var(--aircas-color-text-secondary);
  font-size: 16px;
}

.theme-space-card p {
  margin: 0;
  overflow: hidden;
  min-height: 24px;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-space-card dl {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin: 0;
  padding: 6px 0;
}

.theme-space-card dl div {
  text-align: center;
}

.theme-space-card dt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.theme-space-card dt .el-icon {
  color: var(--aircas-color-category-blue);
  font-size: 16px;
}

.theme-space-card dl > div:nth-child(2) .el-icon {
  color: var(--aircas-color-category-purple);
}

.theme-space-card dd {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 600;
}

.theme-space-card footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px dashed var(--aircas-color-border-light);
}

.theme-space-card__meta,
.theme-space-management__pagination {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  gap: 8px;
}

.theme-space-card__meta span {
  flex-shrink: 0;
  white-space: nowrap;
}

.theme-space-card footer > div:last-child {
  display: flex;
  gap: 8px;
}

.theme-space-card footer > div:last-child .el-button {
  height: 32px;
  padding: 0 16px;
  font-size: 16px;
}

.theme-space-table .el-button {
  height: 32px;
  font-size: 16px;
}

.theme-space-management__empty {
  display: grid;
  min-height: 280px;
  place-items: center;
  color: var(--aircas-color-text-secondary);
}

.theme-space-management__pagination {
  min-height: 40px;
  align-items: center;
  color: var(--aircas-color-text-secondary);
  font-size: 16px;
}

.theme-space-management__error {
  margin: 8px 0 0;
  color: var(--aircas-color-danger);
  font-size: 16px;
}
</style>
