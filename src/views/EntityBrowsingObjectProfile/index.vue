<template>
  <div class="entity-browsing-object-profile">
    <header class="entity-browsing-object-profile__header">
      <div class="entity-browsing-object-profile__identity">
        <img v-if="profile.sideImage" class="entity-browsing-object-profile__icon" :src="profile.sideImage" :alt="profile.displayName" />
        <h1>{{ profile.displayName }}</h1>
      </div>
      <nav class="entity-browsing-object-profile__tabs" aria-label="对象画像分区">
        <button
          v-for="tab in visibleProfileTabs"
          :key="tab.id"
          type="button"
          class="entity-browsing-object-profile__tab"
          :class="{ 'entity-browsing-object-profile__tab--active': activeTab === tab.id }"
          role="tab"
          :aria-selected="activeTab === tab.id"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
      <el-button type="primary" plain class="entity-browsing-object-profile__back" @click="goBackToEntityBrowsing">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </header>

    <div class="entity-browsing-object-profile__content">
      <ObjectProfileOverview v-if="activeTab === 'basic-info'" :profile="profile" :object-id="objectId" @open-entity-detail="openEntityDetailFromCards" />
      <ObjectProfileEntityList
        v-else-if="activeTab === 'entity-list'"
        :object-id="objectId"
        :auto-open-detail="pendingOpenEntityDetail"
        @detail-auto-opened="pendingOpenEntityDetail = false"
        @close-detail="onEntityListCloseDetail"
      />
      <ObjectProfileStandardUsage v-else-if="activeTab === 'standard-usage'" :object-id="objectId" />
      <div v-else class="entity-browsing-object-profile__placeholder" role="status">内容待配置</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { resolveEntityBrowsingObjectProfile } from "@/mocks/entityBrowsingObjectProfileMock/entityBrowsingObjectProfileMock";
import { ENTITY_BROWSING_DEFAULT_SPACE_ID, isEntityBrowsingLiteProfileObjectId } from "@/utils/entityBrowseConstants";
import ObjectProfileOverview from "./components/ObjectProfileOverview.vue";
import ObjectProfileEntityList from "./components/ObjectProfileEntityList.vue";
import ObjectProfileStandardUsage from "./components/ObjectProfileStandardUsage.vue";
import type { EntityBrowsingObjectProfileTab } from "@/types";

/** 完整画像：仅基本信息（统计合入基本信息下方）。 */
const fullProfileTabs: ReadonlyArray<{ id: EntityBrowsingObjectProfileTab; label: string }> = [{ id: "basic-info", label: "基本信息" }];

/** 精简画像：实体列表 + 标准应用情况（对应 id：052D型驱逐舰）。 */
const liteProfileTabs: ReadonlyArray<{ id: EntityBrowsingObjectProfileTab; label: string }> = [
  { id: "entity-list", label: "实体列表" },
  { id: "standard-usage", label: "标准应用情况" },
];

const route = useRoute();
const router = useRouter();
const activeTab = ref<EntityBrowsingObjectProfileTab>("basic-info");
const pendingOpenEntityDetail = ref(false);

const objectId = computed(() => (typeof route.params.objectId === "string" ? route.params.objectId.trim() : ""));

const isLiteProfile = computed(() => isEntityBrowsingLiteProfileObjectId(objectId.value));
const visibleProfileTabs = computed(() => (isLiteProfile.value ? liteProfileTabs : fullProfileTabs));

const objectNameFallback = computed(() => {
  const fromQuery = route.query.objectName;
  return typeof fromQuery === "string" ? fromQuery.trim() : "";
});

const profile = computed(() => resolveEntityBrowsingObjectProfile(objectId.value, objectNameFallback.value));

/**
 * @description 按当前画像模式重置默认 Tab。
 */
function resetActiveTab(): void {
  activeTab.value = isLiteProfile.value ? "entity-list" : "basic-info";
  pendingOpenEntityDetail.value = false;
}

/**
 * @description 基本信息卡片点击：切到实体列表并打开与列表「详情」相同的嵌入页。
 */
function openEntityDetailFromCards(): void {
  pendingOpenEntityDetail.value = true;
  activeTab.value = "entity-list";
}

/**
 * @description 完整画像无「实体列表」Tab 时，关闭嵌入详情后回到基本信息。
 */
function onEntityListCloseDetail(): void {
  if (!isLiteProfile.value) {
    activeTab.value = "basic-info";
  }
}

/**
 * @description 返回当前空间的实体浏览对象列表，保留原 query。
 */
function goBackToEntityBrowsing(): void {
  const spaceId = typeof route.params.spaceId === "string" && route.params.spaceId ? route.params.spaceId : ENTITY_BROWSING_DEFAULT_SPACE_ID;
  void router.push({
    name: "EntityBrowsingObject",
    params: { spaceId },
    query: route.query,
  });
}

watch(objectId, resetActiveTab, { immediate: true });
</script>

<style scoped lang="scss">
.entity-browsing-object-profile {
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
    radial-gradient(circle at 82% 8%, var(--aircas-color-effect-purple-soft), transparent 34%);
  background-size:
    34px 34px,
    34px 34px,
    auto,
    auto;
}

.entity-browsing-object-profile__header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 48px;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.entity-browsing-object-profile__back {
  margin-left: auto;
  height: 32px;
  padding: 0 12px;
  font-size: 14px;
}

.entity-browsing-object-profile__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.entity-browsing-object-profile__icon {
  width: 28px;
  height: 28px;
  object-fit: cover;
  border-radius: 4px;
}

.entity-browsing-object-profile__identity h1 {
  margin: 0;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entity-browsing-object-profile__tabs {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
}

.entity-browsing-object-profile__tab {
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.entity-browsing-object-profile__tab:hover {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-effect-primary-soft);
}

.entity-browsing-object-profile__tab--active {
  color: var(--aircas-color-primary);
  box-shadow: inset 0 -2px 0 var(--aircas-color-primary);
}

.entity-browsing-object-profile__content {
  min-width: 0;
  min-height: 0;
  flex: 1;
}

.entity-browsing-object-profile__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}
</style>
