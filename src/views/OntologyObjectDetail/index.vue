<template>
  <div class="ontology-object-detail">
    <button class="ontology-object-detail__help" type="button" aria-label="打开新手引导" title="新手引导" @click="openOnboardingGuide()">
      <el-icon><QuestionFilled /></el-icon>
    </button>
    <div class="ontology-object-detail__layout">
      <ObjectDetailTabs :active-tab="activeTab" :available-tabs="availableTabs" :object-name="objectName" :counts="tabCounts" @update:active-tab="openTab" />
      <div class="ontology-object-detail__content">
        <router-view v-slot="{ Component, route: childRoute }">
          <component
            v-if="Component"
            :is="Component as any"
            :key="`${String(childRoute.params.objectId)}-${String(childRoute.name)}`"
            v-bind="detailChildProps"
            v-on="overviewListeners"
          />
        </router-view>
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
import type { OntologyObjectDetailTab } from "@/types";
import { ONBOARDING_GUIDE_ENTRY_IDS, ONBOARDING_GUIDE_STEPS } from "@/views/onboardingGuideSteps";
import ObjectDetailTabs from "./components/ObjectDetailTabs.vue";
import { useObjectDetailWorkspace } from "./composables/useObjectDetailWorkspace";
import { useObjectResourceStatistic } from "./composables/useObjectResourceStatistic";
import { routeNameForObjectDetailTab } from "./utils/objectDetailTabs";

const router = useRouter();
const route = useRoute();
const { activeTab, availableTabs, objectName, objectId, spaceId, spaceName, spaceType } = useObjectDetailWorkspace();
const { counts: objectCounts, loading: statisticLoading, error: statisticError, loadObjectResourceStatistic } = useObjectResourceStatistic(objectId);
const onboardingGuideSteps = ONBOARDING_GUIDE_STEPS;
const {
  visible: guideVisible,
  startId: guideStartId,
  openOnboardingGuide,
} = useOnboardingGuide({
  steps: onboardingGuideSteps,
  page: "object-detail",
  entryStepId: ONBOARDING_GUIDE_ENTRY_IDS["object-detail"],
});

/** @description 向当前子页面传递统计计数；对象概览同时传递加载和错误状态。 */
const detailChildProps = computed(() => {
  if (activeTab.value !== "object") return { counts: objectCounts.value };
  return { counts: objectCounts.value, loading: statisticLoading.value, error: statisticError.value };
});

/** @description 仅在对象概览页把重试交给统计加载。 */
const overviewListeners = computed(() => (activeTab.value === "object" ? { retry: loadObjectResourceStatistic } : {}));

/** Tab 徽标计数：属性/关系/行为，对象 Tab 不显示计数。 */
const tabCounts = computed<Partial<Record<Exclude<OntologyObjectDetailTab, "object">, number>>>(() => ({
  attribute: objectCounts.value.property,
  relation: objectCounts.value.relation,
  behavior: objectCounts.value.behavior,
}));

/**
 * @description 点击 Tab 时跳转到对应子路由；已在当前 Tab 则忽略。
 * @param tab 目标 Tab 标识。
 */
function openTab(tab: OntologyObjectDetailTab) {
  if (tab === activeTab.value) return;
  const query: Record<string, string> = {};
  if (spaceId.value) query.spaceId = spaceId.value;
  if (spaceName.value) query.spaceName = spaceName.value;
  query.spaceType = spaceType.value;
  if (route.query.from === "theme-space-management") query.from = "theme-space-management";
  if (objectName.value && !objectName.value.startsWith("对象 ")) query.objectName = objectName.value;
  void router.push({
    name: routeNameForObjectDetailTab(tab),
    params: { objectId: objectId.value },
    query,
  });
}
</script>

<style scoped lang="scss">
.ontology-object-detail {
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

.ontology-object-detail__help {
  position: fixed;
  top: 53px;
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
.ontology-object-detail__help:hover {
  color: var(--aircas-color-primary);
}
.ontology-object-detail__help:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 2px;
}

.ontology-object-detail__layout {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.ontology-object-detail__content {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
}
</style>
