<template>
  <section class="event-themes">
    <div class="event-themes__summary">
      <article v-for="item in summaries" :key="item.category" class="event-theme-summary">
        <header class="event-theme-summary__header">
          <h3>{{ item.category }}</h3>
          <el-icon :size="15"><Grid /></el-icon>
        </header>
        <strong class="event-theme-summary__count">{{ item.count }}</strong>
        <div class="event-theme-summary__ratio">
          <span>占全部事件主题</span>
          <span>{{ item.percent }}%</span>
        </div>
        <div class="event-theme-summary__bar" aria-hidden="true">
          <span :style="{ width: `${item.percent}%` }"></span>
        </div>
      </article>
    </div>

    <section class="event-themes__panel">
      <header class="event-themes__toolbar">
        <h2 class="event-themes__title">
          <el-icon :size="16"><Grid /></el-icon>事件主题列表
        </h2>
        <div class="event-themes__actions">
          <el-input class="event-themes__search" :prefix-icon="Search" placeholder="搜索事件主题名称、类别、区域" />
          <div class="event-themes__view-toggle" role="group" aria-label="视图切换">
            <button
              type="button"
              class="event-themes__view-button"
              :class="{ 'event-themes__view-button--active': viewMode === 'card' }"
              aria-label="卡片视图"
              :aria-pressed="viewMode === 'card'"
              @click="viewMode = 'card'"
            >
              <el-icon :size="15"><Grid /></el-icon>
            </button>
            <button
              type="button"
              class="event-themes__view-button"
              :class="{ 'event-themes__view-button--active': viewMode === 'list' }"
              aria-label="列表视图"
              :aria-pressed="viewMode === 'list'"
              @click="viewMode = 'list'"
            >
              <el-icon :size="15"><List /></el-icon>
            </button>
          </div>
          <el-button plain @click="createVisible = true">＋ 新增事件主题</el-button>
        </div>
      </header>

      <div v-if="viewMode === 'list'" class="event-themes__table-wrap">
        <el-table class="aircas-table--accent-header event-themes__table" height="100%" :data="pagedThemes" stripe>
          <el-table-column label="事件主题名称" min-width="180">
            <template #default="{ row }">
              <div class="event-theme-name">
                <span class="event-theme-name__marker" aria-hidden="true"></span>
                <span class="event-theme-name__text" :title="row.name">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="事件主题类别" width="112">
            <template #default="{ row }">
              <span class="event-theme-category">{{ row.category }}</span>
            </template>
          </el-table-column>
          <el-table-column label="时间窗口" width="164">
            <template #default="{ row }">
              <div class="event-theme-time">
                <span>{{ row.startTime }}</span>
                <span>至 {{ row.endTime }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="地理区域" width="120" prop="region" />
          <el-table-column label="区域点位" min-width="172">
            <template #default="{ row }">
              <span class="event-theme-ellipsis" :title="formatRegionPoints(row.points)">{{ formatRegionPoints(row.points) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="事件主题描述" min-width="200">
            <template #default="{ row }">
              <span class="event-theme-ellipsis" :title="row.description">{{ row.description }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="268">
            <template #default="{ row }">
              <div class="event-theme-actions">
                <el-button size="small" plain :icon="View" @click="enterEventTheme(row.id)">查看</el-button>
                <el-button size="small" plain :icon="Edit">编辑</el-button>
                <el-button size="small" plain :icon="Download">导出</el-button>
                <el-button size="small" type="danger" plain :icon="Delete">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else class="event-themes__cards">
        <article v-for="theme in pagedThemes" :key="theme.id" class="event-theme-card">
          <h3 class="event-theme-card__title" :title="theme.name">{{ theme.name }}</h3>
          <p class="event-theme-card__type">
            事件主题类型：<span>{{ theme.category }}</span>
          </p>
          <p class="event-theme-card__desc" :title="theme.description">{{ theme.description }}</p>
          <div class="event-theme-card__meta">
            <span class="event-theme-card__time" :title="`${theme.startTime} 至 ${theme.endTime}`"> 时间窗口 {{ theme.startTime }} ... </span>
            <span class="event-theme-card__region">地理区域 {{ theme.region }}</span>
          </div>
          <div class="event-theme-card__divider" aria-hidden="true"></div>
          <p class="event-theme-card__updated">更新 {{ theme.updatedAt }}</p>
          <div class="event-theme-card__actions">
            <el-button size="small" plain :icon="View" @click="enterEventTheme(theme.id)">查看</el-button>
            <el-button size="small" plain :icon="Edit">编辑</el-button>
            <el-dropdown trigger="click" placement="bottom-start">
              <el-button size="small" plain>
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="Download">导出</el-dropdown-item>
                  <el-dropdown-item :icon="Delete" :style="{ color: 'var(--aircas-color-danger)' }">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </article>
      </div>

      <footer class="event-themes__footer">
        <span>共 {{ eventThemes.length }} 条</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10]"
          :total="eventThemes.length"
          layout="prev, pager, next, sizes"
        />
      </footer>

      <EventThemeCreateDialog v-model:visible="createVisible" @create="addEventTheme" />
    </section>
  </section>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowDown, Delete, Download, Edit, Grid, List, Search, View } from "@element-plus/icons-vue";
import type { IntelligenceEventTheme } from "@/types";
import { intelligenceEventThemes } from "@/mocks/intelligenceEventThemesMock/intelligenceEventThemesMock";
import EventThemeCreateDialog from "./components/EventThemeCreateDialog.vue";
import type { EventThemeDraft } from "./utils/eventThemeDraft";
import { summarizeEventThemes } from "./utils/eventThemeSummary";

const router = useRouter();
const pageSize = ref(10);
const currentPage = ref(1);
const viewMode = ref<"list" | "card">("list");
const createVisible = ref(false);
const eventThemes = ref<IntelligenceEventTheme[]>([...intelligenceEventThemes]);
const summaries = computed(() => summarizeEventThemes(eventThemes.value));
const pagedThemes = computed(() => eventThemes.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value));

/**
 * @description 携带事件主题标识进入主题态势展示页。
 * @param themeId 事件主题标识。
 */
function enterEventTheme(themeId: string): void {
  void router.push({ name: "IntelligenceEventDisplay", query: { themeId } });
}

/**
 * @description 将时间格式化为列表展示用的「年-月-日 时:分」。
 * @param date 需要格式化的时间。
 * @returns 本地时间文本。
 */
function formatUpdatedAt(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * @description 将弹窗确认的事件主题草稿加入列表并回到第一页。
 * @param draft 已校验的事件主题草稿。
 */
function addEventTheme(draft: EventThemeDraft): void {
  if (!draft.category) return;
  const now = new Date();
  eventThemes.value.unshift({
    id: `event-theme-${now.getTime()}`,
    name: draft.name.trim(),
    category: draft.category,
    startTime: draft.startTime,
    endTime: draft.endTime,
    region: draft.region,
    points: draft.points,
    description: draft.description.trim(),
    updatedAt: formatUpdatedAt(now),
  });
  currentPage.value = 1;
  createVisible.value = false;
}

/**
 * @description 将区域点位格式化为原型中的方括号经纬度串。
 * @param points 区域点位列表。
 * @returns 以顿号连接的点位文本。
 */
function formatRegionPoints(points: [number, number][]): string {
  return points.map(([longitude, latitude]) => `[${longitude.toFixed(2)}, ${latitude.toFixed(2)}]`).join("、");
}
</script>
<style scoped lang="scss">
.event-themes {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
}
.event-themes__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.event-theme-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background);
}
.event-theme-summary__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--aircas-color-text-secondary);
}
.event-theme-summary__header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}
.event-theme-summary__count {
  color: var(--aircas-color-text-primary);
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
}
.event-theme-summary__ratio {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.event-theme-summary__bar {
  height: 3px;
  border-radius: 2px;
  background: var(--aircas-color-border-light);
}
.event-theme-summary__bar span {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--aircas-color-primary);
}
.event-themes__panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 12px 14px 10px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background);
}
.event-themes__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}
.event-themes__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 15px;
  font-weight: 600;
}
.event-themes__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.event-themes__search {
  width: 300px;
}
.event-themes__view-toggle {
  display: flex;
  gap: 6px;
}
.event-themes__view-button {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  background: transparent;
  color: var(--aircas-color-text-secondary);
  cursor: pointer;
}
.event-themes__view-button--active {
  border-color: var(--aircas-color-primary);
  background: var(--aircas-color-accent-cyan-soft);
  color: var(--aircas-color-primary);
}
.event-themes__table-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.event-themes__table {
  width: 100%;
}
.event-themes__table :deep(th.el-table__cell) {
  font-size: 13px;
  font-weight: 600;
}
.event-themes__table :deep(.el-table__cell) {
  padding: 8px 0;
}
.event-theme-name {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}
.event-theme-name__marker {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  transform: rotate(45deg);
  border: 1px solid var(--aircas-color-primary);
}
.event-theme-name__text {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-theme-category {
  color: var(--aircas-color-primary);
  font-size: 13px;
}
.event-theme-time {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}
.event-theme-time span:last-child {
  color: var(--aircas-color-text-secondary);
}
.event-theme-ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-theme-actions {
  display: flex;
  gap: 6px;
}
.event-theme-actions :deep(.el-button) {
  margin-left: 0;
  padding: 5px 8px;
}
.event-themes__cards {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-content: start;
  gap: 12px;
  overflow-y: auto;
  padding: 2px 2px 4px;
}
.event-theme-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background);
  transition: border-color 0.2s ease;
}
.event-theme-card:hover {
  border-color: var(--aircas-color-primary);
}
@media (max-width: 860px) {
  .event-themes__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.event-theme-card__title {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 15px;
  font-weight: 600;
}
.event-theme-card__type {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.event-theme-card__type span {
  color: var(--aircas-color-primary);
}
.event-theme-card__desc {
  display: -webkit-box;
  min-height: 3.2em;
  margin: 0;
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.event-theme-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
}
.event-theme-card__time,
.event-theme-card__region {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-theme-card__divider {
  border-top: 1px dashed var(--aircas-color-border);
}
.event-theme-card__updated {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
}
.event-theme-card__actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}
.event-theme-card__actions :deep(.el-button) {
  margin-left: 0;
  padding: 5px 8px;
}
.event-themes__footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
</style>
