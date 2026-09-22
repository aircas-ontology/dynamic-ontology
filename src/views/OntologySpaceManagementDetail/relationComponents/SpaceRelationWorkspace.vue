<template>
  <div class="space-relation-workspace">
    <RelationCategoryPanel
      :tree-data="relationCategoryTree"
      :selected-node-id="selectedRelationCategoryId"
      :relations="relations"
      :can-create="true"
      :can-update="true"
      :can-delete="true"
      @select-node="selectRelationCategory"
      @create="openCategoryCreate"
      @edit="openCategoryEdit"
      @delete="openCategoryDelete"
    />

    <section class="space-relation-workspace__main">
      <header class="space-relation-workspace__header">
        <div class="space-relation-workspace__title">
          <h2>{{ selectedRelationCategoryLabel }}</h2>
          <span>
            空间内多对象关系 · {{ visibleSpaceRelations.length }} 条
            <template v-if="relationFilter.applied"> （中心：{{ relationFilter.seedNames[0] }} / {{ relationFilter.maxHop }} 级） </template>
          </span>
        </div>
        <div class="space-relation-workspace__actions">
          <div class="space-relation-workspace__view-switch" role="group" aria-label="展示方式">
            <el-tooltip content="关系图" placement="top">
              <button
                type="button"
                class="space-relation-workspace__view-btn"
                :class="{ 'space-relation-workspace__view-btn-active': relationViewMode === 'graph' }"
                aria-label="关系图"
                :aria-pressed="relationViewMode === 'graph'"
                @click="setRelationViewMode('graph')"
              >
                <el-icon><Share /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip content="列表" placement="top">
              <button
                type="button"
                class="space-relation-workspace__view-btn"
                :class="{ 'space-relation-workspace__view-btn-active': relationViewMode === 'list' }"
                aria-label="列表"
                :aria-pressed="relationViewMode === 'list'"
                @click="setRelationViewMode('list')"
              >
                <el-icon><Grid /></el-icon>
              </button>
            </el-tooltip>
          </div>
          <el-button class="aircas-button" type="primary" :icon="Plus" @click="openRelationCreate">添加</el-button>
        </div>
      </header>

      <div class="space-relation-workspace__filter">
        <el-select
          v-model="draftSeedName"
          filterable
          clearable
          placeholder="筛选对象（单选，结果以该对象为中心）"
          class="aircas-select space-relation-workspace__filter-objects"
          popper-class="aircas-select-popper"
          @change="handleSeedChange"
        >
          <el-option v-for="item in relationObjectOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button class="aircas-button" @click="resetFilter">重置</el-button>
      </div>

      <div v-if="status === 'loading'" class="space-relation-workspace__state" role="status"><AircasLoading>加载中...</AircasLoading></div>
      <div v-else-if="status === 'error'" class="space-relation-workspace__state space-relation-workspace__state-error" role="alert">
        <span>{{ errorMessage }}</span>
        <el-button class="aircas-button" type="primary" @click="loadSpaceRelationWorkspace">重试</el-button>
      </div>
      <template v-else>
        <RelationGraphView
          v-if="relationViewMode === 'graph'"
          layout-mode="network"
          :items="visibleSpaceRelations"
          :seed-names="graphSeedNames"
          :max-hop="graphMaxHop"
          @edit="openRelationEdit"
          @delete="openRelationDelete"
        />
        <template v-else>
          <div v-if="visibleSpaceRelations.length" class="space-relation-workspace__table-wrap">
            <el-table :data="visibleSpaceRelations" stripe height="100%" class="aircas-table aircas-table--flat space-relation-workspace__table">
              <el-table-column label="关系名称" min-width="140" show-overflow-tooltip>
                <template #default="{ row }"
                  ><span class="space-relation-workspace__name">{{ row.displayName }}</span></template
                >
              </el-table-column>
              <el-table-column prop="apiName" label="API 名称" min-width="140" show-overflow-tooltip />
              <el-table-column prop="categoryName" label="分类" min-width="110" show-overflow-tooltip />
              <el-table-column prop="sourceName" label="源本体" min-width="140" show-overflow-tooltip />
              <el-table-column prop="targetName" label="目标本体" min-width="120" show-overflow-tooltip />
              <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="scope">
                  <div class="space-relation-workspace__row-actions">
                    <el-button class="aircas-button" size="small" @click="openRelationEdit(asRelation(scope.row))">编辑</el-button>
                    <el-button class="aircas-button" type="danger" size="small" @click="openRelationDelete(asRelation(scope.row))">删除</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="暂无关系类" :image-size="72" />
        </template>
      </template>
    </section>

    <RelationCategoryFormDialog
      ref="categoryFormRef"
      v-model="categoryFormVisible"
      :mode="categoryFormMode"
      :parent-label="categoryParentLabel"
      :initial-name="categoryFormMode === 'edit' ? categoryActionName : ''"
      @submit="handleCategorySubmit"
    />
    <RelationCategoryDeleteDialog
      v-model="categoryDeleteVisible"
      :category-name="categoryActionName"
      :blocked="categoryDeleteBlocked"
      :loading="actionLoading"
      @confirm="handleCategoryDelete"
    />
    <SpaceRelationFormDialog
      ref="relationFormRef"
      v-model="relationFormVisible"
      :mode="relationFormMode"
      :category-options="relationCategoryOptions"
      :object-options="relationObjectOptions"
      :default-category-id="selectedRelationCategoryId || ROOT_RELATION_CATEGORY_ID"
      :relation="activeRelation"
      @submit="handleRelationSubmit"
    />
    <RelationDeleteDialog
      v-model="relationDeleteVisible"
      :display-name="activeRelation?.displayName || ''"
      :loading="actionLoading"
      @confirm="handleRelationDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { Grid, Plus, Share } from "@element-plus/icons-vue";
import type { CreateOntologyLinkParams, OntologyRelationClass, RelationClassWritePayload } from "@/types";
import { ROOT_RELATION_CATEGORY_ID } from "@/types";
import {
  deleteOntologyLinkInterface,
  deleteOntologyRelationCategoryTreeInterface,
  postCreateOntologyLinkInterface,
  postCreateOntologyRelationCategoryTreeInterface,
  putUpdateOntologyRelationCategoryNameInterface,
} from "@/apis";
import AircasLoading from "@/components/AircasLoading.vue";
import { useSpaceRelationWorkspace } from "../composables/useSpaceRelationWorkspace";
import { collectCategoryIds, findRelationCategoryNode } from "../utils/relationOperations";
import RelationCategoryPanel from "./RelationCategoryPanel.vue";
import RelationGraphView from "./RelationGraphView.vue";
import RelationCategoryFormDialog from "./RelationCategoryFormDialog.vue";
import RelationCategoryDeleteDialog from "./RelationCategoryDeleteDialog.vue";
import RelationDeleteDialog from "./RelationDeleteDialog.vue";
import SpaceRelationFormDialog from "./SpaceRelationFormDialog.vue";

const route = useRoute();
const {
  status,
  errorMessage,
  relationCategoryTree,
  relations,
  relationObjectOptions,
  selectedRelationCategoryId,
  selectedRelationCategoryLabel,
  relationCategoryOptions,
  visibleSpaceRelations,
  relationViewMode,
  relationFilter,
  graphSeedNames,
  graphMaxHop,
  loadSpaceRelationWorkspace,
  selectRelationCategory,
  setRelationViewMode,
  applyRelationFilter,
  findRelationCategoryLabel,
  editRelationClass,
} = useSpaceRelationWorkspace();

const categoryFormRef = ref<InstanceType<typeof RelationCategoryFormDialog> | null>(null);
const relationFormRef = ref<InstanceType<typeof SpaceRelationFormDialog> | null>(null);
const categoryFormVisible = ref(false);
const categoryFormMode = ref<"create" | "edit">("create");
const categoryDeleteVisible = ref(false);
const categoryActionId = ref("");
const categoryParentId = ref(ROOT_RELATION_CATEGORY_ID);
const categoryParentLabel = ref("全部关系");
const categoryActionName = ref("");
const relationFormVisible = ref(false);
const relationFormMode = ref<"create" | "edit">("create");
const relationDeleteVisible = ref(false);
const activeRelation = ref<OntologyRelationClass | null>(null);
const actionLoading = ref(false);
const draftSeedName = ref("");

const categoryDeleteBlocked = computed(() => {
  const node = findRelationCategoryNode(relationCategoryTree.value, categoryActionId.value);
  if (!node) return true;
  const ids = new Set(collectCategoryIds(node));
  return relations.value.some((item) => ids.has(item.categoryId));
});

watch(
  relationFilter,
  (value) => {
    draftSeedName.value = value.seedNames[0] ?? "";
  },
  { immediate: true, deep: true },
);

function asRelation(row: unknown): OntologyRelationClass {
  return row as OntologyRelationClass;
}

function handleSeedChange(value: string | number | boolean | undefined) {
  const seed = typeof value === "string" ? value.trim() : "";
  draftSeedName.value = seed;
  applyRelationFilter(seed ? [seed] : []);
}

function resetFilter() {
  applyRelationFilter([]);
  draftSeedName.value = "";
}

function openCategoryCreate(parentId: string) {
  categoryFormMode.value = "create";
  categoryParentId.value = parentId;
  categoryParentLabel.value = parentId ? findRelationCategoryLabel(parentId) || "全部关系" : "根分类";
  categoryActionName.value = "";
  categoryFormVisible.value = true;
}

function openCategoryEdit(categoryId: string) {
  categoryFormMode.value = "edit";
  categoryActionId.value = categoryId;
  categoryActionName.value = findRelationCategoryLabel(categoryId);
  categoryFormVisible.value = true;
}

function openCategoryDelete(categoryId: string) {
  categoryActionId.value = categoryId;
  categoryActionName.value = findRelationCategoryLabel(categoryId);
  categoryDeleteVisible.value = true;
}

/**
 * @description 创建或修改关系分类名称：创建走 POST，修改走 PUT；成功后刷新分类树。
 * @param name 分类名称。
 */
async function handleCategorySubmit(name: string) {
  const space = String(route.params.spaceId || "").trim();
  const numericSpaceId = Number(space);

  if (categoryFormMode.value === "edit") {
    const numericCategoryId = Number(categoryActionId.value);
    if (!space || !Number.isInteger(numericSpaceId) || !Number.isInteger(numericCategoryId)) {
      ElMessage.error("缺少空间或分类 id，无法修改关系分类名称。");
      categoryFormRef.value?.setLoading(false);
      return;
    }
    actionLoading.value = true;
    categoryFormRef.value?.setLoading(true);
    try {
      const response = await putUpdateOntologyRelationCategoryNameInterface({
        spaceId: numericSpaceId,
        categoryId: numericCategoryId,
        name,
      });
      if (response.code !== 200) {
        throw new Error(response.message || "修改关系分类名称失败");
      }
      categoryFormVisible.value = false;
      ElMessage.success("分类已更新");
      await loadSpaceRelationWorkspace();
    } catch (cause) {
      ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "修改关系分类名称失败，请重试。");
      categoryFormRef.value?.setLoading(false);
    } finally {
      actionLoading.value = false;
    }
    return;
  }

  const numericParentId = categoryParentId.value.trim() === "" ? 0 : Number(categoryParentId.value);
  if (!space || !Number.isInteger(numericSpaceId) || !Number.isInteger(numericParentId)) {
    ElMessage.error("缺少空间或父分类 id，无法创建关系分类。");
    categoryFormRef.value?.setLoading(false);
    return;
  }

  actionLoading.value = true;
  categoryFormRef.value?.setLoading(true);
  try {
    const response = await postCreateOntologyRelationCategoryTreeInterface({
      spaceId: numericSpaceId,
      parentId: numericParentId,
      name,
    });
    if (response.code !== 200) {
      throw new Error(response.message || "创建关系分类失败");
    }
    categoryFormVisible.value = false;
    ElMessage.success("分类已添加");
    await loadSpaceRelationWorkspace();
  } catch (cause) {
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "创建关系分类失败，请重试。");
    categoryFormRef.value?.setLoading(false);
  } finally {
    actionLoading.value = false;
  }
}

/**
 * @description 删除关系分类：提交 spaceId 与 categoryId；成功后关闭弹框并刷新分类树。
 */
async function handleCategoryDelete() {
  if (categoryDeleteBlocked.value) return;
  const space = String(route.params.spaceId || "").trim();
  const numericSpaceId = Number(space);
  const numericCategoryId = Number(categoryActionId.value);
  if (!space || !Number.isInteger(numericSpaceId) || !Number.isInteger(numericCategoryId)) {
    ElMessage.error("缺少空间或分类 id，无法删除关系分类。");
    return;
  }
  actionLoading.value = true;
  try {
    const response = await deleteOntologyRelationCategoryTreeInterface({
      spaceId: numericSpaceId,
      categoryId: numericCategoryId,
    });
    if (response.code !== 200) {
      throw new Error(response.message || "删除关系分类失败");
    }
    categoryDeleteVisible.value = false;
    ElMessage.success("分类已删除");
    await loadSpaceRelationWorkspace();
  } catch (cause) {
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "删除关系分类失败，请重试。");
  } finally {
    actionLoading.value = false;
  }
}

function openRelationCreate() {
  relationFormMode.value = "create";
  activeRelation.value = null;
  relationFormVisible.value = true;
}

function openRelationEdit(item: OntologyRelationClass) {
  relationFormMode.value = "edit";
  activeRelation.value = item;
  relationFormVisible.value = true;
}

function openRelationDelete(item: OntologyRelationClass) {
  activeRelation.value = item;
  relationDeleteVisible.value = true;
}

/**
 * @description 将表单分类 id 转为接口可选的数字 categoryId；根常量或非法值时省略。
 * @param categoryId 表单分类 id。
 * @returns 可提交的分类 id，或 undefined。
 */
function resolveCreateLinkCategoryId(categoryId: string | undefined): number | undefined {
  const trimmed = categoryId?.trim() ?? "";
  if (!trimmed || trimmed === ROOT_RELATION_CATEGORY_ID) return undefined;
  const numericCategoryId = Number(trimmed);
  return Number.isInteger(numericCategoryId) ? numericCategoryId : undefined;
}

/**
 * @description 提交关系表单：创建走 POST `/ontology/link` 成功后刷新关系树；编辑仍走本地更新。
 * @param payload 关系写载荷；create 时 sourceName/targetName 为本体 uniqueIdentifier。
 */
async function handleRelationSubmit(payload: RelationClassWritePayload) {
  if (relationFormMode.value === "edit") {
    actionLoading.value = true;
    relationFormRef.value?.setLoading(true);
    const error = editRelationClass({ ...payload, id: activeRelation.value?.id || "" });
    actionLoading.value = false;
    relationFormRef.value?.setLoading(false);
    if (error) {
      ElMessage.error(error);
      return;
    }
    relationFormVisible.value = false;
    ElMessage.success("关系已更新");
    return;
  }

  const space = String(route.params.spaceId || "").trim();
  const numericSpaceId = Number(space);
  if (!space || !Number.isInteger(numericSpaceId)) {
    ElMessage.error("缺少空间 id，无法创建关系。");
    relationFormRef.value?.setLoading(false);
    return;
  }

  const requestBody: CreateOntologyLinkParams = {
    name: payload.displayName,
    ontologyUniqueIdentifierFrom: payload.sourceName,
    ontologyUniqueIdentifierTo: payload.targetName,
    apiName: payload.apiName,
    spaceId: numericSpaceId,
  };
  const categoryId = resolveCreateLinkCategoryId(payload.categoryId);
  if (categoryId !== undefined) requestBody.categoryId = categoryId;
  const comment = payload.description.trim();
  if (comment) requestBody.comment = comment;

  actionLoading.value = true;
  relationFormRef.value?.setLoading(true);
  try {
    const response = await postCreateOntologyLinkInterface(requestBody);
    if (response.code !== 200) {
      throw new Error(response.message || "创建关系失败");
    }
    relationFormVisible.value = false;
    ElMessage.success("关系已添加");
    await loadSpaceRelationWorkspace();
  } catch (cause) {
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "创建关系失败，请重试。");
  } finally {
    actionLoading.value = false;
    relationFormRef.value?.setLoading(false);
  }
}

/**
 * @description 删除关系：提交关系唯一标识；表格与三维图删除共用此确认逻辑；成功后关闭弹框并刷新关系树。
 */
async function handleRelationDelete() {
  if (!activeRelation.value) return;
  const linkUniqIdentifier = activeRelation.value.id.trim();
  if (!linkUniqIdentifier) {
    ElMessage.error("缺少关系唯一标识，无法删除。");
    return;
  }
  actionLoading.value = true;
  try {
    const response = await deleteOntologyLinkInterface({ linkUniqIdentifier });
    if (response.code !== 200) {
      throw new Error(response.message || "删除关系失败");
    }
    relationDeleteVisible.value = false;
    activeRelation.value = null;
    ElMessage.success("关系已删除");
    await loadSpaceRelationWorkspace();
  } catch (cause) {
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "删除关系失败，请重试。");
  } finally {
    actionLoading.value = false;
  }
}
</script>

<style scoped lang="scss">
.space-relation-workspace {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
  min-height: 0;
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.space-relation-workspace__main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.space-relation-workspace__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 8px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-section-background), var(--aircas-color-panel-background-deep));
  box-shadow: inset 0 0 18px var(--aircas-color-divider);
}
.space-relation-workspace__title {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.space-relation-workspace__title h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}
.space-relation-workspace__title span {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
.space-relation-workspace__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}
.space-relation-workspace__view-switch {
  display: inline-flex;
  gap: 4px;
  padding: 2px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
}
.space-relation-workspace__view-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--aircas-color-transparent);
  border-radius: 4px;
  background: var(--aircas-color-transparent);
  color: var(--aircas-color-text-secondary);
  cursor: pointer;
  opacity: 0.55;
}
.space-relation-workspace__view-btn:hover {
  opacity: 0.85;
  border-color: var(--aircas-color-border);
  background: var(--aircas-color-accent-blue-soft);
}
.space-relation-workspace__view-btn-active {
  opacity: 1;
  border-color: var(--aircas-color-accent-cyan);
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-card-background-active);
}
.space-relation-workspace__filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
}
.space-relation-workspace__filter-objects {
  width: min(360px, 100%);
}
.space-relation-workspace__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 160px;
  color: var(--aircas-color-text-muted);
  font-size: 14px;
}
.space-relation-workspace__state-error {
  color: var(--aircas-color-accent-orange);
}
.space-relation-workspace__table-wrap {
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
}
.space-relation-workspace__name {
  color: var(--aircas-color-text-primary);
  font-weight: 600;
}
.space-relation-workspace__row-actions {
  display: inline-flex;
  gap: 8px;
}
</style>
