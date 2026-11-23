<template>
  <div class="intelligence-placeholder">
    <h2>{{ title }}</h2>
  </div>
</template>
<script setup lang="ts">
defineProps<{ title: string }>();
</script>
<style scoped lang="scss">
.intelligence-placeholder {
  padding: 24px;
  color: var(--aircas-color-text-primary);
}
</style>
