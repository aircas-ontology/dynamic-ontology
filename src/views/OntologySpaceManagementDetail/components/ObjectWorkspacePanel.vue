<template>
  <section class="object-workspace-panel" aria-label="本体对象工作区">
    <div v-if="status === 'loading'" class="object-workspace-panel__state" role="status">正在加载本体对象…</div>
    <div v-else-if="status === 'error'" class="object-workspace-panel__state" role="alert">
      <span>{{ error }}</span>
      <el-button class="aircas-button" type="primary" @click="load">重试</el-button>
    </div>
    <el-empty v-else-if="status === 'empty' || !workspace" class="aircas-empty" description="暂无本体对象数据" />
    <div v-else class="object-workspace-panel__layout">
      <ConceptHierarchyTree :tree="workspace.tree" :selected-node-id="selectedNodeId" @select="selectNode" />
      <OntologyObjectList
        :sections="workspace.sections"
        :view-mode="viewMode"
        :location-target="locationTarget"
        @update:view-mode="viewMode = $event"
        @locate-parent="locateParent"
        @action="handleAction"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
import type { OntologyConceptNode, OntologyObjectItem, OntologyObjectLocationTarget, OntologyObjectViewMode } from "@/types";
import ConceptHierarchyTree from "./ConceptHierarchyTree.vue";
import OntologyObjectList from "./OntologyObjectList.vue";
import { useOntologyObjectWorkspace } from "../composables/useOntologyObjectWorkspace";
import { useOntologySpaceDetailStore } from "@/stores/useOntologySpaceDetailStore";
import { makeCategoryLocationTarget } from "../utils/objectWorkspace";

const route = useRoute();
const router = useRouter();
const spaceId = computed(() => String(route.params.spaceId || ""));
const detailStore = useOntologySpaceDetailStore();
const { displayName: spaceDisplayName } = storeToRefs(detailStore);
const { status, error, workspace, load } = useOntologyObjectWorkspace(spaceId);
const selectedNodeId = ref("");
const viewMode = ref<OntologyObjectViewMode>("card");
const locationTarget = ref<OntologyObjectLocationTarget | null>(null);
let locationRequestId = 0;

function locateCategory(categoryId: string) {
  locationTarget.value = makeCategoryLocationTarget(categoryId, ++locationRequestId);
}

function selectNode(node: OntologyConceptNode) {
  selectedNodeId.value = node.id;
  if (node.targetCategoryId) locateCategory(node.targetCategoryId);
}

function locateParent(item: OntologyObjectItem) {
  selectedNodeId.value = `category-${item.categoryId}`;
  locateCategory(item.categoryId);
}

function handleAction(action: string, item?: OntologyObjectItem) {
  if (action === "view" && item) {
    const query: Record<string, string> = {};
    if (spaceId.value) query.spaceId = spaceId.value;
    if (spaceDisplayName.value.trim()) query.spaceName = spaceDisplayName.value.trim();
    if (item.displayName.trim()) query.objectName = item.displayName.trim();
    void router.push({
      name: "OntologyObjectDetail",
      params: { objectId: item.id },
      query,
    });
    return;
  }
  const subject = item ? `“${item.displayName}”` : "本体";
  const labels: Record<string, string> = { create: "新建", edit: "编辑", export: "导出", delete: "删除" };
  ElMessage.info(`${subject}${labels[action] ?? "操作"}功能尚未接入。`);
}
</script>

<style scoped lang="scss">
.object-workspace-panel {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
}
.object-workspace-panel__layout {
  display: grid;
  min-width: 0;
  min-height: 0;
  height: 100%;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 10px;
}
.object-workspace-panel__state {
  display: flex;
  min-height: 280px;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  color: var(--aircas-color-text-muted);
  background: var(--aircas-color-panel-background);
}

@media (max-width: 1000px) {
  .object-workspace-panel {
    overflow-y: auto;
  }
  .object-workspace-panel__layout {
    height: auto;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(280px, 38vh) minmax(520px, auto);
  }
}
</style>
