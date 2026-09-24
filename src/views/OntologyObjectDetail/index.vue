<template>
  <div class="ontology-object-detail">
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
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import type { OntologyObjectDetailTab } from "@/types";
import ObjectDetailTabs from "./components/ObjectDetailTabs.vue";
import { useObjectDetailWorkspace } from "./composables/useObjectDetailWorkspace";
import { useObjectResourceStatistic } from "./composables/useObjectResourceStatistic";
import { routeNameForObjectDetailTab } from "./utils/objectDetailTabs";

const router = useRouter();
const { activeTab, availableTabs, objectName, objectId, spaceId, spaceName } = useObjectDetailWorkspace();
const { counts: objectCounts, loading: statisticLoading, error: statisticError, loadObjectResourceStatistic } = useObjectResourceStatistic(objectId);

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
