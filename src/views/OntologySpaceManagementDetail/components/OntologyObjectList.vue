<template>
  <section class="ontology-object-list" aria-label="本体对象列表">
    <header class="ontology-object-list__toolbar">
      <h1>本体空间总览</h1>
      <div class="ontology-object-list__toolbar-actions">
        <div class="ontology-object-list__view-switch" role="group" aria-label="展示方式">
          <el-button class="aircas-button" :type="viewMode === 'card' ? 'primary' : 'default'" @click="emit('update:viewMode', 'card')"
            ><el-icon><Grid /></el-icon><span class="ontology-object-list__visually-hidden">卡片视图</span></el-button
          >
          <el-button class="aircas-button" :type="viewMode === 'table' ? 'primary' : 'default'" @click="emit('update:viewMode', 'table')"
            ><el-icon><List /></el-icon><span class="ontology-object-list__visually-hidden">列表视图</span></el-button
          >
        </div>
        <el-button class="aircas-button" type="primary" @click="emit('action', 'create')"
          ><el-icon><Plus /></el-icon>新建本体</el-button
        >
      </div>
    </header>

    <main ref="scrollContainer" class="ontology-object-list__content">
      <section
        v-for="section in sections"
        :key="section.categoryId"
        class="ontology-object-section"
        :class="{ 'is-active': activeCategoryId === section.categoryId }"
        :id="categoryAnchorId(section.categoryId)"
      >
        <header class="ontology-object-section__header">
          <i aria-hidden="true"></i>
          <h2>{{ section.name }}</h2>
          <span>{{ section.items.length }} 个本体</span>
        </header>

        <div v-if="viewMode === 'card'" class="ontology-object-section__cards">
          <article v-for="item in section.items" :key="item.id" class="ontology-object-card">
            <div class="ontology-object-card__visual">
              <img v-if="item.iconUrl" :src="item.iconUrl" alt="" />
              <el-icon v-else><Ship /></el-icon>
            </div>
            <div class="ontology-object-card__body">
              <header class="ontology-object-card__title">
                <strong :title="item.displayName">{{ item.displayName }}</strong>
                <small :title="item.apiName">{{ item.apiName }}</small>
              </header>
              <button class="ontology-object-card__parent" type="button" @click="emit('locateParent', item)">父本体：{{ item.parentDisplayName }}</button>
              <p>创建时间 {{ item.createdAt }}</p>
              <dl>
                <div>
                  <dt>
                    <el-icon><DataLine /></el-icon>属性
                  </dt>
                  <dd>{{ item.metrics.attribute }}</dd>
                </div>
                <div>
                  <dt>
                    <el-icon><Share /></el-icon>关系
                  </dt>
                  <dd>{{ item.metrics.relation.toLocaleString("zh-CN") }}</dd>
                </div>
                <div>
                  <dt>
                    <el-icon><Connection /></el-icon>行为
                  </dt>
                  <dd>{{ item.metrics.behavior }}</dd>
                </div>
              </dl>
              <footer class="ontology-object-card__actions">
                <el-button class="aircas-button" size="small" @click="emit('action', 'view', item)"
                  ><el-icon><View /></el-icon>详情</el-button
                >
                <el-button class="aircas-button" size="small" @click="emit('action', 'edit', item)"
                  ><el-icon><EditPen /></el-icon>编辑</el-button
                >
                <el-button class="aircas-button" size="small" @click="emit('action', 'export', item)"
                  ><el-icon><Download /></el-icon>导出</el-button
                >
                <el-button class="aircas-button" size="small" type="danger" @click="emit('action', 'delete', item)"
                  ><el-icon><Delete /></el-icon>删除</el-button
                >
              </footer>
            </div>
          </article>
        </div>

        <div v-else class="ontology-object-section__table">
          <el-table class="aircas-table aircas-table--flat" :data="section.items" row-key="id" height="100%">
            <el-table-column label="本体名称" min-width="220">
              <template #default="{ row }"
                ><strong>{{ objectRow(row).displayName }}</strong
                ><small class="ontology-object-table__api">{{ objectRow(row).apiName }}</small></template
              >
            </el-table-column>
            <el-table-column prop="parentDisplayName" label="父本体" min-width="120" />
            <el-table-column prop="createdAt" label="创建时间" width="170" />
            <el-table-column label="属性" width="80"
              ><template #default="{ row }">{{ objectRow(row).metrics.attribute }}</template></el-table-column
            >
            <el-table-column label="关系" width="110"
              ><template #default="{ row }">{{ objectRow(row).metrics.relation.toLocaleString("zh-CN") }}</template></el-table-column
            >
            <el-table-column label="行为" width="80"
              ><template #default="{ row }">{{ objectRow(row).metrics.behavior }}</template></el-table-column
            >
            <el-table-column label="操作" width="250" fixed="right">
              <template #default="{ row }">
                <el-button class="aircas-button" size="small" @click="emit('action', 'view', objectRow(row))">详情</el-button>
                <el-button class="aircas-button" size="small" @click="emit('action', 'edit', objectRow(row))">编辑</el-button>
                <el-button class="aircas-button" size="small" @click="emit('action', 'export', objectRow(row))">导出</el-button>
                <el-button class="aircas-button" size="small" type="danger" @click="emit('action', 'delete', objectRow(row))">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { Connection, DataLine, Delete, Download, EditPen, Grid, List, Plus, Share, Ship, View } from "@element-plus/icons-vue";
import type { OntologyObjectItem, OntologyObjectLocationTarget, OntologyObjectSection, OntologyObjectViewMode } from "@/types";

const props = defineProps<{
  sections: OntologyObjectSection[];
  viewMode: OntologyObjectViewMode;
  locationTarget: OntologyObjectLocationTarget | null;
}>();

const emit = defineEmits<{
  "update:viewMode": [mode: OntologyObjectViewMode];
  action: [action: string, item?: OntologyObjectItem];
  locateParent: [item: OntologyObjectItem];
}>();

const scrollContainer = ref<HTMLElement | null>(null);
const activeCategoryId = ref("");
let highlightTimer: number | undefined;

function objectRow(row: unknown): OntologyObjectItem {
  if (row && typeof row === "object" && "id" in row) {
    for (const section of props.sections) {
      const item = section.items.find((candidate) => candidate.id === row.id);
      if (item) return item;
    }
  }
  throw new Error("无效的本体对象数据行。");
}

function categoryAnchorId(categoryId: string) {
  return `ontology-category-${categoryId}`;
}

async function locateCategory(target: OntologyObjectLocationTarget | null) {
  if (!target) return;
  await nextTick();
  const section = Array.from(scrollContainer.value?.querySelectorAll<HTMLElement>("[id^='ontology-category-']") ?? []).find(
    (element) => element.id === categoryAnchorId(target.categoryId),
  );
  if (!section) return;
  section.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  activeCategoryId.value = target.categoryId;
  if (highlightTimer) window.clearTimeout(highlightTimer);
  highlightTimer = window.setTimeout(() => {
    activeCategoryId.value = "";
  }, 1600);
}

watch(
  () => props.locationTarget?.requestId,
  () => void locateCategory(props.locationTarget),
);
onBeforeUnmount(() => {
  if (highlightTimer) window.clearTimeout(highlightTimer);
});
</script>

<style scoped lang="scss">
.ontology-object-list {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 10px;
}
.ontology-object-list__toolbar {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.ontology-object-list__toolbar h1 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}
.ontology-object-list__toolbar-actions,
.ontology-object-list__view-switch {
  display: flex;
  align-items: center;
  gap: 4px;
}
.ontology-object-list__view-switch .el-button {
  width: 32px;
  padding: 0;
}
.ontology-object-list__visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.ontology-object-list__content {
  display: flex;
  min-height: 0;
  padding-right: 3px;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  overflow-x: hidden;
  overflow-y: auto;
  scroll-behavior: smooth;
}
.ontology-object-section {
  min-width: 0;
  flex: 0 0 auto;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.ontology-object-section.is-active {
  border-color: var(--aircas-color-accent-cyan);
  box-shadow: 0 0 12px var(--aircas-color-accent-cyan-fill);
}
.ontology-object-section__header {
  display: flex;
  height: 36px;
  padding: 0 12px;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--aircas-color-border-soft);
  background: var(--aircas-color-panel-background-deep);
}
.ontology-object-section__header i {
  width: 3px;
  height: 16px;
  border-radius: 2px;
  background: var(--aircas-color-accent-cyan);
}
.ontology-object-section__header h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 15px;
  font-weight: 600;
}
.ontology-object-section__header span {
  margin-left: auto;
  padding: 1px 8px;
  border: 1px solid var(--aircas-color-border-highlight);
  border-radius: 999px;
  color: var(--aircas-color-accent-cyan);
  font-size: 12px;
}
.ontology-object-section__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 8px;
  padding: 8px;
}
.ontology-object-card {
  display: grid;
  min-width: 0;
  grid-template-columns: 96px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-card-background);
}
.ontology-object-card__visual {
  display: grid;
  place-items: center;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-panel-background-deep);
}
.ontology-object-card__visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ontology-object-card__visual .el-icon {
  font-size: 52px;
}
.ontology-object-card__body {
  display: flex;
  min-width: 0;
  padding: 10px;
  flex-direction: column;
  gap: 6px;
}
.ontology-object-card__title {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 8px;
}
.ontology-object-card__title strong,
.ontology-object-card__title small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ontology-object-card__title strong {
  color: var(--aircas-color-text-primary);
  font-size: 14px;
}
.ontology-object-card__title small {
  color: var(--aircas-color-text-muted);
}
.ontology-object-card__parent {
  align-self: flex-start;
  max-width: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: var(--aircas-color-accent-cyan);
  font: inherit;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.ontology-object-card__parent:focus-visible {
  outline: 2px solid var(--aircas-color-accent-cyan);
  outline-offset: 2px;
}
.ontology-object-card__body > p {
  margin: 0;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
.ontology-object-card dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  text-align: center;
}
.ontology-object-card dt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.ontology-object-card dd {
  margin: 4px 0 0;
  color: var(--aircas-color-text-primary);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.ontology-object-card__actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  margin-top: 4px;
}
.ontology-object-card__actions .el-button {
  min-width: 0;
  margin: 0;
  padding: 0 5px;
}
.ontology-object-section__table {
  height: min(420px, 48vh);
  min-height: 240px;
  padding: 8px;
}
.ontology-object-table__api {
  display: block;
  margin-top: 3px;
  color: var(--aircas-color-text-muted);
}

@media (max-width: 700px) {
  .ontology-object-list__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .ontology-object-list__toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }
  .ontology-object-section__cards {
    grid-template-columns: 1fr;
  }
  .ontology-object-card {
    grid-template-columns: 72px minmax(0, 1fr);
  }
}
</style>
