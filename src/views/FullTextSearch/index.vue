<template>
  <div class="full-text-search">
    <el-input
      v-model="keyword"
      class="aircas-input full-text-search__input"
      ariaLabel="全文检索"
      placeholder="检索空间，对象，实例，属性.."
      :prefix-icon="Search"
      clearable
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Search } from "@element-plus/icons-vue";

const keyword = ref("");
</script>

<style scoped lang="scss">
.full-text-search {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
  min-width: 0;
}

.full-text-search__input {
  width: min(640px, 100%);
}
</style>
