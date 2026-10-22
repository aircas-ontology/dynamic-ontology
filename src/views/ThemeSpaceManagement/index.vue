<template>
  <div class="theme-space-management">
    <button class="theme-space-management__help" type="button" aria-label="打开新手引导" title="新手引导" @click="openOnboardingGuide()">
      <el-icon><QuestionFilled /></el-icon>
    </button>
    <section class="theme-space-management__overview">
      <WelcomePanel space-label="主题" @create="openCreateThemeSpaceDialog()" />
      <div class="theme-space-management__stats"><StatCard v-for="stat in stats" :key="stat.id" :stat="stat" /></div>
    </section>
    <SectionToolbar title="主题管理" space-label="主题" v-model:keyword="keyword" v-model:order="order" v-model:view-mode="viewMode" />
    <section class="theme-space-management__list" aria-label="主题列表">
      <div v-if="themeSpacesLoading" class="theme-space-management__empty">正在加载主题…</div>
      <div v-else-if="themeSpacesError" class="theme-space-management__empty">{{ themeSpacesError }}</div>
      <div v-else-if="!filteredSpaces.length" class="theme-space-management__empty">暂无主题，请调整搜索条件</div>
      <div v-else-if="viewMode === 'card'" class="theme-space-management__grid">
        <article v-for="space in pagedSpaces" :key="space.id" class="theme-space-card">
          <div class="theme-space-card__name">
            <span class="theme-space-card__icon"
              ><img v-if="space.iconUrl" :src="space.iconUrl" :alt="`${space.displayName}主题图片`" /><el-icon v-else :size="22"><Box /></el-icon
            ></span>
            <div>
              <strong>{{ space.displayName }}</strong
              ><small>{{ space.apiName }}</small>
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
                <el-icon><Operation /></el-icon>行为
              </dt>
              <dd>{{ space.metrics.behavior }}</dd>
            </div>
            <div>
              <dt>
                <el-icon><Connection /></el-icon>关系
              </dt>
              <dd>{{ space.metrics.relation }}</dd>
            </div>
            <div>
              <dt>
                <el-icon><Tickets /></el-icon>规则
              </dt>
              <dd>{{ space.metrics.rule }}</dd>
            </div>
          </dl>
          <footer>
            <div class="theme-space-card__meta">
              <span>创建：{{ space.createdTime }}</span
              ><span>更新：{{ space.updatedTime }}</span>
            </div>
            <div>
              <el-button type="primary" plain size="small" data-onboarding="theme-enter" @click="enterThemeSpace(space)">→ 进入</el-button
              ><el-button type="primary" plain size="small" @click="openEditThemeSpaceDialog(space)">✎ 编辑</el-button
              ><el-dropdown trigger="click" @command="(command) => handleThemeSpaceCommand(command, space)"
                ><el-button type="primary" plain size="small"
                  >更多<el-icon><ArrowDown /></el-icon></el-button
                ><template #dropdown
                  ><el-dropdown-menu
                    ><el-dropdown-item command="导出主题">导出</el-dropdown-item
                    ><el-dropdown-item command="删除主题" divided>删除</el-dropdown-item></el-dropdown-menu
                  ></template
                ></el-dropdown
              >
            </div>
          </footer>
        </article>
      </div>
      <el-table v-else class="theme-space-table" :data="pagedSpaces" stripe row-key="id">
        <el-table-column label="空间名称" min-width="280"
          ><template #default="{ row }"
            ><div class="theme-space-table__name">
              <span class="theme-space-table__icon"
                ><img v-if="row.iconUrl" :src="row.iconUrl" :alt="`${row.displayName}主题图片`" /><el-icon v-else :size="22"><Box /></el-icon
              ></span>
              <div>
                <strong>{{ row.displayName }}</strong
                ><small>{{ row.apiName }}</small>
              </div>
            </div></template
          ></el-table-column
        >
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="对象" width="90" align="center"
          ><template #default="{ row }">{{ row.metrics.ontology }}</template></el-table-column
        >
        <el-table-column label="行为" width="90" align="center"
          ><template #default="{ row }">{{ row.metrics.behavior }}</template></el-table-column
        >
        <el-table-column label="关系" width="90" align="center"
          ><template #default="{ row }">{{ row.metrics.relation }}</template></el-table-column
        >
        <el-table-column label="规则" width="90" align="center"
          ><template #default="{ row }">{{ row.metrics.rule }}</template></el-table-column
        >
        <el-table-column prop="createdTime" label="创建时间" width="180" />
        <el-table-column prop="updatedTime" label="更新时间" width="180" />
        <el-table-column label="操作" width="230" fixed="right"
          ><template #default="{ row }"
            ><el-button type="primary" plain size="small" data-onboarding="theme-enter" @click="enterThemeSpace(asThemeSpace(row))">→ 进入</el-button
            ><el-button type="primary" plain size="small" @click="openEditThemeSpaceDialog(asThemeSpace(row))">✎ 编辑</el-button
            ><el-dropdown trigger="click" @command="(command) => handleThemeSpaceCommand(command, asThemeSpace(row))"
              ><el-button type="primary" plain size="small"
                >更多<el-icon><ArrowDown /></el-icon></el-button
              ><template #dropdown
                ><el-dropdown-menu
                  ><el-dropdown-item command="导出主题">导出</el-dropdown-item
                  ><el-dropdown-item command="删除主题" divided>删除</el-dropdown-item></el-dropdown-menu
                ></template
              ></el-dropdown
            ></template
          ></el-table-column
        >
      </el-table>
      <footer class="theme-space-management__pagination">
        <span>共 {{ filteredSpaces.length }} 条</span
        ><el-pagination
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
      <el-form label-position="top"
        ><el-form-item label="选择对象空间" data-onboarding="theme-create-space-select"
          ><el-select v-model="selectedObjectSpace" placeholder="请选择对象空间" :loading="objectSpacesLoading" style="width: 100%"
            ><el-option v-for="space in objectSpaces" :key="space.id" :label="space.displayName" :value="space.id" /></el-select></el-form-item
      ></el-form>
      <template #footer
        ><el-button data-onboarding="theme-create-cancel" @click="createDialogVisible = false">取消</el-button
        ><el-button type="primary" data-onboarding="theme-create-confirm" @click="confirmCreateThemeSpace">确认</el-button></template
      >
    </el-dialog>
    <el-dialog v-model="editDialogVisible" title="编辑主题" width="min(640px, 94vw)"
      ><el-form label-position="top"
        ><el-form-item label="API 名称（必填）" :error="editApiNameError"><el-input v-model="editDraft.apiName" disabled /></el-form-item
        ><el-form-item label="空间名称（必填）" :error="editDisplayNameError"><el-input v-model="editDraft.displayName" maxlength="64" /></el-form-item
        ><el-form-item label="空间描述"><el-input v-model="editDraft.description" type="textarea" :rows="3" maxlength="256" show-word-limit /></el-form-item
        ><el-form-item label="空间图标"
          ><div class="theme-edit-upload">
            <div v-if="editDraft.iconUrl" class="theme-edit-preview">
              <img :src="editDraft.iconUrl" alt="主题图标预览" /><el-button link :disabled="editBusy" @click="editDraft.iconUrl = ''">清除图片</el-button>
            </div>
            <el-upload
              v-if="!editDraft.iconUrl"
              class="theme-edit-picture-upload"
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :show-file-list="false"
              :limit="1"
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              :disabled="editBusy"
              :on-change="readThemeIcon"
              :on-exceed="handleThemeIconExceed"
              ><el-icon><Plus /></el-icon></el-upload
            ><span class="theme-edit-upload-hint">PNG/JPEG，最大 2MB</span>
          </div></el-form-item
        ></el-form
      ><template #footer
        ><p v-if="editError" class="theme-space-management__error" role="alert">{{ editError }}</p>
        <el-button :disabled="editBusy" @click="editDialogVisible = false">取消</el-button
        ><el-button type="primary" :loading="editBusy" @click="confirmEditThemeSpace">确定</el-button></template
      ></el-dialog
    >
    <el-dialog v-model="deleteDialogVisible" title="删除主题" width="min(460px, 94vw)" :close-on-click-modal="false">
      <p>确认删除「{{ deleteSpace?.displayName }}」主题数据？</p>
      <p v-if="deleteError" class="theme-space-management__error" role="alert">{{ deleteError }}</p>
      <template #footer
        ><el-button :disabled="deleteBusy" @click="deleteDialogVisible = false">取消</el-button
        ><el-button type="danger" :loading="deleteBusy" @click="confirmDeleteThemeSpace">删除</el-button></template
      >
    </el-dialog>
    <el-dialog v-model="exportDialogVisible" title="导出主题" width="min(460px, 94vw)"
      ><p>导出「{{ exportSpace?.displayName }}」。</p>
      <el-radio-group v-model="exportType"><el-radio value="SCHEMA">仅结构</el-radio><el-radio value="INSTANCE">含实例数据</el-radio></el-radio-group>
      <p v-if="exportError" class="theme-space-management__error">{{ exportError }}</p>
      <template #footer
        ><el-button :disabled="exportBusy" @click="exportDialogVisible = false">取消</el-button
        ><el-button type="primary" :loading="exportBusy" @click="confirmExportThemeSpace">导出</el-button></template
      ></el-dialog
    >
    <OnboardingGuideOverlay v-model="guideVisible" :steps="themeOnboardingGuideSteps" :start-id="guideStartId" />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import {
  deleteOntologySpaceInterface,
  getExportOntologySpaceInterface,
  getOntologyOverviewCountInterface,
  getOntologySpaceListInterface,
  postUploadOntologyThumbnailInterface,
  updateOntologySpaceInterface,
} from "@/apis";
import type { OntologySpaceItem, OverviewCountVO } from "@/types";
import type { OntologySpaceExportType } from "@/types";
import { mapOntologySpaceList } from "@/utils/mapOntologySpaceList";
import { downloadSpaceFile } from "../OntologySpaceManagement/utils/downloadSpaceJson";
import { resolveExportOntologySpaceFileName } from "../OntologySpaceManagement/utils/resolveExportOntologySpaceFileName";
import { ArrowDown, Connection, DataLine, Operation, Plus, QuestionFilled, Tickets } from "@element-plus/icons-vue";
import type { UploadFile } from "element-plus";
import SectionToolbar from "../OntologySpaceManagement/components/SectionToolbar.vue";
import StatCard from "../OntologySpaceManagement/components/StatCard.vue";
import WelcomePanel from "../OntologySpaceManagement/components/WelcomePanel.vue";
import OnboardingGuideOverlay from "@/components/OnboardingGuide/OnboardingGuideOverlay.vue";
import { useOnboardingGuide } from "@/composables/shared/useOnboardingGuide";
import { ONBOARDING_GUIDE_ENTRY_IDS, THEME_ONBOARDING_GUIDE_STEPS } from "@/views/onboardingGuideSteps";
import type { OntologySpaceSummary } from "@/types";
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
const overviewCount = ref<OverviewCountVO>({});
const objectSpaces = ref<OntologySpaceItem[]>([]);
const objectSpacesLoading = ref(false);
const objectSpacesError = ref("");
const editDialogVisible = ref(false);
const editSpace = ref<OntologySpaceItem | null>(null);
const editDraft = ref({ apiName: "", displayName: "", description: "", iconUrl: "" });
const editBusy = ref(false);
const editError = ref("");
const editApiNameError = ref("");
const editDisplayNameError = ref("");
const deleteDialogVisible = ref(false);
const deleteSpace = ref<OntologySpaceItem | null>(null);
const deleteBusy = ref(false);
const deleteError = ref("");
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
const stats = computed<OntologySpaceSummary[]>(() => [
  { id: "space", label: "主题", value: overviewCount.value.spaceCount ?? 0, icon: "Box" },
  { id: "object", label: "对象", value: overviewCount.value.ontologyCount ?? 0, icon: "Connection" },
  { id: "behavior", label: "行为数量", value: overviewCount.value.actionCount ?? 0, icon: "Share" },
  { id: "relation", label: "关系", value: overviewCount.value.linkCount ?? 0, icon: "Link" },
]);
/** @description 提示主题功能尚未接入。 @param action 被点击的操作名称。 */
function notifyUnavailable(action: string): void {
  ElMessage.info(`${action}功能暂未接入`);
}
/** @description 处理主题更多菜单命令。 @param command 菜单命令。 @param space 当前主题。 */
function handleThemeSpaceCommand(command: unknown, space: OntologySpaceItem): void {
  if (command === "删除主题") {
    deleteSpace.value = space;
    deleteError.value = "";
    deleteDialogVisible.value = true;
    return;
  }
  if (command === "导出主题") {
    exportSpace.value = space;
    exportType.value = "INSTANCE";
    exportError.value = "";
    exportDialogVisible.value = true;
    return;
  }
  notifyUnavailable(String(command));
}
/** @description 调用对象空间导出接口并下载主题文件。 */
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
/** @description 调用对象空间删除接口删除当前主题并刷新列表。 */
async function confirmDeleteThemeSpace(): Promise<void> {
  if (!deleteSpace.value || deleteBusy.value) return;
  deleteBusy.value = true;
  deleteError.value = "";
  try {
    const response = await deleteOntologySpaceInterface({ spaceId: Number(deleteSpace.value.id) });
    if (response.code !== 200) throw new Error(response.message || "删除主题失败");
    deleteDialogVisible.value = false;
    ElMessage.success("删除成功");
    await loadThemeSpaces();
  } catch (cause) {
    deleteError.value = cause instanceof Error ? cause.message : "删除主题失败，请重试。";
  } finally {
    deleteBusy.value = false;
  }
}
/** @description 打开新建主题弹窗并默认选中第一条已加载的对象空间，随后刷新对象空间列表。 */
function openCreateThemeSpaceDialog(): void {
  selectedObjectSpace.value = objectSpaces.value[0]?.id ?? "";
  void loadObjectSpaces();
  createDialogVisible.value = true;
}
/** @description 查询对象空间管理使用的对象空间列表供主题选择。 */
async function loadObjectSpaces(): Promise<void> {
  objectSpacesLoading.value = true;
  objectSpacesError.value = "";
  try {
    const response = await getOntologySpaceListInterface({ type: 0 });
    if (response.code !== 200) throw new Error(response.message || "对象空间列表加载失败");
    objectSpaces.value = mapOntologySpaceList(response.data);
    // 弹窗打开时列表尚未加载完成的场景：加载成功后补默认选中第一条，用户已手动选择时保持不变。
    selectedObjectSpace.value ||= objectSpaces.value[0]?.id ?? "";
  } catch (cause) {
    objectSpacesError.value = cause instanceof Error ? cause.message : "对象空间列表加载失败";
    ElMessage.error(objectSpacesError.value);
  } finally {
    objectSpacesLoading.value = false;
  }
}
/** @description 查询主题列表供页面卡片、表格与统计展示。 */
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
/** @description 查询主题概览统计，使用主题类型参数。 */
async function loadThemeOverviewCount(): Promise<void> {
  try {
    const response = await getOntologyOverviewCountInterface({ type: 1 });
    if (response.code === 0 || response.code === 200) overviewCount.value = response.data ?? {};
  } catch {
    overviewCount.value = {};
  }
}
onMounted(() => {
  void loadThemeSpaces();
  void loadThemeOverviewCount();
});
const router = useRouter();
/** @description 校验已选对象空间后关闭弹窗并跳转子空间创建流程，携带空间上下文与来源标识；引导进行中时追加 guide 标记，让创建页进入演示模式。 */
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
/** @description 进入主题对应的空间内管理页，携带空间名与来源标识供面包屑展示。 @param space 目标主题。 */
function enterThemeSpace(space: OntologySpaceItem): void {
  void router.push({
    name: "OntologySpaceManagementDetailObject",
    params: { spaceId: space.id },
    query: { spaceName: space.displayName, from: "theme-space-management" },
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
/** @description 打开主题编辑弹窗并回填当前主题。 @param space 当前主题。 */
function openEditThemeSpaceDialog(space: OntologySpaceItem): void {
  editSpace.value = space;
  editError.value = "";
  editApiNameError.value = "";
  editDisplayNameError.value = "";
  editDraft.value = { apiName: space.apiName, displayName: space.displayName, description: space.description, iconUrl: space.iconUrl };
  editDialogVisible.value = true;
}
/** @description 上传主题图片并回显接口返回的图片地址。 @param event 图片选择事件。 */
async function readThemeIcon(upload: UploadFile): Promise<void> {
  const file = upload.raw;
  if (!file || editBusy.value) return;
  if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    editError.value = "请选择不超过 2MB 的 PNG 或 JPEG 图片。";
    return;
  }
  editBusy.value = true;
  editError.value = "";
  try {
    const response = await postUploadOntologyThumbnailInterface({ image: file });
    if (response.code !== 200) throw new Error(response.message || "图片上传失败");
    editDraft.value.iconUrl = response.data;
  } catch (cause) {
    editError.value = cause instanceof Error ? cause.message : "图片上传失败，请重试。";
  } finally {
    editBusy.value = false;
  }
}
/** @description 提示主题图标仅允许选择一张图片。 */
function handleThemeIconExceed(): void {
  editError.value = "空间图标仅支持上传一张图片，请先清除当前图片。";
}
/** @description 调用对象空间编辑接口更新主题名称、描述和图标，并刷新主题列表。 */
async function confirmEditThemeSpace(): Promise<void> {
  if (!editSpace.value || editBusy.value) return;
  const spaceId = Number(editSpace.value.id);
  if (!Number.isInteger(spaceId)) {
    editError.value = "缺少空间 id，无法保存。";
    return;
  }
  editApiNameError.value = "";
  editDisplayNameError.value = "";
  const apiName = editDraft.value.apiName.trim();
  const displayName = editDraft.value.displayName.trim();
  if (!apiName) editApiNameError.value = "请输入 API 名称。";
  if (!displayName) editDisplayNameError.value = "请输入空间名称。";
  if (editApiNameError.value || editDisplayNameError.value) return;
  editBusy.value = true;
  editError.value = "";
  try {
    const response = await updateOntologySpaceInterface({
      spaceId,
      displayName,
      iconUrl: editDraft.value.iconUrl,
      description: editDraft.value.description.trim(),
    });
    if (response.code !== 200) throw new Error(response.message || "编辑主题失败");
    editDialogVisible.value = false;
    ElMessage.success("更新成功");
    await loadThemeSpaces();
  } catch (cause) {
    editError.value = cause instanceof Error ? cause.message : "编辑主题失败，请重试。";
  } finally {
    editBusy.value = false;
  }
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
  background: var(--aircas-color-page-background);
}
.theme-space-management__help {
  position: fixed;
  top: 62px;
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
.theme-space-management__help:hover {
  color: var(--aircas-color-primary);
}
.theme-space-management__help:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 2px;
}
.theme-space-management__overview {
  display: grid;
  grid-template-columns: minmax(520px, 1.42fr) minmax(760px, 2.25fr);
  gap: 12px;
  min-height: 150px;
}
.theme-space-management__welcome,
.theme-space-management__list {
  padding: 16px;
  border: 1px solid var(--aircas-color-effect-primary-border);
  border-radius: 8px;
  background: linear-gradient(160deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}
.theme-space-management__welcome p {
  color: var(--aircas-color-text-secondary);
}
.theme-space-management__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.theme-stat {
  display: flex;
  min-height: 150px;
  padding: 16px;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(160deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}
.theme-stat header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.theme-stat h2 {
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}
.theme-stat__icon {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 8px;
  color: var(--aircas-color-primary);
  background: var(--aircas-color-effect-primary-fill);
}
.theme-stat--object .theme-stat__icon {
  color: var(--aircas-color-success);
  background: var(--aircas-color-effect-success-fill);
}
.theme-stat--behavior .theme-stat__icon {
  color: var(--aircas-color-category-blue);
  background: var(--aircas-color-effect-blue-fill);
}
.theme-stat--relation .theme-stat__icon {
  color: var(--aircas-color-category-purple);
  background: var(--aircas-color-effect-purple-fill);
}
.theme-stat small {
  color: var(--aircas-color-text-secondary);
}
.theme-stat__line {
  height: 4px;
  margin-top: auto;
  border-radius: 4px;
  background: var(--aircas-color-panel-background-deep);
}
.theme-stat__line span {
  display: block;
  width: 65%;
  height: 100%;
  border-radius: inherit;
  background: var(--aircas-color-primary);
}
.theme-stat strong {
  font-size: 32px;
}
.theme-stat span {
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}
.theme-space-management__list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
}
.theme-space-management > :deep(.section-toolbar) {
  padding: 0;
}
.theme-space-management__list > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.theme-space-management__toolbar {
  display: flex;
  gap: 8px;
}
.theme-space-management__toolbar .el-input {
  width: 280px;
}
.theme-space-management__grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  align-items: stretch;
  align-content: start;
  gap: 12px;
  overflow: auto;
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
  font-size: 13px;
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
  font-size: 14px;
  font-weight: 650;
}
.theme-space-table__name small {
  margin-top: 4px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.theme-space-card {
  display: flex;
  padding: 12px;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}

:root:not(.dark) .theme-space-management__grid {
  background: linear-gradient(160deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
  box-shadow:
    inset 0 0 28px var(--aircas-color-effect-page-glow),
    0 0 18px var(--aircas-color-effect-blue-soft);
}

:root:not(.dark) .theme-space-card {
  background: linear-gradient(140deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}
.theme-space-card:hover {
  border-color: var(--aircas-color-primary);
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
.theme-space-card p,
.theme-space-card small,
.theme-space-card__meta,
.theme-space-card dt {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
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
  font-size: 15px;
}
.theme-space-card dl > div:nth-child(2) .el-icon {
  color: var(--aircas-color-category-purple);
}
.theme-space-card dd {
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 600;
}
.theme-space-card footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--aircas-color-border-light);
}
.theme-space-card {
  align-self: start;
}
.theme-space-card__meta,
.theme-space-management__pagination {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.theme-space-management__list {
  padding: 0;
  border: 0;
  background: transparent;
}
.theme-space-management__grid {
  min-height: 320px;
  padding: 12px;
  border: 1px solid var(--aircas-color-effect-primary-border);
  border-radius: 8px;
  background: linear-gradient(160deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
  box-shadow:
    inset 0 0 28px var(--aircas-color-effect-page-glow),
    0 0 18px var(--aircas-color-effect-blue-soft);
}
.theme-space-card {
  min-width: 0;
  background: linear-gradient(140deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background));
  box-shadow: 0 2px 12px var(--aircas-color-effect-page-glow);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}
.theme-space-card:hover {
  box-shadow:
    0 0 16px var(--aircas-color-effect-primary-soft),
    inset 0 0 14px var(--aircas-color-effect-blue-soft);
  transform: translateY(-2px);
}
.theme-space-card__name img {
  background: var(--aircas-color-section-header);
  box-shadow: 0 0 12px var(--aircas-color-effect-blue-soft);
}
.theme-space-card p {
  margin: 0;
  overflow: hidden;
  min-height: 19px;
  line-height: 19px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.theme-space-card footer {
  margin-top: auto;
}
.theme-space-card footer > div:last-child {
  display: flex;
  gap: 6px;
}
.theme-edit-preview {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.theme-edit-preview img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 8px;
  background: var(--aircas-color-input-background);
}

.theme-edit-upload {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.theme-edit-picture-upload :deep(.el-upload--picture-card) {
  width: 96px;
  height: 96px;
  margin: 0;
  border-color: var(--aircas-color-border-light);
  background: var(--aircas-color-input-background);
}

.theme-edit-picture-upload :deep(.el-upload--picture-card:hover) {
  border-color: var(--aircas-color-primary);
  color: var(--aircas-color-primary);
}

.theme-edit-upload-hint {
  align-self: center;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
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
  font-size: 12px;
}
@media (max-width: 1200px) {
  .theme-space-management__overview {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 700px) {
  .theme-space-management__stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .theme-space-management__list > header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
