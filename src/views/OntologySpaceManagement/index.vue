<template>
  <div class="ontology-space-management">
    <section class="ontology-space-management__overview">
      <WelcomePanel @create="openOntologySpaceForm()" />
      <div class="ontology-space-management__stats">
        <StatCard v-for="stat in summaryStats" :key="stat.id" :stat="stat" />
      </div>
    </section>
    <SectionToolbar v-model:keyword="keyword" v-model:order="order" v-model:view-mode="viewMode" />
    <div v-if="status === 'loading'" class="ontology-space-management__state" role="status">正在加载本体空间…</div>
    <div v-else-if="status === 'error'" class="ontology-space-management__state" role="alert">
      <span>{{ error }}</span
      ><el-button class="aircas-button" type="primary" @click="loadOntologySpaces">重试</el-button>
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
    <SpaceFormDialog v-model="formVisible" :space="activeSpace" :external-error="actionError" @save="submitOntologySpaceForm" />
    <SpaceCommandDialogs
      v-model:delete-visible="deleteVisible"
      v-model:export-visible="exportVisible"
      :space="activeSpace"
      :busy="actionBusy"
      :error="actionError"
      @confirm-delete="confirmDeleteOntologySpace"
      @confirm-export="confirmExportOntologySpace"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import SectionToolbar from "./components/SectionToolbar.vue";
import SpaceCollection from "./components/SpaceCollection.vue";
import SpaceCommandDialogs from "./components/SpaceCommandDialogs.vue";
import SpaceFormDialog from "./components/SpaceFormDialog.vue";
import StatCard from "./components/StatCard.vue";
import WelcomePanel from "./components/WelcomePanel.vue";
import { useSpaceManagement } from "./composables/useSpaceManagement";
import { useSpaceManagementActions } from "./composables/useSpaceManagementActions";

const { keyword, order, viewMode, page, pageSize, status, error, result, summaryStats, loadOntologySpaces, saveOntologySpace, removeOntologySpace } =
  useSpaceManagement();
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
} = useSpaceManagementActions({ keyword, saveOntologySpace, removeOntologySpace, loadOntologySpaces });

onMounted(loadOntologySpaces);
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

.ontology-space-management__overview {
  display: grid;
  grid-template-columns: minmax(520px, 1.42fr) minmax(760px, 2.25fr);
  gap: 10px;
  min-height: 150px;
}

.ontology-space-management__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ontology-space-management__state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 320px;
  gap: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  color: var(--aircas-color-text-muted);
  background-color: var(--aircas-color-panel-background);
}

@media (max-width: 1440px) {
  .ontology-space-management__overview {
    grid-template-columns: minmax(430px, 1.2fr) minmax(700px, 2.2fr);
  }
}

@media (max-width: 1200px) {
  .ontology-space-management__overview {
    grid-template-columns: 1fr;
  }
}

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
