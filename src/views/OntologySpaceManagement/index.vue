<template>
  <div class="ontology-space-management">
    <button class="ontology-space-management__help" type="button" aria-label="打开新手引导" title="新手引导" @click="guideVisible = true">
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
    <OnboardingGuideOverlay v-model="guideVisible" :steps="guideSteps" :start-id="isEmbedded ? 'create-object' : 'create-space'" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { QuestionFilled } from "@element-plus/icons-vue";
import type { OnboardingGuideStep } from "@/components/OnboardingGuide/OnboardingGuideOverlay.vue";
import OnboardingGuideOverlay from "@/components/OnboardingGuide/OnboardingGuideOverlay.vue";
import AircasLoading from "@/components/AircasLoading.vue";
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
const guideVisible = ref(false);
const guideSteps = computed<OnboardingGuideStep[]>(() => {
  const steps: OnboardingGuideStep[] = [
    {
      id: "create-space",
      title: "创建空间",
      description: "在这里创建一个对象空间。引导示例不会提交数据。",
      targetSelector: ".welcome-panel__create",
      mockLabel: "新建对象空间",
    },
    {
      id: "create-object",
      title: "进入空间，建对象",
      description: "进入对象空间后，在对象工作区创建对象。引导示例不会提交数据。",
      targetSelector: ".workspace-type-tabs__item",
      mockLabel: "进入空间并创建对象",
    },
    {
      id: "create-property",
      title: "建属性",
      description: "在对象详情的属性页签中维护对象属性。引导示例不会提交数据。",
      targetSelector: ".object-detail-tabs__item",
      mockLabel: "属性",
    },
    {
      id: "create-relation",
      title: "建关系",
      description: "在关系工作区中维护对象关系。引导示例不会提交数据。",
      targetSelector: ".workspace-type-tabs__item",
      mockLabel: "关系",
    },
  ];
  return isEmbedded.value ? steps.filter((step) => step.id !== "create-space") : steps;
});

onMounted(() => {
  void Promise.all([loadOntologySpaces(), loadOntologyOverviewCount()]);
});
</script>

<style scoped lang="scss">
.ontology-space-management {
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
