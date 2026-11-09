<template>
  <div class="object-profile-overview">
    <aside class="object-profile-overview__toc">
      <ObjectProfileToc :nodes="profile.toc" :active-id="activeSectionId" @select="scrollToSection" />
    </aside>

    <div ref="scrollRef" class="object-profile-overview__scroll" @scroll="onScroll">
      <div class="object-profile-overview__body">
        <article class="object-profile-overview__article">
          <figure class="object-profile-overview__hero">
            <img v-if="profile.coverImage" :src="profile.coverImage" :alt="profile.displayName" />
          </figure>

          <template v-for="block in profile.blocks" :key="block.id">
            <h2 v-if="block.type === 'heading' && (block.level ?? 1) === 1" :id="block.id" class="object-profile-overview__h1">
              {{ block.content }}
            </h2>
            <h3 v-else-if="block.type === 'heading'" :id="block.id" class="object-profile-overview__h2">{{ block.content }}</h3>
            <p v-else-if="block.type === 'paragraph'" :id="block.id" class="object-profile-overview__paragraph">{{ block.content }}</p>
            <ul v-else-if="block.type === 'list' && block.items?.length" :id="block.id" class="object-profile-overview__list">
              <li v-for="(item, index) in block.items" :key="`${block.id}-${index}`">{{ item }}</li>
            </ul>
            <div v-else-if="block.type === 'gallery' && block.images?.length" :id="block.id" class="object-profile-overview__gallery">
              <figure v-for="image in block.images" :key="image.id" class="object-profile-overview__gallery-item">
                <img :src="image.src" :alt="image.caption" />
                <figcaption>{{ image.caption }}</figcaption>
              </figure>
            </div>
          </template>
        </article>

        <aside class="object-profile-overview__rail">
          <section class="object-profile-overview__attr">
            <img v-if="profile.sideImage" class="object-profile-overview__side-image" :src="profile.sideImage" :alt="profile.displayName" />
            <header class="object-profile-overview__attr-title">
              <h3>属性列表 &gt;&gt;&gt;</h3>
            </header>
            <div class="object-profile-overview__attr-panel">
              <template v-for="group in profile.attributeGroups" :key="group.id">
                <h4 v-if="group.sectionTitle" class="object-profile-overview__attr-section">{{ group.sectionTitle }}</h4>
                <ul class="object-profile-overview__attr-list">
                  <li v-for="(item, index) in group.items" :key="`${group.id}-${index}`">
                    <div class="object-profile-overview__attr-row">
                      <span class="object-profile-overview__attr-label">{{ item.label }}:</span>
                      <div v-if="item.lines?.length || item.value" class="object-profile-overview__attr-value">
                        <template v-if="item.lines?.length">
                          <p v-for="(line, lineIndex) in item.lines" :key="`line-${index}-${lineIndex}`">{{ line }}</p>
                        </template>
                        <p v-else>{{ item.value }}</p>
                      </div>
                    </div>
                    <ul v-if="item.children?.length" class="object-profile-overview__attr-children">
                      <li v-for="(child, childIndex) in item.children" :key="`child-${index}-${childIndex}`">
                        <div class="object-profile-overview__attr-child-row">
                          <template v-if="child.value">
                            <span>{{ child.label }}:</span>
                            <span>{{ child.value }}</span>
                          </template>
                          <span v-else-if="child.children?.length">{{ child.label }}:</span>
                          <span v-else>{{ child.label }}</span>
                        </div>
                        <ul v-if="child.children?.length" class="object-profile-overview__attr-grandchildren">
                          <li v-for="(grand, grandIndex) in child.children" :key="`grand-${index}-${childIndex}-${grandIndex}`">
                            <template v-if="grand.value">
                              <span>{{ grand.label }}:</span>
                              <span>{{ grand.value }}</span>
                            </template>
                            <span v-else>{{ grand.label }}</span>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ul>
              </template>
            </div>
          </section>

          <ObjectProfileRelationGraph class="object-profile-overview__relation" :center-name="profile.relationCenterName" :nodes="profile.relationNodes" />

          <ObjectProfileEntityCards
            v-if="objectId"
            class="object-profile-overview__entities"
            :object-id="objectId"
            @open-entity-detail="emit('open-entity-detail')"
          />
        </aside>
      </div>

      <ObjectProfileEntityStats v-if="objectId" :object-id="objectId" class="object-profile-overview__stats" embedded />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import ObjectProfileToc from "./ObjectProfileToc.vue";
import ObjectProfileRelationGraph from "./ObjectProfileRelationGraph.vue";
import ObjectProfileEntityCards from "./ObjectProfileEntityCards.vue";
import ObjectProfileEntityStats from "./ObjectProfileEntityStats.vue";
import type { EntityBrowsingObjectProfileData } from "@/types";

const props = defineProps<{
  profile: EntityBrowsingObjectProfileData;
  /** 传入时在基本信息下方展示实体统计。 */
  objectId?: string;
}>();

const emit = defineEmits<{
  "open-entity-detail": [];
}>();

const scrollRef = ref<HTMLElement | null>(null);
const activeSectionId = ref(props.profile.toc[0]?.id || "root");

/**
 * @description 递归收集画像目录中的分区标识。
 * @param nodes 目录节点。
 * @returns 返回分区标识列表。
 */
function collectSectionIds(nodes: EntityBrowsingObjectProfileData["toc"]): string[] {
  const ids: string[] = [];
  const walk = (list: EntityBrowsingObjectProfileData["toc"]): void => {
    for (const node of list) {
      ids.push(node.id);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return ids;
}

/**
 * @description 滚动到指定画像分区。
 * @param id 分区标识。
 */
function scrollToSection(id: string): void {
  activeSectionId.value = id;
  const root = scrollRef.value;
  if (!root) return;
  if (id === props.profile.toc[0]?.id) {
    root.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const target = root.querySelector(`#${CSS.escape(id)}`);
  if (target instanceof HTMLElement) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * @description 根据滚动位置更新当前目录分区。
 */
function onScroll(): void {
  const root = scrollRef.value;
  if (!root) return;
  const ids = collectSectionIds(props.profile.toc).filter((id) => id !== props.profile.toc[0]?.id);
  let current = props.profile.toc[0]?.id || "root";
  for (const id of ids) {
    const el = root.querySelector(`#${CSS.escape(id)}`);
    if (!(el instanceof HTMLElement)) continue;
    const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top;
    if (top <= 80) current = id;
  }
  activeSectionId.value = current;
}

onMounted(() => {
  activeSectionId.value = props.profile.toc[0]?.id || "root";
});
</script>

<style scoped lang="scss">
.object-profile-overview {
  display: grid;
  min-width: 0;
  min-height: 0;
  height: 100%;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 8px;
}

.object-profile-overview__toc {
  min-width: 0;
  min-height: 0;
}

.object-profile-overview__scroll {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.object-profile-overview__body {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.9fr);
  gap: 16px;
  padding: 16px;
}

.object-profile-overview__stats {
  margin: 0 16px 16px;
}

.object-profile-overview__article {
  min-width: 0;
}

.object-profile-overview__hero {
  margin: 0 0 16px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-card-background);

  img {
    display: block;
    width: 100%;
    max-height: 280px;
    object-fit: cover;
  }
}

.object-profile-overview__h1 {
  margin: 20px 0 12px;
  color: var(--aircas-color-text-primary);
  font-size: 20px;
  font-weight: 600;
  scroll-margin-top: 12px;
}

.object-profile-overview__h2 {
  margin: 16px 0 10px;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
  scroll-margin-top: 12px;
}

.object-profile-overview__paragraph {
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
  line-height: 1.7;
  scroll-margin-top: 12px;
}

.object-profile-overview__list {
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
  line-height: 1.8;
  scroll-margin-top: 12px;
}

.object-profile-overview__list li {
  margin: 0;
  padding: 0;
}

.object-profile-overview__gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 12px 0 16px;
}

.object-profile-overview__gallery-item {
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-card-background);

  img {
    display: block;
    width: 100%;
    height: 100px;
    object-fit: cover;
  }

  figcaption {
    padding: 6px 8px 8px;
    color: var(--aircas-color-text-secondary);
    font-size: 12px;
    text-align: center;
  }
}

.object-profile-overview__rail {
  display: flex;
  position: sticky;
  top: 0;
  align-self: start;
  min-width: 0;
  max-height: calc(100vh - 120px);
  flex-direction: column;
  gap: 12px;
  overflow: auto;
}

.object-profile-overview__attr {
  display: flex;
  flex: 0 0 auto;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-card-background);
}

.object-profile-overview__side-image {
  display: block;
  width: 100%;
  max-height: 120px;
  object-fit: cover;
  border-bottom: 1px solid var(--aircas-color-border);
}

.object-profile-overview__attr-title {
  flex: 0 0 auto;
  padding: 10px 12px 6px;
}

.object-profile-overview__attr-title h3 {
  margin: 0;
  color: var(--aircas-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.object-profile-overview__attr-panel {
  min-height: 0;
  max-height: 220px;
  padding: 0 12px 12px;
  overflow: auto;
}

.object-profile-overview__relation {
  flex: 0 0 auto;
  min-height: 220px;
}

.object-profile-overview__relation :deep(.object-profile-relation-graph__canvas) {
  min-height: 180px;
  height: 200px;
  flex: 0 0 auto;
}

.object-profile-overview__entities {
  flex: 1 1 auto;
  min-height: 100px;
  margin: 0;
}

.object-profile-overview__attr-section {
  margin: 4px 0 12px;
  color: var(--aircas-color-text-primary);
  font-size: 15px;
  font-weight: 600;
  text-align: center;
}

.object-profile-overview__attr-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.object-profile-overview__attr-list > li {
  position: relative;
  margin: 0 0 10px;
  padding-left: 14px;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  line-height: 1.55;
}

.object-profile-overview__attr-list > li::before {
  content: "";
  position: absolute;
  top: 0.45em;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--aircas-color-text-primary);
}

.object-profile-overview__attr-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.object-profile-overview__attr-label {
  flex: 0 0 auto;
  white-space: nowrap;
}

.object-profile-overview__attr-value {
  min-width: 0;
  flex: 1;
}

.object-profile-overview__attr-value p {
  margin: 0;
}

.object-profile-overview__attr-children {
  margin: 6px 0 0;
  padding: 0 0 0 4px;
  list-style: none;
}

.object-profile-overview__attr-children > li {
  position: relative;
  margin: 0 0 4px;
  padding-left: 14px;
}

.object-profile-overview__attr-children > li::before {
  content: "";
  position: absolute;
  top: 0.45em;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--aircas-color-text-primary);
}

.object-profile-overview__attr-child-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.object-profile-overview__attr-grandchildren {
  margin: 4px 0 0;
  padding: 0 0 0 4px;
  list-style: none;
}

.object-profile-overview__attr-grandchildren > li {
  position: relative;
  margin: 0 0 4px;
  padding-left: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.object-profile-overview__attr-grandchildren > li::before {
  content: "";
  position: absolute;
  top: 0.45em;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--aircas-color-text-primary);
}

.object-profile-overview__attr-panel > .object-profile-overview__attr-section:not(:first-child) {
  margin-top: 18px;
}

.object-profile-overview__attr-list > li:last-child {
  margin-bottom: 0;
}
</style>
