<template>
  <div class="ontology-space-management">
    <button
      :class="{ 'is-embedded': isEmbedded }"
      class="ontology-space-management__help"
      type="button"
      aria-label="打开新手引导"
      title="新手引导"
      @click="openOnboardingGuide()"
    >
      <el-icon><QuestionFilled /></el-icon>
    </button>
    <section class="ontology-space-management__overview">
      <WelcomePanel :show-create="!isEmbedded" @create="openOntologySpaceForm()" />
      <div class="ontology-space-management__stats" :aria-busy="overviewStatus === 'loading'">
        <StatCard v-for="stat in summaryStats" :key="stat.id" :stat="stat" />
      </div>
    </section>
    <p v-if="overviewError" class="ontology-space-management__overview-error" role="alert">{{ overviewError }}</p>
    <SectionToolbar v-model:keyword="keyword" v-model:order="order" v-model:view-mode="viewMode" />
    <div v-if="status === 'loading'" class="ontology-space-management__state" role="status"><AircasLoading>正在加载对象空间…</AircasLoading></div>
    <div v-else-if="status === 'error'" class="ontology-space-management__state" role="alert">
      <span>{{ error }}</span
      ><el-button type="primary" @click="loadOntologySpaces">重试</el-button>
    </div>
    <SpaceCollection
      v-else
      :spaces="result.items"
      :total="result.total"
      :page="result.page"
      v-model:page-size="pageSize"
      :view-mode="viewMode"
      @update:page="page = $event"
      @action="handleOntologySpaceAction"
    />
    <SpaceFormDialog
      v-model="formVisible"
      :space="activeSpace"
      :external-error="actionError"
      @save="submitOntologySpaceForm"
      @imported="completeOntologySpaceImport"
    />
    <SpaceCommandDialogs
      v-model:delete-visible="deleteVisible"
      v-model:export-visible="exportVisible"
      :space="activeSpace"
      :busy="actionBusy"
      :error="actionError"
      @confirm-delete="confirmDeleteOntologySpace"
      @confirm-export="confirmExportOntologySpace"
    />
    <OnboardingGuideOverlay v-model="guideVisible" :steps="onboardingGuideSteps" :start-id="guideStartId" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { QuestionFilled } from "@element-plus/icons-vue";
import { useOnboardingGuide } from "@/composables/shared/useOnboardingGuide";
import OnboardingGuideOverlay from "@/components/OnboardingGuide/OnboardingGuideOverlay.vue";
import AircasLoading from "@/components/AircasLoading.vue";
import { CHAIN_CREATE_SPACE, ONBOARDING_GUIDE_EMBEDDED_ENTRY_IDS, ONBOARDING_GUIDE_ENTRY_IDS, ONBOARDING_GUIDE_STEPS } from "@/views/onboardingGuideSteps";
import SectionToolbar from "./components/SectionToolbar.vue";
import SpaceCollection from "./components/SpaceCollection.vue";
import SpaceCommandDialogs from "./components/SpaceCommandDialogs.vue";
import SpaceFormDialog from "./components/SpaceFormDialog.vue";
import StatCard from "./components/StatCard.vue";
import WelcomePanel from "./components/WelcomePanel.vue";
import { useSpaceManagement } from "./composables/useSpaceManagement";
import { useSpaceManagementActions } from "./composables/useSpaceManagementActions";

const {
  keyword,
  order,
  viewMode,
  page,
  pageSize,
  status,
  error,
  overviewError,
  overviewStatus,
  result,
  summaryStats,
  loadOntologyOverviewCount,
  loadOntologySpaces,
  saveOntologySpace,
  removeOntologySpace,
} = useSpaceManagement();
const {
  activeSpace,
  formVisible,
  deleteVisible,
  exportVisible,
  actionBusy,
  actionError,
  openOntologySpaceForm,
  handleOntologySpaceAction,
  submitOntologySpaceForm,
  confirmDeleteOntologySpace,
  confirmExportOntologySpace,
  completeOntologySpaceImport,
} = useSpaceManagementActions({ keyword, saveOntologySpace, removeOntologySpace, loadOntologySpaces });
const route = useRoute();
const isEmbedded = computed(() => typeof route.query.userName === "string" && route.query.userName.trim().length > 0);
const onboardingGuideSteps = computed(() =>
  isEmbedded.value ? ONBOARDING_GUIDE_STEPS.filter((step) => step.chain !== CHAIN_CREATE_SPACE) : ONBOARDING_GUIDE_STEPS,
);
const {
  visible: guideVisible,
  startId: guideStartId,
  openOnboardingGuide,
} = useOnboardingGuide({
  steps: onboardingGuideSteps.value,
  page: "space-list",
  entryStepId: isEmbedded.value ? ONBOARDING_GUIDE_EMBEDDED_ENTRY_IDS["space-list"] : ONBOARDING_GUIDE_ENTRY_IDS["space-list"],
});

onMounted(() => {
  void Promise.all([loadOntologySpaces(), loadOntologyOverviewCount()]);
});
</script>

<style scoped lang="scss">
.ontology-space-management {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  width: 100%;
  min-height: 0;
  padding: 12px;
  overflow-x: hidden;
  overflow-y: auto;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-page-background);
}

.ontology-space-management__help {
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
.ontology-space-management__help.is-embedded {
  top: 8px;
}
.ontology-space-management__help:hover {
  color: var(--aircas-color-primary);
}
.ontology-space-management__help:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 2px;
}

.ontology-space-management__overview {
  display: grid;
  grid-template-columns: minmax(520px, 1.42fr) minmax(760px, 2.25fr);
  align-items: stretch;
  gap: 12px;
  height: 150px;
  min-height: 150px;
  min-width: 1200px;
}

.ontology-space-management__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  min-height: 0;
  height: 100%;
}

.ontology-space-management__overview-error {
  margin: 8px 4px 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
}

.ontology-space-management__state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 320px;
  gap: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  color: var(--aircas-color-text-secondary);
  background-color: var(--aircas-color-panel-background);
}

// @media (max-width: 1440px) {
//   .ontology-space-management__overview {
//     grid-template-columns: minmax(430px, 1.2fr) minmax(700px, 2.2fr);
//   }
// }

// @media (max-width: 1200px) {
//   .ontology-space-management__overview {
//     grid-template-columns: 1fr;
//   }
// }

@media (max-width: 700px) {
  .ontology-space-management {
    height: auto;
  }

  .ontology-space-management__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .ontology-space-management__stats {
    grid-template-columns: 1fr;
  }
}
</style>
