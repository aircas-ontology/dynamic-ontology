<template>
  <div class="space-management-detail" :class="{ 'is-empty': status === 'empty' }">
    <button
      v-if="status === 'ready' && !isWorkflowPage"
      :class="{ 'is-embedded': isEmbedded }"
      class="space-management-detail__help"
      type="button"
      aria-label="打开新手引导"
      title="新手引导"
      @click="openOnboardingGuide()"
    >
      <el-icon><QuestionFilled /></el-icon>
    </button>
    <el-empty v-if="status === 'empty'" description="未找到对应的对象空间" />
    <div v-else-if="status === 'loading'" class="space-management-detail__state" role="status"><AircasLoading>正在加载空间…</AircasLoading></div>
    <div v-else-if="status === 'error'" class="space-management-detail__state" role="alert">
      <span>{{ error || "空间加载失败" }}</span>
      <el-button type="primary" @click="load">重试</el-button>
    </div>
    <div v-else class="space-management-detail__layout">
      <WorkspaceTypeTabs
        v-if="!isWorkflowPage"
        :active-tab="activeTab"
        :available-tabs="availableTabs"
        :counts="spaceOverviewCounts"
        :counts-loading="spaceOverviewCountsLoading"
        @update:active-tab="openTab"
      />
      <div class="space-management-detail__content">
        <router-view />
      </div>
    </div>
    <OnboardingGuideOverlay v-model="guideVisible" :steps="onboardingGuideSteps" :start-id="guideStartId" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { QuestionFilled } from "@element-plus/icons-vue";
import { useOnboardingGuide } from "@/composables/shared/useOnboardingGuide";
import OnboardingGuideOverlay from "@/components/OnboardingGuide/OnboardingGuideOverlay.vue";
import AircasLoading from "@/components/AircasLoading.vue";
import type { ManagementWorkspaceTab } from "@/types";
import { ONBOARDING_GUIDE_ENTRY_IDS, ONBOARDING_GUIDE_STEPS, THEME_ONBOARDING_GUIDE_STEPS } from "@/views/onboardingGuideSteps";
import WorkspaceTypeTabs from "./components/WorkspaceTypeTabs.vue";
import { useSpaceOverview } from "./composables/useSpaceOverview";
import { useSpaceWorkspace } from "./composables/useSpaceWorkspace";
import { routeNameForTab } from "./utils/workspaceTabs";

const router = useRouter();
const route = useRoute();
const isEmbedded = computed(() => typeof route.query.userName === "string" && route.query.userName.trim().length > 0);
const { status, error, spaceId, activeTab, availableTabs, load } = useSpaceWorkspace();
// 空间统计由布局层加载一次，供 tab 菜单后缀使用。
const spaceOverview = useSpaceOverview(spaceId);
const spaceOverviewCounts = computed(() => spaceOverview.data.value?.counts);
const spaceOverviewCountsLoading = computed(() => spaceOverview.loading.value);
const isWorkflowPage = computed(() => route.name === "OntologyLlmBuilder" || route.name === "OntologySubspaceCreate");
// 主题来源（from=theme-space-management）时切换为主题链步骤；对象空间来源保持原配置，行为不变。
const isThemeSpaceGuide = computed(() => route.query.from === "theme-space-management");
const onboardingGuideSteps = computed(() => (isThemeSpaceGuide.value ? THEME_ONBOARDING_GUIDE_STEPS : ONBOARDING_GUIDE_STEPS));
const {
  visible: guideVisible,
  startId: guideStartId,
  openOnboardingGuide,
} = useOnboardingGuide({
  steps: onboardingGuideSteps.value,
  page: "space-manage",
  entryStepId: ONBOARDING_GUIDE_ENTRY_IDS["space-manage"],
});

/** @description 切换空间内管理的工作区 tab，透传当前 query 以保持来源标识与空间名。 @param tab 目标 tab。 */
function openTab(tab: ManagementWorkspaceTab) {
  if (tab === activeTab.value) return;
  void router.push({
    name: routeNameForTab(tab),
    params: { spaceId: spaceId.value },
    query: route.query,
  });
}
</script>

<style scoped lang="scss">
.space-management-detail {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
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

.space-management-detail__help {
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

.space-management-detail__help.is-embedded {
  top: 8px;
}
.space-management-detail__help:hover {
  color: var(--aircas-color-primary);
}
.space-management-detail__help:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 2px;
}

.space-management-detail.is-empty {
  display: grid;
  place-items: center;
}

.space-management-detail__layout {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.space-management-detail__content {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  gap: 8px;
}

.space-management-detail__state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 240px;
  gap: 12px;
}
</style>
