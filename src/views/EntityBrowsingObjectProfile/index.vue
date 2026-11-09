<template>
  <div class="entity-browsing-object-profile">
    <header class="entity-browsing-object-profile__header">
      <div class="entity-browsing-object-profile__identity">
        <img class="entity-browsing-object-profile__icon" :src="profile.sideImage" :alt="profile.displayName" />
        <h1>{{ profile.displayName }}</h1>
      </div>
      <nav class="entity-browsing-object-profile__tabs" aria-label="对象画像分区">
        <button
          v-for="tab in profileTabs"
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
      <ObjectProfileEntityList v-if="activeTab === 'entity-list'" :object-id="objectId" />
      <ObjectProfileStandardUsage v-else-if="showStandardContent && activeTab === 'standard-usage'" :object-id="objectId" />
      <div v-else class="entity-browsing-object-profile__placeholder" role="status">内容待配置</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { resolveEntityBrowsingObjectProfile } from "@/mocks/entityBrowsingObjectProfileMock/entityBrowsingObjectProfileMock";
import { ENTITY_BROWSING_DEFAULT_SPACE_ID } from "@/utils/entityBrowseConstants";
import { isStandardContentVisible } from "@/utils/isStandardContentVisible";
import ObjectProfileEntityList from "./components/ObjectProfileEntityList.vue";
import ObjectProfileStandardUsage from "./components/ObjectProfileStandardUsage.vue";
import type { EntityBrowsingObjectProfileTab } from "@/types";

const showStandardContent = isStandardContentVisible();

/** 空间浏览对象详情：实体列表；标准应用情况仅在运行时开关打开时展示。 */
const profileTabs = computed<ReadonlyArray<{ id: EntityBrowsingObjectProfileTab; label: string }>>(() => {
  const tabs: Array<{ id: EntityBrowsingObjectProfileTab; label: string }> = [{ id: "entity-list", label: "实体列表" }];
  if (showStandardContent) tabs.push({ id: "standard-usage", label: "标准应用情况" });
  return tabs;
});

const route = useRoute();
const router = useRouter();
const activeTab = ref<EntityBrowsingObjectProfileTab>("entity-list");

const objectId = computed(() => (typeof route.params.objectId === "string" ? route.params.objectId.trim() : ""));

const objectNameFallback = computed(() => {
  const fromQuery = route.query.objectName;
  return typeof fromQuery === "string" ? fromQuery.trim() : "";
});

const profile = computed(() => resolveEntityBrowsingObjectProfile(objectId.value, objectNameFallback.value));

/**
 * @description 切换对象时重置为实体列表 Tab。
 */
function resetActiveTab(): void {
  activeTab.value = "entity-list";
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
