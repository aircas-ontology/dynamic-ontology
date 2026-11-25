<template>
  <section class="implicit-relations">
    <div class="implicit-relations__summary">
      <article v-for="card in summaries" :key="card.key" class="implicit-summary" :class="`implicit-summary--${card.tone}`">
        <header>
          <h3>{{ card.label }}</h3>
          <el-icon :size="16"><component :is="summaryIcons[card.key]" /></el-icon>
        </header>
        <strong
          >{{ card.count }}<small>{{ card.unit }}</small></strong
        >
        <p>{{ card.description }}</p>
      </article>
    </div>

    <section class="implicit-relations__panel">
      <header class="implicit-relations__toolbar">
        <div class="implicit-relations__tabs" role="tablist" aria-label="隐含关系视图">
          <button type="button" class="active" role="tab" aria-selected="true">
            <el-icon :size="14"><Connection /></el-icon>关系发现
          </button>
          <button type="button" role="tab" aria-selected="false">
            <el-icon :size="14"><Document /></el-icon>关系数据
          </button>
        </div>
        <div class="implicit-relations__actions">
          <el-input class="implicit-relations__search" :prefix-icon="Search" placeholder="搜索起始节点名称、编号或关联类型" />
          <el-button plain :icon="Plus" @click="openCreateDialog">发现隐含关系</el-button>
        </div>
      </header>

      <div class="implicit-relations__table-wrap">
        <el-table class="aircas-table--accent-header implicit-relations__table" height="100%" :data="pagedTasks" stripe>
          <el-table-column label="起始节点" min-width="110">
            <template #default="{ row }">
              <div class="implicit-node">
                <span class="implicit-node__marker" aria-hidden="true"></span>
                <span class="implicit-node__name" :title="row.nodeName">{{ row.nodeName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="所属空间" min-width="86" prop="spaceName" />
          <el-table-column label="关联类型" min-width="96">
            <template #default="{ row }">
              <div class="implicit-types">
                <span v-for="type in row.relationTypes" :key="type" class="implicit-type">{{ type }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="关联跳数" min-width="72">
            <template #default="{ row }">
              <span class="implicit-hops">{{ formatHops(row.hops) }}<small>跳</small></span>
            </template>
          </el-table-column>
          <el-table-column label="进度" min-width="62">
            <template #default="{ row }">
              <span class="implicit-progress" :class="{ 'implicit-progress--muted': row.progress === '未发现' }">{{ row.progress }}</span>
            </template>
          </el-table-column>
          <el-table-column label="隐含关系数" min-width="72" prop="implicitCount" />
          <el-table-column label="更新时间" min-width="118" prop="updatedAt" />
          <el-table-column label="操作" min-width="178">
            <template #default="{ row }">
              <div class="implicit-actions">
                <el-button size="small" plain :icon="CircleCheck" @click="openVerificationDialog(row)">校验</el-button>
                <el-button size="small" plain :icon="Tickets">特征参数</el-button>
                <el-button size="small" type="danger" plain :icon="Delete">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <footer class="implicit-relations__footer">
        <span>共 {{ tasks.length }} 条</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10]"
          :total="tasks.length"
          layout="prev, pager, next, sizes"
        />
      </footer>
    </section>

    <ImplicitRelationCreateDialog v-model:visible="createVisible" :nodes="nodeOptions" @create="addImplicitRelation" />
    <ImplicitRelationVerifyDialog v-model:visible="verifyVisible" :task="verifyTask" :rows="verifyRows" />
  </section>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import type { Component } from "vue";
import { CircleCheck, CircleClose, Connection, Delete, Document, Monitor, Plus, Search, Share, Tickets } from "@element-plus/icons-vue";
import type { ImplicitRelationSummaryCard, ImplicitRelationTask, ImplicitRelationVerificationRow } from "@/types";
import { implicitRelationTasks, implicitRelationVerifications } from "@/mocks/implicitRelationsMock/implicitRelationsMock";
import ImplicitRelationCreateDialog from "./components/ImplicitRelationCreateDialog.vue";
import ImplicitRelationVerifyDialog from "./components/ImplicitRelationVerifyDialog.vue";
import type { ImplicitRelationNodeOption, ValidatedImplicitRelation } from "./utils/implicitRelationDraft";
import { summarizeImplicitRelations } from "./utils/implicitRelationSummary";

const tasks = ref<ImplicitRelationTask[]>([...implicitRelationTasks]);
const currentPage = ref(1);
const pageSize = ref(10);
const createVisible = ref(false);
const verifyVisible = ref(false);
const verifyTask = ref<ImplicitRelationTask | null>(null);
const verifyRows = ref<ImplicitRelationVerificationRow[]>([]);
const summaries = computed(() => summarizeImplicitRelations(tasks.value));
const pagedTasks = computed(() => tasks.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value));
const nodeOptions = computed<ImplicitRelationNodeOption[]>(() => {
  const seen = new Set<string>();
  const options: ImplicitRelationNodeOption[] = [];
  for (const task of tasks.value) {
    const key = `${task.spaceName}/${task.nodeName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ spaceName: task.spaceName, nodeName: task.nodeName });
  }
  return options;
});
const summaryIcons: Record<ImplicitRelationSummaryCard["key"], Component> = {
  tasks: Monitor,
  discovered: Share,
  pending: Search,
  saved: CircleCheck,
  ignored: CircleClose,
};

/** @description 打开新增隐含关系弹窗。 */
function openCreateDialog(): void {
  createVisible.value = true;
}

/**
 * @description 打开隐含关系校验弹窗并载入当前任务的校验记录。
 * @param row 列表当前行。
 */
function openVerificationDialog(row: unknown): void {
  const task = tasks.value.find((item) => item === row);
  if (!task) return;
  verifyTask.value = task;
  verifyRows.value = implicitRelationVerifications[task.id] ?? [];
  verifyVisible.value = true;
}

/**
 * @description 将当前时间格式化为「YYYY-MM-DD HH:mm」。
 * @returns 格式化后的时间文本。
 */
function formatCurrentTime(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * @description 将新增隐含关系插入任务列表首位并回到第一页。
 * @param value 校验通过的新增隐含关系数据。
 */
function addImplicitRelation(value: ValidatedImplicitRelation): void {
  tasks.value.unshift({
    id: `implicit-${Date.now()}`,
    nodeName: value.nodeName,
    spaceName: value.spaceName,
    relationTypes: [value.relationType],
    hops: value.hops,
    progress: "已完成",
    implicitCount: 0,
    updatedAt: formatCurrentTime(),
  });
  currentPage.value = 1;
  createVisible.value = false;
}

/**
 * @description 将关联跳数格式化为顿号连接的文本。
 * @param hops 跳数列表。
 * @returns 跳数文本，如「1、2」。
 */
function formatHops(hops: number[]): string {
  return hops.join("、");
}
</script>
<style scoped lang="scss">
.implicit-relations {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
}
.implicit-relations__summary {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}
.implicit-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px 12px;
  border: 0;
  border-top: 2px solid var(--summary-tone);
  border-radius: 4px;
  background: var(--aircas-color-panel-background);
}
.implicit-summary--cyan {
  --summary-tone: var(--aircas-color-accent-cyan);
}
.implicit-summary--purple {
  --summary-tone: var(--aircas-color-accent-purple);
}
.implicit-summary--orange {
  --summary-tone: var(--aircas-color-accent-orange);
}
.implicit-summary--green {
  --summary-tone: var(--aircas-color-accent-green);
}
.implicit-summary--gray {
  --summary-tone: var(--aircas-color-text-secondary);
}
.implicit-summary header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  color: var(--summary-tone);
}
.implicit-summary header h3 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 500;
}
.implicit-summary strong {
  color: var(--aircas-color-text-primary);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}
.implicit-summary strong small {
  margin-left: 3px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  font-weight: 400;
}
.implicit-summary p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.implicit-relations__panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 14px 10px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background);
}
.implicit-relations__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--aircas-color-border);
}
.implicit-relations__tabs {
  display: flex;
  gap: 20px;
}
.implicit-relations__tabs button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 2px 10px;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  font-size: 14px;
  cursor: pointer;
}
.implicit-relations__tabs button.active {
  border-bottom-color: var(--aircas-color-accent-cyan);
  color: var(--aircas-color-accent-cyan);
}
.implicit-relations__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.implicit-relations__search {
  width: 300px;
}
.implicit-relations__table-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.implicit-relations__table {
  width: 100%;
}
.implicit-relations__table :deep(th.el-table__cell) {
  font-size: 12px;
  font-weight: 600;
}
.implicit-relations__table :deep(.el-table__cell) {
  padding: 6px 0;
  font-size: 12px;
}
.implicit-node {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}
.implicit-node__marker {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border: 1px solid var(--aircas-color-accent-cyan);
  border-radius: 50%;
}
.implicit-node__name {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.implicit-types {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.implicit-type {
  padding: 1px 6px;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 3px;
  color: var(--aircas-color-accent-cyan);
  font-size: 11px;
  white-space: nowrap;
}
.implicit-hops {
  font-size: 12px;
}
.implicit-hops small {
  margin-left: 3px;
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
}
.implicit-progress {
  color: var(--aircas-color-accent-green);
  font-size: 12px;
}
.implicit-progress--muted {
  color: var(--aircas-color-text-secondary);
}
.implicit-actions {
  display: flex;
  gap: 3px;
}
.implicit-actions :deep(.el-button) {
  margin-left: 0;
  padding: 3px 4px;
  font-size: 11px;
}
.implicit-relations__footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
@media (max-width: 1100px) {
  .implicit-relations__summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
