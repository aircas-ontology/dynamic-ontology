<template>
  <el-dialog
    title="选择元数据"
    width="min(860px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
  >
    <p v-if="loading" role="status">正在查询元数据…</p>
    <p v-else-if="error" class="attribute-metadata-select__error" role="alert">{{ error }}</p>
    <el-empty v-else-if="!treeData.length" description="暂无元数据" />
    <div v-else class="attribute-metadata-select__layout">
      <div class="attribute-metadata-select__tree-pane">
        <el-tree
          ref="treeRef"
          class="attribute-metadata-select__tree"
          node-key="id"
          show-checkbox
          check-strictly
          default-expand-all
          :data="treeData"
          :props="treeProps"
          :default-checked-keys="checkedIds"
          @check-change="syncCheckedMetadataIds"
        >
          <template #default="{ data }">
            <div class="attribute-metadata-select__node" @click.stop>
              <span class="attribute-metadata-select__name">{{ data.name }}</span>
              <span class="attribute-metadata-select__type">{{ resolveMetadataValueTypeLabel(data.valueType) }}</span>
            </div>
          </template>
        </el-tree>
      </div>
      <div class="attribute-metadata-select__selected-pane">
        <el-empty v-if="!selectedLeafRecords.length" description="请勾选左侧子节点" />
        <ul v-else class="attribute-metadata-select__selected-list" aria-label="已选元数据">
          <li v-for="item in selectedLeafRecords" :key="item.id" class="attribute-metadata-select__selected-item">
            <span class="attribute-metadata-select__selected-key">{{ item.name }}</span>
            <span class="attribute-metadata-select__selected-sep" aria-hidden="true">:</span>
            <div class="attribute-metadata-select__selected-value">
              <div v-if="item.valueType === 'input'" aria-label="输入值">
                <el-input :model-value="readInputDraftValue(item.id)" placeholder="请输入值" @update:model-value="updateInputDraft(item.id, $event)" />
              </div>
              <div v-else-if="item.valueType === 'enum'" aria-label="枚举值">
                <el-select
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  :model-value="readEnumDraftValue(item.id)"
                  placeholder="请选择枚举值"
                  style="width: 100%"
                  @update:model-value="updateEnumDraft(item.id, $event)"
                >
                  <el-option v-for="option in listEnumOptions(item)" :key="option" :label="option" :value="option" />
                </el-select>
              </div>
              <div v-else class="attribute-metadata-select__range">
                <div aria-label="最小值">
                  <el-input-number
                    :model-value="readRangeDraftBound(item.id, 'min')"
                    :controls="false"
                    placeholder="最小值"
                    @update:model-value="updateRangeDraft(item.id, 'min', $event ?? null)"
                  />
                </div>
                <span>~</span>
                <div aria-label="最大值">
                  <el-input-number
                    :model-value="readRangeDraftBound(item.id, 'max')"
                    :controls="false"
                    placeholder="最大值"
                    @update:model-value="updateRangeDraft(item.id, 'max', $event ?? null)"
                  />
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :disabled="loading || !!error" @click="confirmMetadataSelection">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { OntologyAttributeMetadataRecord, OntologyAttributeMetadataTreeNode } from "@/types";
import { getMetadataSchemaInterface } from "@/apis";
import {
  buildAttributeMetadataDraftState,
  buildSelectedAttributeMetadataRecords,
  initializeAttributeMetadataValueDrafts,
  listSelectedAttributeMetadataIds,
  resolveAttributeMetadataSelectionEcho,
  type AttributeMetadataDraftState,
  type AttributeMetadataValueDraft,
} from "../utils/attributeMetadataSelection";
import { buildMetadataTree, resolveMetadataValueTypeLabel } from "../utils/metadataOperations";
import { parseMetadataSchema } from "../utils/metadataSchemaAdapter";

/** 选择弹窗树节点：目录节点带 disabled。 */
type AttributeMetadataSelectTreeNode = OntologyAttributeMetadataTreeNode & {
  disabled: boolean;
  children: AttributeMetadataSelectTreeNode[];
};

const props = defineProps<{
  visible: boolean;
  ontologyIdentifier: string;
  /** 属性草稿 metadata：含 selectedRecords 或接口嵌套 JSON，用于回显勾选。 */
  metadataSource: unknown;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  confirm: [state: AttributeMetadataDraftState];
}>();

const treeProps = { label: "name", children: "children", disabled: "disabled" };
const treeRef = ref<{
  getCheckedKeys: (leafOnly?: boolean) => Array<string | number>;
  setCheckedKeys: (keys: Array<string | number>, leafOnly?: boolean) => void;
} | null>(null);
const catalog = ref<OntologyAttributeMetadataRecord[]>([]);
const valueDrafts = ref<Record<string, AttributeMetadataValueDraft>>({});
const checkedIds = ref<string[]>([]);
const loading = ref(false);
const error = ref("");
let loadRevision = 0;

/**
 * @description 为树节点标记目录不可勾选（有子节点则 disabled）。
 * @param nodes 原始树节点。
 * @returns 带 disabled 的选择树。
 */
function mapSelectTreeNodes(nodes: OntologyAttributeMetadataTreeNode[]): AttributeMetadataSelectTreeNode[] {
  return nodes.map((node) => {
    const children = mapSelectTreeNodes(node.children);
    return {
      ...node,
      children,
      disabled: children.length > 0,
    };
  });
}

const treeData = computed(() => mapSelectTreeNodes(buildMetadataTree(catalog.value)));

/**
 * @description 判断元数据 id 是否为叶子（无子节点）。
 * @param id 元数据 id。
 * @returns 是否为叶子。
 */
function isLeafMetadataId(id: string): boolean {
  return !catalog.value.some((item) => item.parentId === id);
}

/**
 * @description 按勾选 id 顺序解析已选叶子记录，供右侧 key:value 列表展示。
 */
const selectedLeafRecords = computed(() => {
  const catalogById = new Map(catalog.value.map((item) => [item.id, item]));
  return checkedIds.value.flatMap((id) => {
    if (!isLeafMetadataId(id)) return [];
    const item = catalogById.get(id);
    return item ? [item] : [];
  });
});

/**
 * @description 读取枚举节点可选值；优先目录定义。
 * @param record 元数据记录。
 * @returns 枚举选项。
 */
function listEnumOptions(record: OntologyAttributeMetadataRecord): string[] {
  if (record.valueType !== "enum") return [];
  return record.value.map((item) => item.trim()).filter(Boolean);
}

/**
 * @description 读取输入类型草稿值。
 * @param id 元数据 id。
 * @returns 输入文本。
 */
function readInputDraftValue(id: string): string {
  const draft = valueDrafts.value[id];
  return draft?.valueType === "input" ? draft.value : "";
}

/**
 * @description 读取枚举类型草稿值。
 * @param id 元数据 id。
 * @returns 枚举选中项。
 */
function readEnumDraftValue(id: string): string[] {
  const draft = valueDrafts.value[id];
  return draft?.valueType === "enum" ? draft.value : [];
}

/**
 * @description 读取范围草稿的最小或最大值。
 * @param id 元数据 id。
 * @param field 字段。
 * @returns 数值或 null。
 */
function readRangeDraftBound(id: string, field: "min" | "max"): number | null {
  const draft = valueDrafts.value[id];
  if (draft?.valueType !== "range") return null;
  return field === "min" ? draft.min : draft.max;
}

/**
 * @description 更新输入值草稿。
 * @param id 元数据 id。
 * @param value 输入文本。
 */
function updateInputDraft(id: string, value: string): void {
  valueDrafts.value = { ...valueDrafts.value, [id]: { valueType: "input", value } };
}

/**
 * @description 更新枚举值草稿。
 * @param id 元数据 id。
 * @param value 选中枚举项。
 */
function updateEnumDraft(id: string, value: string[]): void {
  valueDrafts.value = { ...valueDrafts.value, [id]: { valueType: "enum", value: [...value] } };
}

/**
 * @description 更新范围草稿的最小或最大值。
 * @param id 元数据 id。
 * @param field 字段。
 * @param value 数值。
 */
function updateRangeDraft(id: string, field: "min" | "max", value: number | null): void {
  const current = valueDrafts.value[id];
  const min = field === "min" ? value : current?.valueType === "range" ? current.min : null;
  const max = field === "max" ? value : current?.valueType === "range" ? current.max : null;
  valueDrafts.value = { ...valueDrafts.value, [id]: { valueType: "range", min, max } };
}

/** @description 从树勾选状态同步已选叶子 id。 */
function syncCheckedMetadataIds(): void {
  const keys = (treeRef.value?.getCheckedKeys(true) ?? []).map((item) => String(item));
  checkedIds.value = keys;
}

/** @description 查询元数据目录并回填勾选与值草稿。 */
async function loadMetadataCatalog(): Promise<void> {
  const revision = ++loadRevision;
  catalog.value = [];
  valueDrafts.value = {};
  checkedIds.value = [];
  error.value = "";
  if (!props.visible) return;
  if (!props.ontologyIdentifier.trim()) {
    error.value = "缺少对象标识，无法查询元数据";
    return;
  }
  loading.value = true;
  try {
    const response = await getMetadataSchemaInterface(props.ontologyIdentifier.trim());
    if (revision !== loadRevision) return;
    if (response.code !== 200) throw new Error(response.message || "查询元数据失败");
    catalog.value = parseMetadataSchema(response.data);
    const echoedRecords = resolveAttributeMetadataSelectionEcho(props.metadataSource, catalog.value);
    valueDrafts.value = initializeAttributeMetadataValueDrafts(catalog.value, echoedRecords);
    checkedIds.value = listSelectedAttributeMetadataIds(echoedRecords).filter((id) => isLeafMetadataId(id));
    queueMicrotask(() => {
      if (revision !== loadRevision) return;
      treeRef.value?.setCheckedKeys(checkedIds.value, true);
    });
  } catch (cause) {
    if (revision !== loadRevision) return;
    catalog.value = [];
    error.value = cause instanceof Error ? cause.message : "查询元数据失败";
  } finally {
    if (revision === loadRevision) loading.value = false;
  }
}

/** @description 确认勾选结果并回写属性草稿（含提交用嵌套 JSON）。 */
function confirmMetadataSelection(): void {
  const keys = (treeRef.value?.getCheckedKeys(true) ?? checkedIds.value).map((item) => String(item)).filter((id) => isLeafMetadataId(id));
  const selectedRecords = buildSelectedAttributeMetadataRecords(keys, catalog.value, valueDrafts.value);
  emit("confirm", buildAttributeMetadataDraftState(selectedRecords, catalog.value));
  emit("update:visible", false);
}

watch(
  () => [props.visible, props.ontologyIdentifier],
  () => {
    void loadMetadataCatalog();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.attribute-metadata-select__error {
  margin: 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
}

.attribute-metadata-select__layout {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(280px, 1.15fr);
  gap: 16px;
  min-height: min(52vh, 420px);
}

.attribute-metadata-select__tree-pane,
.attribute-metadata-select__selected-pane {
  min-width: 0;
  max-height: min(56vh, 480px);
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  padding: 8px;
}

.attribute-metadata-select__tree :deep(.el-tree-node__content) {
  min-height: 36px;
  height: auto;
  padding-top: 4px;
  padding-bottom: 4px;
}

.attribute-metadata-select__node {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding-right: 8px;
  min-width: 0;
}

.attribute-metadata-select__name {
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attribute-metadata-select__type {
  flex-shrink: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.attribute-metadata-select__selected-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.attribute-metadata-select__selected-item {
  display: grid;
  grid-template-columns: minmax(72px, 120px) 12px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.attribute-metadata-select__selected-key {
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.attribute-metadata-select__selected-sep {
  color: var(--aircas-color-text-secondary);
  text-align: center;
}

.attribute-metadata-select__selected-value {
  min-width: 0;
}

.attribute-metadata-select__range {
  display: flex;
  gap: 8px;
  align-items: center;
}

.attribute-metadata-select__range > div {
  flex: 1;
  min-width: 0;
}

.attribute-metadata-select__range .el-input-number {
  width: 100%;
}
</style>
