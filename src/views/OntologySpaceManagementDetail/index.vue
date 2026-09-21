<template>
  <div class="space-management-detail" :class="{ 'is-empty': status === 'empty' }">
    <el-empty v-if="status === 'empty'" description="未找到对应的本体空间" />
    <div v-else-if="status === 'loading'" class="space-management-detail__state" role="status"><AircasLoading>正在加载空间…</AircasLoading></div>
    <div v-else-if="status === 'error'" class="space-management-detail__state" role="alert">
      <span>{{ error || "空间加载失败" }}</span>
      <el-button class="aircas-button" type="primary" @click="load">重试</el-button>
    </div>
    <div v-else class="space-management-detail__layout">
      <WorkspaceTypeTabs
        v-if="!isWorkflowPage"
        :active-tab="activeTab"
        :available-tabs="availableTabs"
        :space-name="spaceDisplayName"
        @update:active-tab="openTab"
      />
      <div class="space-management-detail__content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import AircasLoading from "@/components/AircasLoading.vue";
import type { ManagementWorkspaceTab } from "@/types";
import WorkspaceTypeTabs from "./components/WorkspaceTypeTabs.vue";
import { useSpaceWorkspace } from "./composables/useSpaceWorkspace";
import { routeNameForTab } from "./utils/workspaceTabs";

const router = useRouter();
const route = useRoute();
const { status, error, spaceId, activeTab, availableTabs, spaceDisplayName, load } = useSpaceWorkspace();
const isWorkflowPage = computed(() => route.name === "OntologyLlmBuilder" || route.name === "OntologySubspaceCreate");

function openTab(tab: ManagementWorkspaceTab) {
  if (tab === activeTab.value) return;
  void router.push({
    name: routeNameForTab(tab),
    params: { spaceId: spaceId.value },
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
    linear-gradient(var(--aircas-color-grid-line) 1px, var(--aircas-color-transparent) 1px),
    linear-gradient(90deg, var(--aircas-color-grid-line) 1px, var(--aircas-color-transparent) 1px),
    radial-gradient(circle at 18% 0, var(--aircas-color-accent-cyan-soft), var(--aircas-color-transparent) 36%),
    radial-gradient(circle at 82% 8%, var(--aircas-color-accent-purple-soft), var(--aircas-color-transparent) 34%),
    radial-gradient(circle at 65% 0, var(--aircas-color-page-glow), var(--aircas-color-transparent) 48%);
  background-size:
    34px 34px,
    34px 34px,
    auto,
    auto,
    auto;
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
}

.space-management-detail__state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 240px;
  gap: 12px;
}
</style>
