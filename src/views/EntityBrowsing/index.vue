<template>
  <div class="entity-browsing" :class="{ 'is-empty': status === 'empty' }">
    <el-empty v-if="status === 'empty'" description="未找到对应的对象空间" />
    <div v-else-if="status === 'loading'" class="entity-browsing__state" role="status"><AircasLoading>正在加载实体浏览…</AircasLoading></div>
    <div v-else-if="status === 'error'" class="entity-browsing__state" role="alert">
      <span>{{ error || "空间加载失败" }}</span>
      <el-button type="primary" @click="loadEntityBrowseSpace">重试</el-button>
    </div>
    <div v-else class="entity-browsing__layout">
      <EntityBrowseOverview
        :statistics="overview.statistics"
        :quality="overview.quality"
        :loading="overviewStatus === 'loading'"
        :failed="overviewStatus === 'error'"
      />
      <div v-if="overviewError" class="entity-browsing__overview-error" role="alert">
        {{ overviewError }} <el-button link type="primary" @click="loadBrowseStatistics">重试</el-button>
      </div>
      <div class="entity-browsing__tabs-row">
        <WorkspaceTypeTabs
          :active-tab="activeTab"
          :available-tabs="availableTabs"
          :counts="spaceOverviewCounts"
          :counts-loading="spaceOverviewCountsLoading"
          @update:active-tab="openEntityBrowseTab"
        />
        <el-button type="primary" plain class="entity-browsing__back" @click="goEntityBrowseBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
      <div class="entity-browsing__content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import AircasLoading from "@/components/AircasLoading.vue";
import type { ManagementWorkspaceTab } from "@/types";
import EntityBrowseOverview from "./components/EntityBrowseOverview.vue";
import WorkspaceTypeTabs from "./components/WorkspaceTypeTabs.vue";
import { useEntityBrowseOverview } from "./composables/useEntityBrowseOverview";
import { useEntityBrowseWorkspace } from "./composables/useEntityBrowseWorkspace";
import { routeNameForEntityBrowseTab } from "./utils/workspaceTabs";
import { powerBehaviorInstances } from "@/mocks/entityBrowsingDeweyBehavior/deweyBehaviorMock";

const router = useRouter();
const route = useRoute();
const { status, error, spaceId, activeTab, availableTabs, loadEntityBrowseSpace } = useEntityBrowseWorkspace();
const { overview, counts, status: overviewStatus, error: overviewError, loadBrowseStatistics } = useEntityBrowseOverview(spaceId);
/** 行为 Tab 固定展示杜威号动力层静态实例数（不依赖内网行为统计接口）。 */
const spaceOverviewCounts = computed(() => ({
  ...(overviewStatus.value === "success"
    ? { object: counts.value.ontology, relation: counts.value.relation, "function-operator": counts.value.functionOperator }
    : {}),
  behavior: powerBehaviorInstances.length,
}));
const spaceOverviewCountsLoading = computed(() => overviewStatus.value === "loading");

/**
 * @description 切换实体浏览工作区 Tab，透传当前 query。
 * @param tab 目标 Tab。
 */
function openEntityBrowseTab(tab: ManagementWorkspaceTab) {
  if (tab === activeTab.value) return;
  void router.push({
    name: routeNameForEntityBrowseTab(tab),
    params: { spaceId: spaceId.value },
    query: route.query,
  });
}

/**
 * @description 实体浏览返回：主题入口回主题管理，其余回退历史，无历史时回主题管理。
 */
function goEntityBrowseBack(): void {
  if (route.query.from === "theme-space-management" || route.query.from === "theme-space-browse" || route.query.spaceType === "1") {
    void router.push({ name: "ThemeSpaceBrowse" });
    return;
  }
  void router.push({ name: "OntologySpaceBrowse" });
}
</script>

<style scoped lang="scss">
.entity-browsing {
  display: flex;
  width: 100%;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  background-color: var(--aircas-color-page-background);
  background-image:
    linear-gradient(var(--aircas-color-effect-grid) 1px, transparent 1px), linear-gradient(90deg, var(--aircas-color-effect-grid) 1px, transparent 1px),
    radial-gradient(circle at 18% 0, var(--aircas-color-effect-primary-soft), transparent 36%),
    radial-gradient(circle at 82% 8%, var(--aircas-color-effect-purple-soft), transparent 34%),
    radial-gradient(circle at 65% 0, var(--aircas-color-effect-page-glow), transparent 48%);
  background-size:
    34px 34px,
    34px 34px,
    auto,
    auto,
    auto;
}

.entity-browsing.is-empty {
  display: grid;
  place-items: center;
}

.entity-browsing__layout {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.entity-browsing__tabs-row {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
}

.entity-browsing__tabs-row > :deep(.workspace-type-tabs) {
  flex: 1;
  min-width: 0;
}

.entity-browsing__back {
  flex-shrink: 0;
  height: 32px;
  padding: 0 12px;
  font-size: 14px;
}

.entity-browsing__content {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  gap: 8px;
}

.entity-browsing__content > :deep(*) {
  min-width: 0;
  min-height: 0;
  flex: 1;
}

.entity-browsing__state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 240px;
  gap: 12px;
}

.entity-browsing__overview-error {
  margin: 0;
  color: var(--aircas-color-danger);
  font-size: 16px;
}
</style>
