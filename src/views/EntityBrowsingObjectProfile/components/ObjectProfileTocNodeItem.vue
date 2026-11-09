<template>
  <li class="object-profile-toc-node">
    <button
      type="button"
      class="object-profile-toc-node__btn"
      :class="{
        'object-profile-toc-node__btn--active': node.id === activeId,
        'object-profile-toc-node__btn--root': depth === 0,
      }"
      :style="{ paddingLeft: `${12 + depth * 12}px` }"
      @click="emit('select', node.id)"
    >
      {{ node.label }}
    </button>
    <ul v-if="node.children?.length" class="object-profile-toc-node__children">
      <ObjectProfileTocNodeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :active-id="activeId"
        :depth="depth + 1"
        @select="emit('select', $event)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import ObjectProfileTocNodeItem from "./ObjectProfileTocNodeItem.vue";
import type { EntityBrowsingObjectProfileTocNode } from "@/types";

defineProps<{
  node: EntityBrowsingObjectProfileTocNode;
  activeId: string;
  depth: number;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<style scoped lang="scss">
.object-profile-toc-node__children {
  margin: 0;
  padding: 0;
  list-style: none;
}

.object-profile-toc-node__btn {
  display: block;
  width: 100%;
  height: 32px;
  padding-right: 8px;
  overflow: hidden;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.object-profile-toc-node__btn:hover {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-effect-primary-soft);
}

.object-profile-toc-node__btn--active {
  color: var(--aircas-color-primary);
  background: var(--aircas-color-effect-primary-soft);
}

.object-profile-toc-node__btn--root {
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}
</style>
