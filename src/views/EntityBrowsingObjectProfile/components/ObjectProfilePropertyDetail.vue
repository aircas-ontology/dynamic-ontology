<template>
  <section class="object-profile-property-detail" aria-label="实体属性详情">
    <header class="object-profile-property-detail__header">
      <h2>实体属性详情</h2>
      <p>{{ profile.displayName }} - 只读浏览</p>
    </header>

    <div v-if="profile.attributeGroups.length" class="object-profile-property-detail__groups">
      <article v-for="group in profile.attributeGroups" :key="group.id" class="object-profile-property-detail__group">
        <h3>{{ group.sectionTitle || group.label }}</h3>
        <el-table :data="tableRows(group.items)" stripe class="object-profile-property-detail__table">
          <el-table-column prop="label" label="属性名" min-width="160" />
          <el-table-column prop="value" label="属性值" min-width="240" />
        </el-table>
      </article>
    </div>
    <el-empty v-else description="暂无属性数据" />
  </section>
</template>

<script setup lang="ts">
import type {
  EntityBrowsingObjectProfileAttrChild,
  EntityBrowsingObjectProfileAttrItem,
  EntityBrowsingObjectProfileData,
} from "@/types";

defineProps<{
  profile: EntityBrowsingObjectProfileData;
}>();

function tableRows(items: EntityBrowsingObjectProfileAttrItem[]) {
  const rows: { label: string; value: string }[] = [];
  const walk = (nodes: EntityBrowsingObjectProfileAttrChild[], depth: number) => {
    for (const node of nodes) {
      rows.push({
        label: `${"  ".repeat(depth)}${node.label}`,
        value: node.value ?? "",
      });
      if (node.children?.length) walk(node.children, depth + 1);
    }
  };
  for (const item of items) {
    const value = item.lines?.length ? item.lines.join(" / ") : (item.value ?? "");
    rows.push({ label: item.label, value });
    if (item.children?.length) walk(item.children, 1);
  }
  return rows;
}
</script>

<style scoped lang="scss">
.object-profile-property-detail {
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.object-profile-property-detail__header h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.object-profile-property-detail__header p {
  margin: 4px 0 0;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.object-profile-property-detail__groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.object-profile-property-detail__group h3 {
  margin: 0 0 8px;
  color: var(--aircas-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.object-profile-property-detail__table {
  width: 100%;
}
</style>
