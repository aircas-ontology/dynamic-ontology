<template>
  <div class="entity-browsing-object-profile">
    <header class="entity-browsing-object-profile__header" :class="{ 'is-detail': detailVisible }">
      <div class="entity-browsing-object-profile__identity">
        <img class="entity-browsing-object-profile__icon" :src="profile.sideImage" :alt="profile.displayName" />
        <h1>{{ profile.displayName }}</h1>
        <span v-if="detailVisible && detailEntityName" class="entity-browsing-object-profile__entity-name" :title="detailEntityName">{{
          detailEntityName
        }}</span>
      </div>
      <div v-show="detailVisible" ref="detailTabsTarget" class="entity-browsing-object-profile__tabs-target" />
      <el-button type="primary" plain class="entity-browsing-object-profile__back" @click="goBackToEntityBrowsing">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </header>

    <div class="entity-browsing-object-profile__content" :class="{ 'is-detail': detailVisible }">
      <section v-show="!detailVisible" class="entity-browsing-object-profile__properties" aria-label="属性列表">
        <h2>属性列表</h2>
        <ObjectProfileStandardUsage :object-id="objectId" />
      </section>
      <section class="entity-browsing-object-profile__entities" aria-label="实体列表">
        <h2 v-if="!detailVisible">实体列表</h2>
        <ObjectProfileEntityList
          ref="entityListRef"
          :object-id="objectId"
          :space-id="spaceId"
          :object-name="profile.displayName"
          :tabs-target="detailTabsTarget"
          @detail-visibility-change="handleEntityDetailVisibility"
          @detail-name-change="handleEntityDetailName"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { resolveEntityBrowsingObjectProfile } from "@/mocks/entityBrowsingObjectProfileMock/entityBrowsingObjectProfileMock";
import { ENTITY_BROWSING_DEFAULT_SPACE_ID } from "@/utils/entityBrowseConstants";
import ObjectProfileEntityList from "./components/ObjectProfileEntityList.vue";
import ObjectProfileStandardUsage from "./components/ObjectProfileStandardUsage.vue";
const route = useRoute();
const router = useRouter();
const detailVisible = ref(false);
const detailEntityName = ref("");
const detailTabsTarget = ref<HTMLElement | null>(null);
const entityListRef = ref<InstanceType<typeof ObjectProfileEntityList>>();

const objectId = computed(() => (typeof route.params.objectId === "string" ? route.params.objectId.trim() : ""));

const spaceId = computed(() =>
  typeof route.params.spaceId === "string" && route.params.spaceId.trim() ? route.params.spaceId.trim() : ENTITY_BROWSING_DEFAULT_SPACE_ID,
);

const objectNameFallback = computed(() => {
  const fromQuery = route.query.objectName;
  return typeof fromQuery === "string" ? fromQuery.trim() : "";
});

const profile = computed(() => resolveEntityBrowsingObjectProfile(objectId.value, objectNameFallback.value));

/**
 * @description 同步实体详情可见状态，使详情占满页面内容区。
 * @param visible 是否显示详情。
 */
function handleEntityDetailVisibility(visible: boolean): void {
  detailVisible.value = visible;
}

/**
 * @description 同步顶部标题栏的当前实体名称。
 * @param name 实体名称，关闭详情时为空。
 */
function handleEntityDetailName(name: string): void {
  detailEntityName.value = name;
}

/**
 * @description 详情中返回实体列表，列表中返回当前空间对象列表并保留 query。
 */
function goBackToEntityBrowsing(): void {
  if (detailVisible.value) {
    entityListRef.value?.closeEntityDetail();
    return;
  }
  void router.push({
    name: "EntityBrowsingObject",
    params: { spaceId: spaceId.value },
    query: route.query,
  });
}

watch(objectId, () => {
  detailVisible.value = false;
  detailEntityName.value = "";
});
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
  flex-shrink: 0;
  margin-left: auto;
  height: 32px;
  padding: 0 12px;
  font-size: 14px;
}
.entity-browsing-object-profile__header.is-detail {
  gap: 16px;
}
.entity-browsing-object-profile__header.is-detail .entity-browsing-object-profile__identity {
  max-width: min(40%, 360px);
}
.entity-browsing-object-profile__tabs-target {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  overflow-x: auto;
}

.entity-browsing-object-profile__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.entity-browsing-object-profile__entity-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 600;
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

.entity-browsing-object-profile__content {
  display: grid;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
  min-height: 0;
  flex: 1;
}
.entity-browsing-object-profile__content.is-detail {
  grid-template-rows: minmax(0, 1fr);
}
.entity-browsing-object-profile__properties,
.entity-browsing-object-profile__entities {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.entity-browsing-object-profile__properties h2,
.entity-browsing-object-profile__entities h2 {
  margin: 0;
  font-size: 16px;
  color: var(--aircas-color-text-primary);
}
.entity-browsing-object-profile__properties > :last-child,
.entity-browsing-object-profile__entities > :last-child {
  flex: 1;
  min-height: 0;
  height: auto;
}
</style>
