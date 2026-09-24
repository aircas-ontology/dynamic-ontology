<template>
  <div class="full-text-search">
    <OntologyGlobalSearchField placement="page" ariaLabel="全文检索" placeholder="检索空间、对象、实例、属性..." />
  </div>
</template>

<script setup lang="ts">
import OntologyGlobalSearchField from "@/components/OntologyGlobalSearchField/OntologyGlobalSearchField.vue";
</script>

<style scoped lang="scss">
.full-text-search {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
  min-width: 0;
  width: 100%;
}
</style>
