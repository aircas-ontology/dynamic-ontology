<template>
  <nav class="object-profile-toc" aria-label="????">
    <ul class="object-profile-toc__list">
      <ObjectProfileTocNodeItem
        v-for="node in nodes"
        :key="node.id"
        :node="node"
        :active-id="activeId"
        :depth="0"
        @select="emit('select', $event)"
      />
    </ul>
  </nav>
</template>

<script setup lang="ts">
import ObjectProfileTocNodeItem from "./ObjectProfileTocNodeItem.vue";
import type { EntityBrowsingObjectProfileTocNode } from "@/types";

defineProps<{
  nodes: EntityBrowsingObjectProfileTocNode[];
  activeId: string;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<style scoped lang="scss">
.object-profile-toc {
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.object-profile-toc__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
