<template>
  <OntologyRelationGraph2d
    :items="items"
    :seed-names="seedNames"
    :category-colors="categoryColors"
    :readonly="readonly"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
  />
</template>
<script setup lang="ts">
import type { OntologyRelationClass } from "@/types";
import OntologyRelationGraph2d from "@/components/OntologyRelationGraph2d.vue";
defineProps<{ items?: OntologyRelationClass[]; seedNames?: string[]; categoryColors?: Record<string, string>; readonly?: boolean }>();
const emit = defineEmits<{ edit: [item: OntologyRelationClass]; delete: [item: OntologyRelationClass] }>();
</script>
