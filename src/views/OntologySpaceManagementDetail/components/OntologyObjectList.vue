<template>
  <section class="ontology-object-list" aria-label="本体对象列表">
    <header class="ontology-object-list__toolbar">
      <h1>本体空间总览</h1>
      <div class="ontology-object-list__toolbar-actions">
        <el-radio-group
          :model-value="viewMode"
          class="aircas-radio-group ontology-object-list__view-switch"
          ariaLabel="展示方式"
          @update:model-value="setObjectListViewMode"
        >
          <el-radio-button value="card">
            <svg class="ontology-object-list__view-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="8" height="8" rx="1.5" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" />
              <rect x="13" y="13" width="8" height="8" rx="1.5" />
            </svg>
            <span class="ontology-object-list__visually-hidden">卡片视图</span>
          </el-radio-button>
          <el-radio-button value="table">
            <svg class="ontology-object-list__view-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 9h18M3 14h18M9 9v11M15 9v11" />
            </svg>
            <span class="ontology-object-list__visually-hidden">列表视图</span>
          </el-radio-button>
        </el-radio-group>
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
              <button
                v-if="item.parentDisplayName && item.parentDisplayName !== '无'"
                class="ontology-object-card__parent"
                type="button"
                @click="emit('locateParent', item)"
              >
                父本体：{{ item.parentDisplayName }}
              </button>
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
                <el-button class="aircas-button ontology-object-action ontology-object-action--view" size="small" @click="emit('action', 'view', item)">
                  <svg class="ontology-object-action__icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  详情
                </el-button>
                <el-button class="aircas-button ontology-object-action ontology-object-action--edit" size="small" @click="emit('action', 'edit', item)">
                  <svg class="ontology-object-action__icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20z" />
                    <path d="M12.5 7l4.5 4.5" />
                  </svg>
                  编辑
                </el-button>
                <el-button class="aircas-button ontology-object-action ontology-object-action--export" size="small" @click="emit('action', 'export', item)">
                  <svg class="ontology-object-action__icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 4v10M8 10l4 4 4-4" />
                    <path d="M5 18h14" />
                  </svg>
                  导出
                </el-button>
                <el-button
                  class="aircas-button ontology-object-action ontology-object-action--delete"
                  size="small"
                  type="danger"
                  @click="emit('action', 'delete', item)"
                >
                  <svg class="ontology-object-action__icon ontology-object-action__icon--filled" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.8 3.6h6.4l.9 2.4H20.2v2.2H3.8V6h4.1L8.8 3.6z" />
                    <path d="M6.6 9.2h10.8l-.95 10.5c-.12.95-.9 1.6-1.85 1.6H9.35c-.95 0-1.73-.65-1.85-1.6L6.6 9.2z" />
                  </svg>
                  删除
                </el-button>
              </footer>
            </div>
          </article>
        </div>

        <div v-else class="ontology-object-section__table">
          <el-table class="aircas-table aircas-table--flat" :data="section.items" row-key="id" height="100%" stripe>
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
            <el-table-column label="操作" width="300" fixed="right">
              <template #default="{ row }">
                <el-button
                  class="aircas-button ontology-object-action ontology-object-action--view aircas-button--tone-primary"
                  size="small"
                  @click="emit('action', 'view', objectRow(row))"
                  >详情</el-button
                >
                <el-button
                  class="aircas-button ontology-object-action ontology-object-action--edit aircas-button--tone-secondary"
                  size="small"
                  @click="emit('action', 'edit', objectRow(row))"
                  >编辑</el-button
                >
                <el-button
                  class="aircas-button ontology-object-action ontology-object-action--export aircas-button--tone-ghost"
                  size="small"
                  @click="emit('action', 'export', objectRow(row))"
                  >导出</el-button
                >
                <el-button
                  class="aircas-button ontology-object-action ontology-object-action--delete aircas-button--tone-danger"
                  size="small"
                  type="danger"
                  @click="emit('action', 'delete', objectRow(row))"
                  >删除</el-button
                >
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
import { Connection, DataLine, Plus, Share, Ship } from "@element-plus/icons-vue";
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

/**
 * @description 仅接受卡片或列表视图值，并通知父组件切换对象展示方式。
 * @param value 视图切换控件提交的未知值。
 */
function setObjectListViewMode(value: unknown) {
  if (value === "card" || value === "table") emit("update:viewMode", value);
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
  padding: 8px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}
.ontology-object-list__toolbar h1 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}
.ontology-object-list__toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ontology-object-list__view-switch {
  display: inline-flex;
  gap: 4px;
}
.ontology-object-list__view-switch.aircas-radio-group :deep(.el-radio-button__inner),
.ontology-object-list__view-switch.aircas-radio-group :deep(.el-radio-button:first-child .el-radio-button__inner),
.ontology-object-list__view-switch.aircas-radio-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  outline: none;
  box-shadow: none;
  background-color: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-primary);
}
.ontology-object-list__view-switch.aircas-radio-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-active-background);
  color: var(--aircas-color-text-primary);
  box-shadow: 0 0 10px var(--aircas-color-accent-cyan-soft);
}
.ontology-object-list__view-icon {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
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
  background: linear-gradient(180deg, var(--aircas-color-section-background), var(--aircas-color-overlay-deep));
  box-shadow: inset 0 0 24px var(--aircas-color-page-glow);
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
  background: linear-gradient(90deg, var(--aircas-color-section-header), var(--aircas-color-panel-background-deep));
}
.ontology-object-section__header i {
  width: 3px;
  height: 16px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--aircas-color-accent-cyan), var(--aircas-color-accent-purple));
  box-shadow: 0 0 8px var(--aircas-color-accent-cyan-shadow);
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
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 999px;
  background: var(--aircas-color-accent-cyan-soft);
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
  position: relative;
  display: grid;
  min-width: 0;
  grid-template-columns: 96px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-card-background);
  box-shadow: inset 0 0 20px var(--aircas-color-page-glow);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.ontology-object-card::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 1;
  height: 2px;
  content: "";
  background: linear-gradient(90deg, var(--aircas-color-accent-cyan), var(--aircas-color-accent-blue), var(--aircas-color-accent-purple));
  opacity: 0.75;
}

.ontology-object-card:hover {
  border-color: var(--aircas-color-accent-cyan);
  box-shadow:
    0 0 18px var(--aircas-color-accent-cyan-shadow),
    inset 0 0 20px var(--aircas-color-page-glow);
}

.ontology-object-card__visual {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--aircas-color-accent-cyan);
  background: radial-gradient(circle at 50% 40%, var(--aircas-color-accent-cyan-soft), var(--aircas-color-transparent) 58%), var(--aircas-color-section-header);
}

.ontology-object-card__visual::after {
  position: absolute;
  inset: 18% 12%;
  border-radius: 50%;
  content: "";
  background: radial-gradient(circle, var(--aircas-color-accent-blue-soft), var(--aircas-color-transparent) 70%);
  pointer-events: none;
}

.ontology-object-card__visual img,
.ontology-object-card__visual .el-icon {
  position: relative;
  z-index: 1;
}

.ontology-object-card__visual img {
  width: 90%;
  height: 90%;
  object-fit: contain;
  filter: drop-shadow(0 0 10px var(--aircas-color-accent-cyan-shadow));
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

.ontology-object-card dl > div:nth-child(1) .el-icon {
  color: var(--aircas-color-accent-blue);
}

.ontology-object-card dl > div:nth-child(2) .el-icon {
  color: var(--aircas-color-accent-purple);
}

.ontology-object-card dl > div:nth-child(3) .el-icon {
  color: var(--aircas-color-accent-cyan);
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
  overflow: hidden;
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ontology-object-card__actions .ontology-object-action.aircas-button.el-button {
  height: 28px;
  padding: 0 5px;
}

.ontology-object-action__icon {
  width: 12px;
  height: 12px;
  margin-right: 3px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ontology-object-action__icon--filled {
  fill: currentColor;
  stroke: none;
}

.ontology-object-card__actions
  .ontology-object-action.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(
    .el-button--info
  ) {
  border-style: solid;
}

.ontology-object-card__actions
  .ontology-object-action--view.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(
    .el-button--info
  ) {
  color: var(--aircas-color-text-primary);
  border-color: var(--aircas-color-accent-cyan);
  background: linear-gradient(90deg, var(--aircas-color-active-background), var(--aircas-color-accent-blue-fill));
  box-shadow:
    inset 0 0 14px var(--aircas-color-accent-cyan-fill),
    0 0 10px var(--aircas-color-accent-cyan-soft);
}

.ontology-object-card__actions
  .ontology-object-action--view.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(
    .el-button--info
  ):hover,
.ontology-object-card__actions
  .ontology-object-action--view.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(
    .el-button--info
  ):focus,
.ontology-object-card__actions
  .ontology-object-action--view.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(
    .el-button--info
  ):focus-visible {
  color: var(--aircas-color-text-primary);
  border-color: var(--aircas-color-accent-cyan);
  background: linear-gradient(90deg, var(--aircas-color-hover-background), var(--aircas-color-accent-cyan-soft));
  box-shadow: 0 0 14px var(--aircas-color-accent-cyan-shadow);
}

.ontology-object-card__actions
  .ontology-object-action--edit.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(
    .el-button--info
  ) {
  color: var(--aircas-color-accent-blue);
  border-color: var(--aircas-color-accent-blue-border);
  background: var(--aircas-color-accent-blue-soft);
  box-shadow: none;
}

.ontology-object-card__actions
  .ontology-object-action--edit.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(
    .el-button--info
  ):hover,
.ontology-object-card__actions
  .ontology-object-action--edit.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(
    .el-button--info
  ):focus,
.ontology-object-card__actions
  .ontology-object-action--edit.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(
    .el-button--info
  ):focus-visible {
  color: var(--aircas-color-text-primary);
  border-color: var(--aircas-color-accent-blue);
  background: var(--aircas-color-accent-blue-fill);
}

.ontology-object-card__actions
  .ontology-object-action--export.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(
    .el-button--danger
  ):not(.el-button--info) {
  color: var(--aircas-color-text-secondary);
  border-color: var(--aircas-color-border);
  background: var(--aircas-color-overlay-deep);
  box-shadow: none;
}

.ontology-object-card__actions
  .ontology-object-action--export.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(
    .el-button--danger
  ):not(.el-button--info):hover,
.ontology-object-card__actions
  .ontology-object-action--export.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(
    .el-button--danger
  ):not(.el-button--info):focus,
.ontology-object-card__actions
  .ontology-object-action--export.aircas-button.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(
    .el-button--danger
  ):not(.el-button--info):focus-visible {
  color: var(--aircas-color-text-primary);
  border-color: var(--aircas-color-border-highlight);
  background: var(--aircas-color-overlay-deep);
  box-shadow: 0 0 10px var(--aircas-color-accent-blue-soft);
}

.ontology-object-card__actions .ontology-object-action--delete.aircas-button.el-button.el-button--danger {
  color: var(--aircas-color-danger);
  border-color: var(--aircas-color-danger);
  background: var(--aircas-color-danger-background);
  box-shadow: inset 0 0 12px var(--aircas-color-danger-background);
}

.ontology-object-card__actions .ontology-object-action--delete.aircas-button.el-button.el-button--danger:hover,
.ontology-object-card__actions .ontology-object-action--delete.aircas-button.el-button.el-button--danger:focus,
.ontology-object-card__actions .ontology-object-action--delete.aircas-button.el-button.el-button--danger:focus-visible {
  color: var(--aircas-color-danger);
  border-color: var(--aircas-color-danger);
  background: color-mix(in srgb, var(--aircas-color-danger) 32%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--aircas-color-danger) 35%, transparent);
}
.ontology-object-section__table {
  height: min(420px, 48vh);
  min-height: 240px;
  padding: 8px;
}
.ontology-object-section__table .el-button {
  white-space: nowrap;
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
