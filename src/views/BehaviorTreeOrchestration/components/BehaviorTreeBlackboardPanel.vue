<template>
  <div class="behavior-tree-board">
    <div class="behavior-tree-board__toolbar">
      <el-button type="primary" @click="emit('add-row')">新增黑板键</el-button>
    </div>
    <p class="behavior-tree-board__hint">黑板键不是必填。固定值写在本行；外部输入才生成同名变量默认值；对象属性执行时按实例回读。</p>

    <div v-if="rows.length === 0" class="behavior-tree-board__empty">暂无黑板键（可选）</div>

    <article v-for="(row, index) in rows" :key="`bb-${index}-${row.key}`" class="behavior-tree-board__card">
      <header class="behavior-tree-board__card-head">
        <strong>黑板键 {{ index + 1 }}</strong>
        <el-button link type="danger" @click="emit('delete-row', index)">删除</el-button>
      </header>

      <div class="behavior-tree-board__field">
        <label>键名</label>
        <el-input :model-value="row.key" placeholder="ammoCount" @update:model-value="emit('update-field', index, 'key', String($event))" />
      </div>

      <div class="behavior-tree-board__grid">
        <div class="behavior-tree-board__field">
          <label>类型</label>
          <el-select
            :model-value="row.valueType"
            style="width: 100%"
            :disabled="resolveSource(row) === 'PROPERTY'"
            @change="emit('update-field', index, 'valueType', String($event))"
          >
            <el-option v-for="type in BEHAVIOR_TREE_VALUE_TYPES" :key="type" :label="type" :value="type" />
          </el-select>
        </div>
        <div class="behavior-tree-board__field">
          <label>来源</label>
          <el-select :model-value="resolveSource(row)" style="width: 100%" @change="handleSourceChange(index, String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_BLACKBOARD_SOURCE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
      </div>

      <template v-if="resolveSource(row) === 'PROPERTY'">
        <div class="behavior-tree-board__field">
          <label>对象</label>
          <el-select
            :model-value="resolveSelectedObjectId(row, index)"
            filterable
            clearable
            style="width: 100%"
            :loading="propertyCatalogStatus === 'loading'"
            :placeholder="objectSelectPlaceholder"
            @change="handleObjectChange(index, String($event ?? ''))"
          >
            <el-option v-for="item in objectOptions" :key="item.value" :label="item.label" :value="item.value" />
            <el-option
              v-if="orphanObjectOption(row, index)"
              :label="`${orphanObjectOption(row, index)}（目录中无）`"
              :value="orphanObjectOption(row, index) || ''"
            />
          </el-select>
        </div>
        <div class="behavior-tree-board__field">
          <label>属性</label>
          <el-select
            :model-value="row.bindPropertyUniqueIdentifier"
            filterable
            clearable
            style="width: 100%"
            :disabled="!resolveSelectedObjectId(row, index)"
            :loading="isObjectPropertyLoading(resolveSelectedObjectId(row, index))"
            :placeholder="propertySelectPlaceholder(row, index)"
            @change="emit('update-field', index, 'bindPropertyUniqueIdentifier', String($event ?? ''))"
          >
            <el-option
              v-for="property in listPropertiesForObject(resolveSelectedObjectId(row, index))"
              :key="property.id"
              :label="`${property.displayName} · ${property.propertyType}`"
              :value="property.id"
            />
            <el-option
              v-if="row.bindPropertyUniqueIdentifier && !objectProperties[row.bindPropertyUniqueIdentifier]"
              :label="`${row.bindPropertyUniqueIdentifier}（目录中无）`"
              :value="row.bindPropertyUniqueIdentifier"
            />
          </el-select>
        </div>
      </template>

      <div v-else-if="resolveSource(row) === 'FIXED'" class="behavior-tree-board__field">
        <label>固定值</label>
        <el-input :model-value="row.fixedValueText" placeholder="必填" @update:model-value="emit('update-field', index, 'fixedValueText', String($event))" />
      </div>

      <div v-else class="behavior-tree-board__field">
        <label>默认值</label>
        <el-input
          :model-value="row.defaultValueText"
          placeholder="可不填"
          @update:model-value="emit('update-field', index, 'defaultValueText', String($event))"
        />
      </div>

      <div class="behavior-tree-board__field">
        <label>说明</label>
        <el-input :model-value="row.description" @update:model-value="emit('update-field', index, 'description', String($event))" />
      </div>
    </article>

    <p class="behavior-tree-board__footer-hint">固定值取本行；外部输入可由执行 inputs 覆盖；对象属性按实例读库。行为外部入参不在此声明。</p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import type { BehaviorTreeBlackboardItem, BehaviorTreeObjectPropertyOption, BehaviorTreeOrchestrationLoadStatus, SpaceRelationObjectOption } from "@/types";
import { resolveBehaviorTreeBlackboardSource } from "../utils/behaviorTreeBlackboard";
import { BEHAVIOR_TREE_BLACKBOARD_SOURCE_OPTIONS, BEHAVIOR_TREE_VALUE_TYPES } from "../utils/behaviorTreeConstants";

const props = defineProps<{
  rows: BehaviorTreeBlackboardItem[];
  objectOptions: SpaceRelationObjectOption[];
  objectProperties: Record<string, BehaviorTreeObjectPropertyOption>;
  propertyCatalogStatus: BehaviorTreeOrchestrationLoadStatus;
  propertyCatalogError: string;
  objectPropertyLoadingIds: Record<string, true>;
}>();

const emit = defineEmits<{
  "add-row": [];
  "delete-row": [index: number];
  "update-field": [index: number, field: keyof BehaviorTreeBlackboardItem, value: string];
  "request-object-properties": [objectId: string];
}>();

/** 各行当前选中的对象 id（UI 态，不落库）。 */
const selectedObjectIds = reactive<Record<number, string>>({});

/**
 * @description 解析行来源。
 * @param row 黑板行。
 * @returns 来源枚举。
 */
function resolveSource(row: BehaviorTreeBlackboardItem) {
  return resolveBehaviorTreeBlackboardSource(row);
}

/**
 * @description 同步已绑定属性对应的对象选择。
 */
function syncSelectedObjectsFromBindings(): void {
  props.rows.forEach((row, index) => {
    if (resolveSource(row) !== "PROPERTY") {
      delete selectedObjectIds[index];
      return;
    }
    const bound = props.objectProperties[row.bindPropertyUniqueIdentifier.trim()];
    if (bound?.objectId) {
      selectedObjectIds[index] = bound.objectId;
      return;
    }
    if (!selectedObjectIds[index]) selectedObjectIds[index] = "";
  });
}

watch(
  () => [props.rows, props.objectProperties] as const,
  () => {
    syncSelectedObjectsFromBindings();
  },
  { deep: true, immediate: true },
);

/**
 * @description 解析某行当前选中的对象 id。
 * @param row 黑板行。
 * @param index 行下标。
 * @returns 对象 uniqueIdentifier。
 */
function resolveSelectedObjectId(row: BehaviorTreeBlackboardItem, index: number): string {
  const selected = (selectedObjectIds[index] || "").trim();
  if (selected) return selected;
  const bound = props.objectProperties[row.bindPropertyUniqueIdentifier.trim()];
  return bound?.objectId?.trim() || "";
}

/**
 * @description 列出指定对象下的属性。
 * @param objectId 对象 id。
 * @returns 属性列表。
 */
function listPropertiesForObject(objectId: string): BehaviorTreeObjectPropertyOption[] {
  const id = objectId.trim();
  if (!id) return [];
  return Object.values(props.objectProperties)
    .filter((property) => property.objectId === id)
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "zh-CN"));
}

/**
 * @description 目录外的对象 id（回显兜底）。
 * @param row 黑板行。
 * @param index 行下标。
 * @returns 对象 id 或空。
 */
function orphanObjectOption(row: BehaviorTreeBlackboardItem, index: number): string {
  const objectId = resolveSelectedObjectId(row, index);
  if (!objectId) return "";
  return props.objectOptions.some((item) => item.value === objectId) ? "" : objectId;
}

const objectSelectPlaceholder = computed(() => {
  if (props.propertyCatalogStatus === "loading") return "正在加载对象";
  if (props.propertyCatalogError) return props.propertyCatalogError;
  if (props.objectOptions.length === 0) return "（暂无对象）";
  return "先选择对象";
});

/**
 * @description 判断对象属性是否正在加载。
 * @param objectId 对象 id。
 * @returns 是否 loading。
 */
function isObjectPropertyLoading(objectId: string): boolean {
  const id = objectId.trim();
  return Boolean(id && props.objectPropertyLoadingIds[id]);
}

/**
 * @description 属性下拉占位文案。
 * @param row 黑板行。
 * @param index 行下标。
 * @returns 占位字符串。
 */
function propertySelectPlaceholder(row: BehaviorTreeBlackboardItem, index: number): string {
  const objectId = resolveSelectedObjectId(row, index);
  if (!objectId) return "请先选择对象";
  if (isObjectPropertyLoading(objectId)) return "正在加载属性";
  if (listPropertiesForObject(objectId).length === 0) return "（该对象暂无属性）";
  return "选择属性";
}

/**
 * @description 切换来源；离开 PROPERTY 时清掉对象选择。
 * @param index 行下标。
 * @param source 新来源。
 */
function handleSourceChange(index: number, source: string): void {
  if (source !== "PROPERTY") delete selectedObjectIds[index];
  emit("update-field", index, "source", source);
}

/**
 * @description 切换对象并清空已选属性。
 * @param index 行下标。
 * @param objectId 对象 id。
 */
function handleObjectChange(index: number, objectId: string): void {
  selectedObjectIds[index] = objectId;
  emit("update-field", index, "bindPropertyUniqueIdentifier", "");
  if (objectId.trim()) emit("request-object-properties", objectId.trim());
}
</script>

<style scoped lang="scss">
.behavior-tree-board {
  min-width: 0;
  overflow-x: hidden;
}

.behavior-tree-board__toolbar {
  margin-bottom: 8px;
}

.behavior-tree-board__hint,
.behavior-tree-board__footer-hint,
.behavior-tree-board__empty {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.behavior-tree-board__hint {
  margin-bottom: 12px;
}

.behavior-tree-board__empty {
  padding: 16px 0;
  text-align: center;
}

.behavior-tree-board__card {
  min-width: 0;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-page-background);
}

.behavior-tree-board__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
}

.behavior-tree-board__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
}

.behavior-tree-board__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;

  label {
    color: var(--aircas-color-text-secondary);
    font-size: 12px;
  }
}

.behavior-tree-board__footer-hint {
  margin-top: 8px;
}
</style>
