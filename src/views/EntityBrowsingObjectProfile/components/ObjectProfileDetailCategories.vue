<template>
  <aside class="detail-categories" :aria-label="title">
    <h3>{{ title }}</h3>
    <el-input v-model="keyword" clearable :placeholder="`搜索${title}`" :ariaLabel="`搜索${title}`" />
    <AircasLoading v-if="status === 'loading'">正在加载分类…</AircasLoading>
    <div v-else-if="status === 'error'" role="alert">
      <p>{{ error }}</p>
      <el-button @click="emit('retry')">重试</el-button>
    </div>
    <el-tree
      v-else
      ref="treeRef"
      :data="items"
      node-key="id"
      :props="{ label: 'label', children: 'children' }"
      :current-node-key="selectedId"
      default-expand-all
      highlight-current
      :expand-on-click-node="false"
      :filter-node-method="filterCategoryNode"
      @node-click="selectCategoryNode"
    />
  </aside>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import type { ElTree } from "element-plus";
import type { ObjectProfileEntityCategory } from "@/types";
import AircasLoading from "@/components/AircasLoading.vue";
const props = withDefaults(defineProps<{ title: string; items: ObjectProfileEntityCategory[]; selectedId: string; status?: string; error?: string }>(), {
  status: "ready",
  error: "",
});
const emit = defineEmits<{ select: [id: string]; retry: [] }>();
const keyword = ref("");
const treeRef = ref<InstanceType<typeof ElTree> | null>(null);
/** @description 以显示名过滤树节点并保留祖先关系。 @param text 搜索词。 @param data 分类节点。 @returns 是否匹配。 */
function filterCategoryNode(text: string, data: unknown): boolean {
  if (!data || typeof data !== "object" || !("label" in data) || typeof data.label !== "string") return false;
  return data.label.toLocaleLowerCase().includes(text.trim().toLocaleLowerCase());
}
/** @description 只发出分类选择，不提供任何分类管理操作。 @param data 分类节点。 */
function selectCategoryNode(data: ObjectProfileEntityCategory): void {
  emit("select", data.id);
}
watch([keyword, () => props.items], () => treeRef.value?.filter(keyword.value), { flush: "post" });
</script>
<style scoped lang="scss">
.detail-categories {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
  padding: 16px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
  overflow: auto;
}
.detail-categories h3 {
  margin: 0;
  font-size: 16px;
}
</style>
