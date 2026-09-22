<template>
  <el-dialog
    :model-value="modelValue"
    class="property-datasource-mapping-dialog aircas-dialog"
    title="关联数据源"
    width="92vw"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="property-datasource-mapping-dialog__body">
      <header class="mapping-toolbar">
        <div class="mapping-toolbar__inputs">
          <label>
            选择数据源
            <el-select
              v-model="selectedTableKeys"
              class="aircas-select"
              popper-class="aircas-select-popper"
              multiple
              collapse-tags
              collapse-tags-tooltip
              filterable
              placeholder="选择数据表（多选）"
              :loading="tableLoading"
            >
              <el-option
                v-for="table in flatTables"
                :key="manualTableKey(table.databaseId, table.table.id)"
                :label="`${table.databaseName}.${table.table.name}`"
                :value="manualTableKey(table.databaseId, table.table.id)"
              />
            </el-select>
          </label>
          <label>
            关联数据源
            <el-select
              :model-value="manualSelectedTable"
              class="aircas-select"
              popper-class="aircas-select-popper"
              filterable
              clearable
              placeholder="选择数据表"
              :loading="tableLoading"
              @update:model-value="handleManualTableChange"
            >
              <el-option
                v-for="table in selectedTables"
                :key="manualTableKey(table.databaseId, table.table.id)"
                :label="`${table.databaseName}.${table.table.name}`"
                :value="manualTableKey(table.databaseId, table.table.id)"
              />
            </el-select>
          </label>
          <label>
            关联数据源字段
            <el-select
              v-model="manualSelectedField"
              class="aircas-select"
              popper-class="aircas-select-popper"
              filterable
              :disabled="!manualSelectedTable"
              placeholder="选择字段"
              :loading="fieldLoading"
            >
              <el-option v-for="field in manualFieldOptions" :key="field.id" :label="field.name" :value="field.id" />
            </el-select>
          </label>
          <el-icon class="mapping-toolbar__connection"><Connection /></el-icon>
          <label>
            关联本体字段
            <el-select v-model="manualSelectedProperty" class="aircas-select" popper-class="aircas-select-popper" filterable placeholder="选择本体属性">
              <el-option v-for="property in properties" :key="property.id" :label="`${property.displayName} (${property.apiName})`" :value="property.id" />
            </el-select>
          </label>
          <el-button class="aircas-button" type="primary" :disabled="!canAddManualBind || loading" @click="addManualBind">关联</el-button>
        </div>
        <p v-if="tableError || fieldError" class="mapping-toolbar__error" role="alert">{{ tableError || fieldError }}</p>
        <div class="mapping-toolbar__actions">
          <el-button class="aircas-button" :loading="autoAssociateLoading" :disabled="loading || autoAssociateLoading" @click="emit('auto-associate')"
            >自动关联数据源</el-button
          >
          <span title="暂未开放"><el-button class="aircas-button" disabled>跳转到数据管道</el-button></span>
        </div>
      </header>
      <div class="mapping-layout" :class="{ 'mapping-layout--saving': loading }">
        <div ref="workspaceRef" class="property-datasource-mapping-dialog__workspace" @scroll="scheduleLineRefresh">
          <div class="property-datasource-mapping-dialog__panels">
            <aside class="property-datasource-mapping-dialog__source">
              <template v-for="table in displayTables" :key="manualTableKey(table.databaseId, table.table.id)">
                <div
                  class="mind-node mind-node-table"
                  :class="{
                    'mind-node-has-maps':
                      !isExpanded(tableNodeId(table.databaseId, table.table.id)) && parentMappedCount(tableNodeId(table.databaseId, table.table.id)) > 0,
                  }"
                >
                  <button
                    type="button"
                    class="mind-node__toggle"
                    :aria-label="isExpanded(tableNodeId(table.databaseId, table.table.id)) ? `收起 ${table.table.name}` : `展开 ${table.table.name}`"
                    @click="toggleCollapse(tableNodeId(table.databaseId, table.table.id))"
                  >
                    {{ isExpanded(tableNodeId(table.databaseId, table.table.id)) ? "−" : "+" }}
                  </button>
                  <span class="mind-node__badge">表</span>
                  <strong>{{ table.table.name }}</strong>
                  <span
                    v-if="!isExpanded(tableNodeId(table.databaseId, table.table.id)) && parentMappedCount(tableNodeId(table.databaseId, table.table.id)) > 0"
                    class="mind-node__map-count"
                  >
                    {{ parentMappedCount(tableNodeId(table.databaseId, table.table.id)) }}
                  </span>
                  <span class="mapping-anchor mapping-anchor-parent" :id="parentAnchorId(table.databaseId, table.table.id)" aria-hidden="true" />
                </div>

                <div v-if="isExpanded(tableNodeId(table.databaseId, table.table.id))" class="mind-children-fields">
                  <div class="field-list">
                    <div class="field-list__header">
                      <span>字段名称</span>
                      <span>数据类型</span>
                      <span class="field-list__anchor-col" aria-hidden="true" />
                    </div>
                    <div
                      v-for="field in table.table.fields"
                      :key="field.id"
                      class="field-list__row"
                      :class="{ 'field-list__row-mapped': isFieldMapped(table.databaseId, table.table.id, field.id) }"
                    >
                      <span :title="field.name">{{ field.name }}</span>
                      <span>{{ field.dataType || "—" }}</span>
                      <button
                        type="button"
                        class="mapping-anchor mapping-anchor-source"
                        :id="fieldAnchorId(table.databaseId, table.table.id, field.id)"
                        :aria-label="`关联字段 ${field.name}`"
                        @pointerdown.prevent="startDrag(table.databaseId, table.table.id, field.id, $event)"
                      />
                    </div>
                    <div v-if="!table.table.fields.length" class="field-list__empty">暂无字段</div>
                  </div>
                </div>
              </template>
            </aside>

            <section class="property-datasource-mapping-dialog__target">
              <div class="property-list">
                <div class="property-list__header">
                  <span class="property-list__anchor-col" aria-hidden="true" />
                  <span>名称</span>
                  <span>API 名称</span>
                  <span>分类</span>
                </div>
                <div
                  v-for="property in properties"
                  :key="property.id"
                  class="property-list__row"
                  :class="{ 'property-list__row-mapped': Boolean(draftBinds.get(property.id)) }"
                  :id="propRowId(property.id)"
                >
                  <button
                    type="button"
                    class="mapping-anchor mapping-anchor-target"
                    :id="propAnchorId(property.id)"
                    :aria-label="`关联属性 ${property.displayName}`"
                  />
                  <span :title="property.displayName">{{ property.displayName }}</span>
                  <span :title="property.apiName">{{ property.apiName }}</span>
                  <span :title="property.categoryName">{{ property.categoryName }}</span>
                </div>
                <div v-if="!properties.length" class="property-list__empty">暂无属性</div>
              </div>
            </section>
          </div>

          <svg class="property-datasource-mapping-dialog__svg" :width="svgSize.width" :height="svgSize.height">
            <path
              v-for="line in visibleLines"
              :key="line.id"
              class="mapping-line"
              :class="{
                'mapping-line-active': selectedLineId === line.id || hoveredLineId === line.id,
                'mapping-line-dimmed': hoveredLineId !== '' && hoveredLineId !== line.id,
              }"
              :d="line.path"
              :style="{ stroke: line.color }"
              fill="none"
              @click.stop="selectedLineId = line.id"
              @dblclick.stop="removeBind(line.id)"
              @mouseenter="hoveredLineId = line.id"
              @mouseleave="hoveredLineId = ''"
            />
            <path v-if="dragPreviewPath" class="mapping-line mapping-line-preview" :d="dragPreviewPath" fill="none" />
          </svg>
        </div>

        <aside class="mapping-pending">
          <header>
            <strong>操作缓存</strong>
            <span>{{ pendingOperations.length }} 项待提交</span>
          </header>
          <p class="mapping-pending__hint">图中双击连线可临时删除，提交后保存。</p>
          <div class="mapping-pending__list">
            <div
              v-for="operation in pendingOperations"
              :key="operation.key"
              class="mapping-pending__item"
              :class="{ 'is-remove': operation.kind === 'remove' }"
            >
              <b :aria-label="operation.kind === 'add' ? '添加' : '删除'">{{ operation.kind === "add" ? "+" : "−" }}</b>
              <span>{{ operation.source }} — {{ operation.target }}</span>
              <button
                type="button"
                class="mapping-pending__undo"
                :disabled="loading"
                :aria-label="`回退${operation.source}到${operation.target}的${operation.kind === 'add' ? '添加' : '删除'}操作`"
                @click="undoOperation(operation.propertyId, operation.kind)"
              >
                ×
              </button>
            </div>
            <el-empty v-if="!pendingOperations.length" description="暂无待提交操作" :image-size="60" />
          </div>
          <div class="mapping-pending__footer">
            <span>已关联 {{ mappedCount }} / {{ properties.length }}</span>
            <el-button class="aircas-button" type="primary" :loading="loading" :disabled="!pendingOperations.length" @click="handleConfirm"> 提交 </el-button>
          </div>
        </aside>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Connection } from "@element-plus/icons-vue";

interface OntologyDataSourceField {
  id: string;
  name: string;
  dataType: string;
}

interface OntologyDataSourceTable {
  id: string;
  name: string;
  fields: OntologyDataSourceField[];
}

interface OntologyDataSourceDatabase {
  id: string;
  name: string;
  tables: OntologyDataSourceTable[];
}

interface OntologyPropertyDataSourceBind {
  databaseId: string;
  databaseName: string;
  tableId: string;
  tableName: string;
  fieldId: string;
  fieldName: string;
}

interface OntologyPropertyClass {
  id: string;
  displayName: string;
  apiName: string;
  categoryName: string;
  dataSource: OntologyPropertyDataSourceBind | null;
}

interface PropertyDataSourceBindPayload {
  id: string;
  dataSource: OntologyPropertyDataSourceBind | null;
}

interface MappingLine {
  id: string;
  path: string;
  color: string;
}

interface DragState {
  databaseId: string;
  tableId: string;
  fieldId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface FlatTable {
  databaseId: string;
  databaseName: string;
  table: OntologyDataSourceTable;
}

const LINE_COLOR_VARS = [
  "var(--aircas-color-accent-cyan)",
  "var(--aircas-color-accent-blue)",
  "var(--aircas-color-accent-purple)",
  "var(--aircas-color-accent-orange)",
  "var(--aircas-color-accent-green)",
] as const;

const props = defineProps<{
  modelValue: boolean;
  catalog: OntologyDataSourceDatabase[];
  properties: OntologyPropertyClass[];
  autoAssociateLoading: boolean;
  tableLoading: boolean;
  fieldLoading: boolean;
  tableError: string;
  fieldError: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "auto-associate": [];
  "table-change": [databaseId: string, tableId: string];
  submit: [payloads: PropertyDataSourceBindPayload[]];
}>();

const workspaceRef = ref<HTMLElement | null>(null);
const loading = ref(false);
const collapsedIds = ref<Set<string>>(new Set());
const draftBinds = ref<Map<string, OntologyPropertyDataSourceBind | null>>(new Map());
const selectedLineId = ref("");
const hoveredLineId = ref("");
const visibleLines = ref<MappingLine[]>([]);
const svgSize = ref({ width: 0, height: 0 });
const dragState = ref<DragState | null>(null);
const lineRefreshRaf = ref<number | null>(null);

const manualSelectedTable = ref("");
const manualSelectedField = ref("");
const manualSelectedProperty = ref("");
const selectedTableKeys = ref<string[]>([]);
const selectedTables = computed(() => flatTables.value.filter((table) => selectedTableKeys.value.includes(manualTableKey(table.databaseId, table.table.id))));
const displayTables = computed(() =>
  flatTables.value.filter(
    (table) =>
      selectedTableKeys.value.includes(manualTableKey(table.databaseId, table.table.id)) ||
      [...draftBinds.value.values()].some((bind) => bind?.databaseId === table.databaseId && bind.tableId === table.table.id),
  ),
);
const pendingOperations = computed(() =>
  props.properties.flatMap((property) => {
    const before = property.dataSource;
    const after = draftBinds.value.get(property.id) ?? null;
    if (sameBind(before, after)) return [];
    return (
      [
        { kind: "remove" as const, bind: before },
        { kind: "add" as const, bind: after },
      ] as const
    )
      .filter((item) => item.bind)
      .map((item) => ({
        key: `${property.id}-${item.kind}`,
        propertyId: property.id,
        kind: item.kind,
        source: `${item.bind!.tableName}.${item.bind!.fieldName}`,
        target: property.apiName,
      }));
  }),
);

/** @description 回退指定属性的添加或删除操作。 */
function undoOperation(propertyId: string, kind: "add" | "remove"): void {
  if (loading.value) return;
  const property = props.properties.find((item) => item.id === propertyId);
  if (!property) return;
  const next = new Map(draftBinds.value);
  const restored = kind === "remove" ? property.dataSource : null;
  if (restored) {
    next.forEach((bind, id) => {
      if (id !== propertyId && sameBind(bind, restored)) next.set(id, null);
    });
  }
  next.set(propertyId, restored);
  draftBinds.value = next;
  selectedLineId.value = "";
  void nextTick(scheduleLineRefresh);
}

watch(selectedTableKeys, () => {
  if (!selectedTableKeys.value.includes(manualSelectedTable.value)) handleManualTableChange("");
  void nextTick(scheduleLineRefresh);
});

const mappedCount = computed(() => {
  let count = 0;
  draftBinds.value.forEach((bind) => {
    if (bind) count += 1;
  });
  return count;
});

const flatTables = computed<FlatTable[]>(() =>
  props.catalog.flatMap((database) =>
    database.tables.map((table) => ({
      databaseId: database.id,
      databaseName: database.name,
      table,
    })),
  ),
);

const manualFieldOptions = computed(() => {
  if (!manualSelectedTable.value) return [];
  const { databaseId, tableId } = parseManualTableKey(manualSelectedTable.value);
  const entry = flatTables.value.find((t) => t.databaseId === databaseId && t.table.id === tableId);
  return entry?.table.fields ?? [];
});

const canAddManualBind = computed(() => {
  if (!manualSelectedTable.value || !manualSelectedField.value || !manualSelectedProperty.value) {
    return false;
  }
  const current = draftBinds.value.get(manualSelectedProperty.value);
  if (current) {
    const { databaseId, tableId } = parseManualTableKey(manualSelectedTable.value);
    return !(current.databaseId === databaseId && current.tableId === tableId && current.fieldId === manualSelectedField.value);
  }
  return true;
});

function manualTableKey(databaseId: string, tableId: string): string {
  return `${databaseId}::${tableId}`;
}

function parseManualTableKey(key: string): { databaseId: string; tableId: string } {
  const [databaseId = "", tableId = ""] = key.split("::");
  return { databaseId, tableId };
}

function handleManualTableChange(value: string | number | boolean | undefined): void {
  manualSelectedTable.value = typeof value === "string" ? value : "";
  manualSelectedField.value = "";
  if (!manualSelectedTable.value) return;
  const { databaseId, tableId } = parseManualTableKey(manualSelectedTable.value);
  emit("table-change", databaseId, tableId);
}

function addManualBind(): void {
  if (!canAddManualBind.value) return;
  const { databaseId, tableId } = parseManualTableKey(manualSelectedTable.value);
  const property = props.properties.find((item) => item.id === manualSelectedProperty.value);
  const bind = resolveBind(databaseId, tableId, manualSelectedField.value);
  if (!bind || !property) return;
  const next = new Map(draftBinds.value);
  next.forEach((value, key) => {
    if (value && value.databaseId === bind.databaseId && value.tableId === bind.tableId && value.fieldId === bind.fieldId && key !== property.id) {
      next.set(key, null);
    }
  });
  next.set(property.id, bind);
  draftBinds.value = next;
  manualSelectedTable.value = "";
  manualSelectedField.value = "";
  manualSelectedProperty.value = "";
  void nextTick(() => refreshLines());
}

function removeBind(propertyId: string): void {
  const next = new Map(draftBinds.value);
  next.set(propertyId, null);
  draftBinds.value = next;
  selectedLineId.value = "";
  void nextTick(() => refreshLines());
}

const dragPreviewPath = computed(() => {
  const drag = dragState.value;
  if (!drag) return "";
  return buildCurve(drag.startX, drag.startY, drag.currentX, drag.currentY);
});

function tableNodeId(databaseId: string, tableId: string): string {
  return `table:${databaseId}::${tableId}`;
}

function fieldKey(databaseId: string, tableId: string, fieldId: string): string {
  return `${databaseId}::${tableId}::${fieldId}`;
}

function parentAnchorId(databaseId: string, tableId: string): string {
  return `parent-anchor-${tableNodeId(databaseId, tableId)}`;
}

function fieldAnchorId(databaseId: string, tableId: string, fieldId: string): string {
  return `field-anchor-${fieldKey(databaseId, tableId, fieldId)}`;
}

function propAnchorId(propertyId: string): string {
  return `prop-anchor-${propertyId}`;
}

function propRowId(propertyId: string): string {
  return `prop-row-${propertyId}`;
}

function isExpanded(nodeId: string): boolean {
  return !collapsedIds.value.has(nodeId);
}

function toggleCollapse(nodeId: string): void {
  const next = new Set(collapsedIds.value);
  if (next.has(nodeId)) next.delete(nodeId);
  else next.add(nodeId);
  collapsedIds.value = next;
  selectedLineId.value = "";
  hoveredLineId.value = "";
  void nextTick(() => refreshLines());
}

function isFieldMapped(databaseId: string, tableId: string, fieldId: string): boolean {
  for (const bind of draftBinds.value.values()) {
    if (!bind) continue;
    if (bind.databaseId === databaseId && bind.tableId === tableId && bind.fieldId === fieldId) {
      return true;
    }
  }
  return false;
}

function colorForTable(databaseId: string, tableId: string): string {
  const tableIndex = flatTables.value.findIndex((item) => item.databaseId === databaseId && item.table.id === tableId);
  const colorIndex = tableIndex >= 0 ? tableIndex % LINE_COLOR_VARS.length : 0;
  return LINE_COLOR_VARS[colorIndex] ?? "var(--aircas-color-accent-cyan)";
}

function parentMappedCount(parentId: string): number {
  let count = 0;
  draftBinds.value.forEach((bind) => {
    if (!bind) return;
    if (parentId === tableNodeId(bind.databaseId, bind.tableId)) {
      count += 1;
    }
  });
  return count;
}

function resolveSourceSelector(bind: OntologyPropertyDataSourceBind): string {
  if (isExpanded(tableNodeId(bind.databaseId, bind.tableId))) {
    return fieldAnchorId(bind.databaseId, bind.tableId, bind.fieldId);
  }
  return parentAnchorId(bind.databaseId, bind.tableId);
}

function resolveBind(databaseId: string, tableId: string, fieldId: string): OntologyPropertyDataSourceBind | null {
  const database = props.catalog.find((item) => item.id === databaseId);
  const table = database?.tables.find((item) => item.id === tableId);
  const field = table?.fields.find((item) => item.id === fieldId);
  if (!database || !table || !field) return null;
  return {
    databaseId: database.id,
    databaseName: database.name,
    tableId: table.id,
    tableName: table.name,
    fieldId: field.id,
    fieldName: field.name,
  };
}

function initDraftBinds(): void {
  const next = new Map<string, OntologyPropertyDataSourceBind | null>();
  props.properties.forEach((property) => {
    next.set(property.id, property.dataSource ? { ...property.dataSource } : null);
  });
  draftBinds.value = next;
}

function buildCurve(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(Math.abs(x2 - x1) * 0.45, 48);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function pointInWorkspace(clientX: number, clientY: number): { x: number; y: number } | null {
  const workspace = workspaceRef.value;
  if (!workspace) return null;
  const rect = workspace.getBoundingClientRect();
  return {
    x: clientX - rect.left + workspace.scrollLeft,
    y: clientY - rect.top + workspace.scrollTop,
  };
}

function anchorCenter(elementId: string): { x: number; y: number } | null {
  const workspace = workspaceRef.value;
  if (!workspace) return null;
  const el = workspace.querySelector(`[id="${elementId}"]`);
  if (!(el instanceof HTMLElement)) return null;
  const workspaceRect = workspace.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - workspaceRect.left + workspace.scrollLeft,
    y: rect.top + rect.height / 2 - workspaceRect.top + workspace.scrollTop,
  };
}

function refreshLines(): void {
  const workspace = workspaceRef.value;
  if (!workspace) {
    visibleLines.value = [];
    return;
  }

  svgSize.value = {
    width: Math.max(workspace.scrollWidth, workspace.clientWidth),
    height: Math.max(workspace.scrollHeight, workspace.clientHeight),
  };

  const nextLines: MappingLine[] = [];
  let index = 0;
  draftBinds.value.forEach((bind, propertyId) => {
    if (!bind) return;
    const source = anchorCenter(resolveSourceSelector(bind));
    const target = anchorCenter(propAnchorId(propertyId));
    if (!source || !target) return;
    const fan = (index % 2 === 0 ? 1 : -1) * Math.ceil((index + 1) / 2) * 12;
    nextLines.push({
      id: propertyId,
      path: buildCurve(source.x, source.y + fan * 0.2, target.x, target.y + fan * 0.12),
      color: colorForTable(bind.databaseId, bind.tableId),
    });
    index += 1;
  });
  visibleLines.value = nextLines;
}

function scheduleLineRefresh(): void {
  if (lineRefreshRaf.value !== null) return;
  lineRefreshRaf.value = window.requestAnimationFrame(() => {
    lineRefreshRaf.value = null;
    refreshLines();
  });
}

function startDrag(databaseId: string, tableId: string, fieldId: string, event: PointerEvent): void {
  const start = pointInWorkspace(event.clientX, event.clientY);
  if (!start) return;
  selectedLineId.value = "";
  dragState.value = {
    databaseId,
    tableId,
    fieldId,
    startX: start.x,
    startY: start.y,
    currentX: start.x,
    currentY: start.y,
  };
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd, true);
}

function onDragMove(event: PointerEvent): void {
  if (!dragState.value) return;
  const point = pointInWorkspace(event.clientX, event.clientY);
  if (!point) return;
  dragState.value = {
    ...dragState.value,
    currentX: point.x,
    currentY: point.y,
  };
}

function clearDragListeners(): void {
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd, true);
}

function onDragEnd(event: PointerEvent): void {
  const drag = dragState.value;
  clearDragListeners();
  dragState.value = null;
  if (!drag) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  const anchor = target.closest("[id^='prop-anchor-']");
  const row = target.closest("[id^='prop-row-']");
  const anchorMatch = anchor instanceof HTMLElement ? anchor.id.match(/^prop-anchor-(.+)$/) : null;
  const rowMatch = row instanceof HTMLElement ? row.id.match(/^prop-row-(.+)$/) : null;
  const propertyId = anchorMatch?.[1] ?? rowMatch?.[1] ?? "";
  if (!propertyId) return;

  const bind = resolveBind(drag.databaseId, drag.tableId, drag.fieldId);
  if (!bind) return;

  const next = new Map(draftBinds.value);
  next.forEach((value, key) => {
    if (value && value.databaseId === bind.databaseId && value.tableId === bind.tableId && value.fieldId === bind.fieldId && key !== propertyId) {
      next.set(key, null);
    }
  });
  next.set(propertyId, bind);
  draftBinds.value = next;
  selectedLineId.value = propertyId;
  void nextTick(() => refreshLines());
}

function removeSelectedLine(): void {
  if (!selectedLineId.value) return;
  const next = new Map(draftBinds.value);
  next.set(selectedLineId.value, null);
  draftBinds.value = next;
  selectedLineId.value = "";
  void nextTick(() => refreshLines());
}

function handleKeydown(event: KeyboardEvent): void {
  if (!props.modelValue || loading.value) return;
  if (event.key !== "Delete" && event.key !== "Backspace") return;
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
  removeSelectedLine();
}

function sameBind(left: OntologyPropertyDataSourceBind | null, right: OntologyPropertyDataSourceBind | null): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return left.databaseId === right.databaseId && left.tableId === right.tableId && left.fieldId === right.fieldId;
}

function handleConfirm(): void {
  if (loading.value || !pendingOperations.value.length) return;
  const payloads: PropertyDataSourceBindPayload[] = [];
  props.properties.forEach((property) => {
    const nextBind = draftBinds.value.get(property.id) ?? null;
    if (sameBind(property.dataSource, nextBind)) return;
    payloads.push({ id: property.id, dataSource: nextBind });
  });
  loading.value = true;
  emit("submit", payloads);
}

defineExpose({
  setLoading(value: boolean) {
    loading.value = value;
  },
});

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      loading.value = false;
      selectedLineId.value = "";
      hoveredLineId.value = "";
      dragState.value = null;
      manualSelectedTable.value = "";
      manualSelectedField.value = "";
      manualSelectedProperty.value = "";
      clearDragListeners();
      return;
    }
    collapsedIds.value = new Set();
    initDraftBinds();
    selectedTableKeys.value = [
      ...new Set(
        props.properties.flatMap((property) => (property.dataSource ? [manualTableKey(property.dataSource.databaseId, property.dataSource.tableId)] : [])),
      ),
    ];
    void nextTick(() => {
      refreshLines();
      window.setTimeout(() => refreshLines(), 50);
    });
  },
);

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", scheduleLineRefresh);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("resize", scheduleLineRefresh);
  clearDragListeners();
  if (lineRefreshRaf.value !== null) {
    window.cancelAnimationFrame(lineRefreshRaf.value);
  }
});
</script>

<style lang="scss" scoped>
.property-datasource-mapping-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.mapping-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}
.mapping-toolbar__inputs {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  flex: 1;
  gap: 10px;
}
.mapping-toolbar__inputs label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 170px;
  min-width: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.mapping-toolbar__inputs label :deep(.aircas-select) {
  width: 100%;
}
.mapping-toolbar__inputs label:first-child {
  width: 210px;
}
.mapping-toolbar__connection {
  align-self: flex-end;
  height: 32px;
  color: var(--aircas-color-accent-cyan);
  font-size: 24px;
  line-height: 32px;
}
.mapping-toolbar__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.mapping-toolbar__error {
  flex-basis: 100%;
  margin: 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
}
.mapping-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 12px;
  min-height: 0;
  flex: 1;
}
.mapping-layout--saving {
  pointer-events: none;
}
.mapping-pending {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 14px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}
.mapping-pending header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--aircas-color-text-primary);
}
.mapping-pending header span {
  font-size: 12px;
  color: var(--aircas-color-accent-cyan);
}
.mapping-pending__hint {
  font-size: 12px;
  line-height: 1.6;
  color: var(--aircas-color-text-muted);
}
.mapping-pending__list {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.mapping-pending__item {
  display: flex;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid var(--aircas-color-border-soft);
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  overflow-wrap: anywhere;
}
.mapping-pending__item b {
  color: var(--aircas-color-accent-green);
  font-size: 18px;
}
.mapping-pending__item.is-remove b {
  color: var(--aircas-color-accent-orange);
}
.mapping-pending__item > span {
  flex: 1;
  min-width: 0;
}
.mapping-pending__undo {
  flex-shrink: 0;
  align-self: flex-start;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--aircas-color-text-muted);
  font-size: 20px;
  cursor: pointer;
}
.mapping-pending__undo:hover,
.mapping-pending__undo:focus-visible {
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-cyan-soft);
}
.mapping-pending__footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.property-datasource-mapping-dialog__workspace {
  position: relative;
  min-height: 0;
  flex: 1;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background:
    radial-gradient(circle at 18% 0, var(--aircas-color-accent-cyan-soft), var(--aircas-color-transparent) 42%),
    radial-gradient(circle at 82% 12%, var(--aircas-color-accent-purple-soft), var(--aircas-color-transparent) 36%),
    linear-gradient(160deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.property-datasource-mapping-dialog__panels {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(320px, 380px);
  justify-content: space-between;
  gap: 80px;
  align-items: start;
  min-width: 672px;
  padding: 16px;
}

.property-datasource-mapping-dialog__source,
.property-datasource-mapping-dialog__target {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.property-datasource-mapping-dialog__source {
  gap: 12px;
}

.property-datasource-mapping-dialog__target {
  gap: 12px;
}

.property-datasource-mapping-dialog__svg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  overflow: visible;
  pointer-events: none;
}

.mind-children-fields {
  min-width: 220px;
}

.mind-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  min-height: 34px;
  margin: 4px 0;
  padding: 6px 10px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-card-background);
  box-shadow: inset 0 0 12px var(--aircas-color-border-soft);
}

.mind-node-has-maps {
  border-color: var(--aircas-color-accent-cyan);
  box-shadow: 0 0 10px var(--aircas-color-accent-cyan-soft);
}

.mind-node__map-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-accent-blue);
  font-size: 11px;
  font-weight: 700;
}

.mapping-anchor-parent {
  margin-left: 2px;
  cursor: default;
  pointer-events: none;
}

.mind-node-table {
  border-color: var(--aircas-color-border-highlight);
}

.mapping-line {
  pointer-events: stroke;
  cursor: pointer;
  stroke-width: 2;
  opacity: 1;
  transition:
    opacity 0.15s ease,
    stroke-width 0.15s ease;
}

.mapping-line-dimmed {
  opacity: 0.16;
  stroke-width: 1.5;
}

.mapping-line-active {
  opacity: 1;
  stroke-width: 3;
}

.mapping-line-preview {
  pointer-events: none;
  stroke: var(--aircas-color-accent-blue);
  stroke-dasharray: 6 4;
}

.mind-node__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-panel-background-deep);
  font-size: 12px;
  line-height: 1;
  font-family: inherit;
  cursor: pointer;
}

.mind-node__toggle:hover {
  border-color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-cyan-soft);
}

.mind-node__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-accent-blue-fill);
  font-size: 11px;
  font-weight: 700;
}

.mind-node strong {
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 650;
}

.field-list,
.property-list {
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-card-background);
}

.field-list__header,
.field-list__row {
  display: grid;
  grid-template-columns: 1.3fr 1fr 20px;
  gap: 8px;
  align-items: center;
  min-height: 34px;
  padding: 6px 10px;
}

.property-list__header,
.property-list__row {
  display: grid;
  grid-template-columns: 20px 1.1fr 1.2fr 0.9fr;
  gap: 8px;
  align-items: center;
  min-height: 34px;
  padding: 6px 10px;
}

.field-list__header,
.property-list__header {
  border-bottom: 1px solid var(--aircas-color-border-soft);
  background: var(--aircas-color-section-header);
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  font-weight: 650;
}

.field-list__row,
.property-list__row {
  border-top: 1px solid var(--aircas-color-border-soft);
  color: var(--aircas-color-text-primary);
  font-size: 12px;
}

.field-list__row span,
.property-list__row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-list__row-mapped,
.property-list__row-mapped {
  background: var(--aircas-color-accent-cyan-soft);
}

.field-list__empty,
.property-list__empty {
  padding: 16px 12px;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  text-align: center;
}

.mapping-anchor {
  width: 12px;
  height: 12px;
  padding: 0;
  border: 1px solid var(--aircas-color-accent-cyan);
  border-radius: 50%;
  background: var(--aircas-color-accent-blue);
  cursor: crosshair;
}

.mapping-anchor:hover {
  box-shadow: 0 0 8px var(--aircas-color-accent-cyan-shadow);
}

.field-list__anchor-col,
.property-list__anchor-col {
  width: 12px;
}
</style>

<style lang="scss">
.property-datasource-mapping-dialog.el-dialog {
  margin: 2vh auto !important;
  height: 96vh;
  max-height: 96vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 10px;
  background: linear-gradient(160deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
  box-shadow: 0 0 28px var(--aircas-color-accent-blue-soft);
  overflow: hidden;
}

.property-datasource-mapping-dialog .el-dialog__header {
  flex-shrink: 0;
  position: relative;
  margin: 0;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--aircas-color-border-soft);
}

.property-datasource-mapping-dialog .el-dialog__header::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 2px;
  content: "";
  background: linear-gradient(90deg, var(--aircas-color-accent-cyan), var(--aircas-color-accent-blue), var(--aircas-color-accent-purple));
}

.property-datasource-mapping-dialog .el-dialog__title {
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 650;
}

.property-datasource-mapping-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 12px 16px;
}

.property-datasource-mapping-dialog .el-dialog__footer {
  padding: 12px 20px 16px;
  border-top: 1px solid var(--aircas-color-border-soft);
}
</style>
