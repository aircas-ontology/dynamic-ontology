<template>
  <div class="conceptual-model-create">
    <header class="conceptual-model-create__topbar">
      <el-button class="aircas-button" @click="goBack">返回</el-button>
      <div class="conceptual-model-create__identity">
        <span class="conceptual-model-create__eyebrow">空间概念模型</span>
        <h1>概念模型画布</h1>
        <p>拖拽 UML 对象构建空间骨架，保存后自动写入默认「全部」分类</p>
      </div>
      <div class="conceptual-model-create__space-fields">
        <label class="conceptual-model-create__space-field">
          <span>空间名称</span>
          <el-input v-model="spaceDisplayName" class="aircas-input" ariaLabel="空间名称" placeholder="空间名称" :readonly="hasRouteSpaceContext" />
        </label>
        <label class="conceptual-model-create__space-field">
          <span>API 名称</span>
          <el-input v-model="spaceApiName" class="aircas-input" ariaLabel="空间 API 名称" placeholder="空间 API 名称" :readonly="hasRouteSpaceContext" />
        </label>
      </div>
      <div class="conceptual-model-create__actions">
        <span>{{ zoom }}%</span><el-button class="aircas-button" size="small" @click="zoomOut">缩小</el-button
        ><el-button class="aircas-button" size="small" @click="zoomIn">放大</el-button
        ><el-button class="aircas-button" size="small" @click="fitCanvas">适应画布</el-button
        ><el-button class="aircas-button" type="danger" size="small" :disabled="!selected" @click="deleteSelected">删除选中</el-button
        ><el-button class="aircas-button" type="primary" size="small" :loading="saving" @click="saveConceptualModel">保存</el-button>
      </div>
    </header>
    <p v-if="saveError" class="conceptual-model-create__save-error" role="alert">{{ saveError }}</p>
    <div class="conceptual-model-create__workspace">
      <aside class="conceptual-model-create__palette" aria-label="UML 组件">
        <span class="conceptual-model-create__eyebrow">UML COMPONENTS</span>
        <h2>UML 组件</h2>
        <p>拖入画布，或点击添加</p>
        <button
          v-for="item in palette"
          :key="item.type"
          type="button"
          class="conceptual-model-create__palette-item"
          draggable="true"
          @click="addPalette(item.type)"
          @dragstart="startDrag(item.type, $event)"
        >
          <span class="conceptual-model-create__glyph" :class="`is-${item.type}`">{{ item.glyph }}</span
          ><span
            ><strong>{{ item.label }}</strong
            ><small>{{ item.hint }}</small></span
          >
        </button>
        <p class="conceptual-model-create__palette-note">
          将对象关系拖入画布会生成一条可伸缩的实线。青色圆点是源端，紫色圆点是目标端，分别拖到对象四边圆点后才算连接。
        </p>
      </aside>
      <section class="conceptual-model-create__canvas-panel" aria-label="概念模型画布">
        <ConceptualModelGraphCanvas
          ref="graphCanvasRef"
          :objects="objects"
          :relations="relations"
          :selected="selected"
          @select="select"
          @clear-selection="clearSelection"
          @move-object="moveObjectPosition"
          @connect="addConnectedRelation"
          @update-relation-ends="updateRelationEnds"
          @add-object-at="addObject"
          @add-attribute-to="addAttribute"
          @add-relation-at="addRelation"
          @zoom-change="zoom = $event"
          @remove-selected="deleteSelected"
        />
      </section>
      <aside class="conceptual-model-create__inspector" aria-label="模型检查器">
        <template v-if="selectedObject"
          ><h2>对象检查器</h2>
          <small>对齐对象创建表单的核心字段</small
          ><el-form class="aircas-form" label-position="top"
            ><el-form-item label="API 名称"
              ><el-input class="aircas-input" :model-value="selectedObject.apiName" @update:model-value="updateObject('apiName', $event)" /></el-form-item
            ><el-form-item label="显示名称"
              ><el-input
                class="aircas-input"
                :model-value="selectedObject.displayName"
                @update:model-value="updateObject('displayName', $event)" /></el-form-item
            ><el-form-item label="描述"
              ><el-input
                class="aircas-input"
                type="textarea"
                :rows="3"
                :model-value="selectedObject.description"
                @update:model-value="updateObject('description', $event)" /></el-form-item></el-form
          ><el-button class="aircas-button" type="primary" @click="addAttribute(selectedObject.id)">添加属性</el-button></template
        ><template v-else-if="selectedAttribute"
          ><h2>属性检查器</h2>
          <small>所属对象：{{ selectedAttribute.owner }}</small
          ><el-form class="aircas-form" label-position="top"
            ><el-form-item label="属性名称"
              ><el-input
                class="aircas-input"
                :model-value="selectedAttribute.displayName"
                @update:model-value="updateAttribute('displayName', $event)" /></el-form-item
            ><el-form-item label="API"
              ><el-input class="aircas-input" :model-value="selectedAttribute.apiName" @update:model-value="updateAttribute('apiName', $event)" /></el-form-item
            ><el-form-item label="数据类型"
              ><el-select
                class="aircas-select"
                popper-class="aircas-select-popper"
                :model-value="selectedAttribute.dataType"
                @update:model-value="updateAttribute('dataType', $event)"
                ><el-option v-for="type in dataTypes" :key="type" :label="type" :value="type" /></el-select></el-form-item
            ><el-form-item label="存储分组"
              ><el-select
                class="aircas-select"
                popper-class="aircas-select-popper"
                :model-value="selectedAttribute.storageGroup"
                filterable
                allow-create
                default-first-option
                @update:model-value="updateAttribute('storageGroup', $event)"
                @change="registerStorageGroup"
                ><el-option v-for="group in storageGroupOptions" :key="group" :label="group" :value="group" /></el-select></el-form-item
            ><el-form-item label="默认值"
              ><el-input
                class="aircas-input"
                :model-value="selectedAttribute.defaultValue"
                @update:model-value="updateAttribute('defaultValue', $event)" /></el-form-item
            ><el-form-item label="属性描述"
              ><el-input
                class="aircas-input"
                type="textarea"
                :rows="2"
                :model-value="selectedAttribute.description"
                @update:model-value="updateAttribute('description', $event)" /></el-form-item></el-form
          ><el-checkbox :model-value="selectedAttribute.isPrimary" @update:model-value="updateAttribute('isPrimary', $event)">主键</el-checkbox
          ><el-checkbox :model-value="selectedAttribute.isNameKey" @update:model-value="updateAttribute('isNameKey', $event)">名称键</el-checkbox></template
        ><template v-else-if="selectedRelation"
          ><h2>关系检查器</h2>
          <small>拖动两端连到对象四边圆点，或在此选择源/目标</small
          ><el-form class="aircas-form" label-position="top"
            ><el-form-item label="关系名称"
              ><el-input
                class="aircas-input"
                :model-value="selectedRelation.displayName"
                @update:model-value="updateRelation('displayName', $event)" /></el-form-item
            ><el-form-item label="API 名称"
              ><el-input class="aircas-input" :model-value="selectedRelation.apiName" @update:model-value="updateRelation('apiName', $event)" /></el-form-item
            ><el-form-item label="源对象"
              ><el-select
                class="aircas-select"
                popper-class="aircas-select-popper"
                clearable
                :model-value="selectedRelation.sourceId"
                @update:model-value="updateRelation('sourceId', $event)"
                ><el-option v-for="object in objects" :key="object.id" :label="object.displayName" :value="object.id" /></el-select></el-form-item
            ><el-form-item label="目标对象"
              ><el-select
                class="aircas-select"
                popper-class="aircas-select-popper"
                clearable
                :model-value="selectedRelation.targetId"
                @update:model-value="updateRelation('targetId', $event)"
                ><el-option v-for="object in objects" :key="object.id" :label="object.displayName" :value="object.id" /></el-select></el-form-item
            ><el-form-item label="描述"
              ><el-input
                class="aircas-input"
                type="textarea"
                :rows="3"
                :model-value="selectedRelation.description"
                @update:model-value="updateRelation('description', $event)" /></el-form-item></el-form
        ></template>
        <div v-else class="conceptual-model-create__inspector-empty">选择画布中的对象、属性或关系进行编辑</div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { createOntologySpaceWithCanvasContentInterface } from "@/apis";
import type { CanvasLink, CanvasOntology, CanvasProperty, CreateOntologySpaceWithCanvasContentParams } from "@/types";
import ConceptualModelGraphCanvas from "./components/ConceptualModelGraphCanvas.vue";
import { findConflictingConceptualAttributeKey, formatConceptualAttributeKeyConflictMessage } from "./utils/groupConceptualAttributes";
import { removeRelationsConnectedToObject } from "./utils/removeRelationsConnectedToObject";
type PaletteType = "object" | "attribute" | "relation";
type Port = "top" | "right" | "bottom" | "left";
type Selection = { kind: "object" | "attribute" | "relation"; id: number };
interface Attribute {
  id: number;
  displayName: string;
  apiName: string;
  dataType: string;
  defaultValue: string;
  description: string;
  isPrimary: boolean;
  isNameKey: boolean;
  storageGroup: string;
}
interface ModelObject {
  id: number;
  displayName: string;
  apiName: string;
  description: string;
  x: number;
  y: number;
  attributes: Attribute[];
}
interface Relation {
  id: number;
  displayName: string;
  apiName: string;
  description: string;
  sourceId: number | null;
  targetId: number | null;
  sourcePort: Port | null;
  targetPort: Port | null;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
}
const router = useRouter();
const route = useRoute();
const graphCanvasRef = ref<{ zoomBy: (delta: number) => void; fit: () => void } | null>(null);
const spaceDisplayName = ref("新建本体空间");
const spaceApiName = ref("");
const routeSpaceId = computed(() => {
  const parsed = Number(route.query.spaceId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
});
const hasRouteSpaceContext = computed(
  () => routeSpaceId.value !== undefined || typeof route.query.spaceName === "string" || typeof route.query.spaceApiName === "string",
);
const saving = ref(false);
const saveError = ref("");
const zoom = ref(100);
const selected = ref<Selection | null>({ kind: "object", id: 1 });
const objects = ref<ModelObject[]>([{ id: 1, displayName: "Object_1", apiName: "Object_1", description: "", x: 120, y: 100, attributes: [] }]);
const relations = ref<Relation[]>([]);
const dataTypes = [
  "Boolean",
  "Integer",
  "Long",
  "Float",
  "Short",
  "Byte",
  "Double",
  "Decimal",
  "String",
  "Date",
  "Array",
  "Map",
  "Vector",
  "Timestamp",
  "MediaReference",
  "TimeSeries",
  "Attachment",
  "Geohash",
  "Geoshape",
  "Cipher",
  "Ontology",
];
const storageGroupOptions = ref(["main"]);
const dataTypeMap: Record<string, string> = {
  字符串: "String",
  整数: "Integer",
  小数: "Double",
  布尔: "Boolean",
  日期时间: "DateTime",
};
let sequence = 1;
const palette = [
  { type: "object" as const, label: "本体对象", hint: "UML Class · 可编辑名称与描述", glyph: "<<object>>" },
  { type: "attribute" as const, label: "对象属性", hint: "拖到对象上，或选中对象后点击", glyph: "+ attr: String" },
  { type: "relation" as const, label: "对象关系", hint: "实线单向箭头：连接两个对象", glyph: "→" },
];
const selectedObject = computed(() => (selected.value?.kind === "object" ? objects.value.find((item) => item.id === selected.value?.id) : undefined));
const selectedAttribute = computed(() => {
  if (selected.value?.kind !== "attribute") return undefined;
  for (const object of objects.value) {
    const attribute = object.attributes.find((item) => item.id === selected.value?.id);
    if (attribute) return { ...attribute, owner: object.displayName };
  }
  return undefined;
});
const selectedRelation = computed(() => (selected.value?.kind === "relation" ? relations.value.find((item) => item.id === selected.value?.id) : undefined));

/**
 * @description 从列表入口传入的路由上下文初始化空间信息。
 */
function initializeRouteSpaceContext() {
  if (typeof route.query.spaceName === "string" && route.query.spaceName.trim()) spaceDisplayName.value = route.query.spaceName;
  if (typeof route.query.spaceApiName === "string" && route.query.spaceApiName.trim()) spaceApiName.value = route.query.spaceApiName;
}

initializeRouteSpaceContext();
/** @description 返回空间管理页。 */
function goBack() {
  void router.push({ name: "OntologySpaceManagement" });
}
/** @description 选择画布元素。 */
function select(selection: Selection) {
  selected.value = selection;
}
/** @description 开始组件拖拽。 */
function startDrag(type: PaletteType, event: DragEvent) {
  event.dataTransfer?.setData("conceptual-model/type", type);
}
/** @description 添加对象、属性或关系。 */
function addPalette(type: PaletteType) {
  if (type === "object") addObject();
  else if (type === "attribute") addAttribute(selectedObject.value?.id);
  else addRelation();
}
/**
 * @description 添加对象。传入坐标时放在拖放位置，否则按网格排列。
 * @param x 画布横坐标。
 * @param y 画布纵坐标。
 */
function addObject(x?: number, y?: number) {
  const id = ++sequence;
  objects.value.push({
    id,
    displayName: `Object_${id}`,
    apiName: `Object_${id}`,
    description: "",
    x: x === undefined ? 120 + ((id - 1) % 3) * 230 : Math.max(0, Math.round(x)),
    y: y === undefined ? 100 + Math.floor((id - 1) / 3) * 170 : Math.max(0, Math.round(y)),
    attributes: [],
  });
  select({ kind: "object", id });
}
/** @description 添加属性到对象。 */
function addAttribute(objectId?: number) {
  const object = objects.value.find((item) => item.id === objectId) ?? selectedObject.value;
  if (!object) {
    ElMessage.info("请先选择一个本体对象");
    return;
  }
  const id = ++sequence;
  const name = `attr_${object.attributes.length + 1}`;
  object.attributes.push({
    id,
    displayName: name,
    apiName: name,
    dataType: "String",
    defaultValue: "",
    description: "",
    isPrimary: false,
    isNameKey: false,
    storageGroup: "main",
  });
  select({ kind: "attribute", id });
}
/**
 * @description 添加尚未连到对象的关系。传入坐标时以该点为中心。
 * @param x 画布横坐标。
 * @param y 画布纵坐标。
 */
function addRelation(x?: number, y?: number) {
  const id = ++sequence;
  const centerX = x === undefined ? 470 : Math.round(x);
  const centerY = y === undefined ? 300 : Math.round(y);
  relations.value.push({
    id,
    displayName: "未命名关系",
    apiName: `relation_${id}`,
    description: "",
    sourceId: null,
    targetId: null,
    sourcePort: null,
    targetPort: null,
    sourcePoint: { x: centerX - 110, y: centerY },
    targetPoint: { x: centerX + 110, y: centerY },
  });
  select({ kind: "relation", id });
}

/**
 * @description 从两个对象的连接点创建关系。同一个对象可以有多条关系，但不能连回自己。
 * @param sourceId 源对象 id。
 * @param targetId 目标对象 id。
 * @param sourcePort 源连接点。
 * @param targetPort 目标连接点。
 */
function addConnectedRelation(sourceId: number, targetId: number, sourcePort: Port, targetPort: Port) {
  if (sourceId === targetId) return;
  const id = ++sequence;
  relations.value.push({
    id,
    displayName: "未命名关系",
    apiName: `relation_${id}`,
    description: "",
    sourceId,
    targetId,
    sourcePort,
    targetPort,
    sourcePoint: { x: 0, y: 0 },
    targetPoint: { x: 0, y: 0 },
  });
  select({ kind: "relation", id });
}

/**
 * @description 写回对象在画布上的位置。
 * @param id 对象 id。
 * @param x 横坐标。
 * @param y 纵坐标。
 */
function moveObjectPosition(id: number, x: number, y: number) {
  const object = objects.value.find((item) => item.id === id);
  if (!object) return;
  object.x = x;
  object.y = y;
}

/**
 * @description 写回关系两端的对象、连接点和坐标。
 * @param id 关系 id。
 * @param patch 两端数据。
 */
function updateRelationEnds(
  id: number,
  patch: {
    sourceId: number | null;
    targetId: number | null;
    sourcePort: Port | null;
    targetPort: Port | null;
    sourcePoint: { x: number; y: number };
    targetPoint: { x: number; y: number };
  },
) {
  const relation = relations.value.find((item) => item.id === id);
  if (!relation) return;
  relation.sourceId = patch.sourceId;
  relation.targetId = patch.targetId;
  relation.sourcePort = patch.sourcePort;
  relation.targetPort = patch.targetPort;
  relation.sourcePoint = patch.sourcePoint;
  relation.targetPoint = patch.targetPoint;
}
/** @description 修改对象字段。 */
function updateObject(field: "apiName" | "displayName" | "description", value: string) {
  if (selectedObject.value) selectedObject.value[field] = value;
}
/** @description 修改属性字段。 */
function updateAttribute(field: keyof Attribute, value: string | boolean | number) {
  const owner = objects.value.find((item) => item.attributes.some((attr) => attr.id === selectedAttribute.value?.id));
  const attr = owner?.attributes.find((item) => item.id === selectedAttribute.value?.id);
  if (!owner || !attr) return;
  if (field === "isPrimary" || field === "isNameKey") {
    const enabled = value === true;
    if (!enabled) {
      attr[field] = false;
      return;
    }
    const kind = field === "isPrimary" ? "primary" : "name";
    const conflict = findConflictingConceptualAttributeKey(owner.attributes, kind, attr.id);
    if (conflict) {
      ElMessage.warning(formatConceptualAttributeKeyConflictMessage(kind, conflict));
      return;
    }
    attr[field] = true;
    return;
  }
  if (field === "storageGroup") {
    const group = String(value).trim();
    attr.storageGroup = group || "main";
    registerStorageGroup(attr.storageGroup);
    return;
  }
  attr[field] = value as never;
}
/** @description 将新输入的存储分组加入当前画布的本地选项。 @param value 存储分组值。 */
function registerStorageGroup(value: string | number | boolean) {
  const group = String(value).trim();
  if (!group) return;
  if (!storageGroupOptions.value.includes(group)) storageGroupOptions.value.push(group);
}
/** @description 修改关系字段。 */
function updateRelation(field: keyof Relation, value: string | number | null) {
  if (selectedRelation.value) selectedRelation.value[field] = value as never;
}
/** @description 清除选中元素。 */
function clearSelection() {
  selected.value = null;
}
/** @description 删除选中元素。 */
function deleteSelected() {
  const item = selected.value;
  if (!item) return;
  if (item.kind === "object") {
    objects.value = objects.value.filter((object) => object.id !== item.id);
    relations.value = removeRelationsConnectedToObject(relations.value, item.id);
  } else if (item.kind === "relation") relations.value = relations.value.filter((relation) => relation.id !== item.id);
  else
    objects.value.forEach((object) => {
      object.attributes = object.attributes.filter((attr) => attr.id !== item.id);
    });
  selected.value = null;
}
/** @description 缩小画布。 */
function zoomOut() {
  graphCanvasRef.value?.zoomBy(-0.1);
}
/** @description 放大画布。 */
function zoomIn() {
  graphCanvasRef.value?.zoomBy(0.1);
}
/** @description 适应画布。 */
function fitCanvas() {
  graphCanvasRef.value?.fit();
}
/** @description 将画布中的属性数据类型转换为后端枚举名称。 @param value 画布数据类型。 @returns 后端数据类型枚举名称。 */

function mapCanvasDataType(value: string): string {
  return dataTypeMap[value] ?? (dataTypes.includes(value) ? value : "String");
}

/** @description 将画布对象属性转换为创建空间接口属性。 @param attribute 画布属性。 @returns 接口属性参数。 */

function mapCanvasProperty(attribute: Attribute): CanvasProperty {
  return {
    displayName: attribute.displayName.trim(),
    apiName: attribute.apiName.trim(),
    dataType: mapCanvasDataType(attribute.dataType),
    description: attribute.description.trim(),
    isPrimaryKey: attribute.isPrimary,
    isTitleKey: attribute.isNameKey,
    storageGroup: attribute.storageGroup.trim() || "main",
    defaultValue: attribute.defaultValue,
  };
}

/** @description 将画布对象转换为创建空间接口对象。 @param object 画布对象。 @returns 接口本体对象参数。 */

function mapCanvasOntology(object: ModelObject): CanvasOntology {
  return {
    displayName: object.displayName.trim(),
    apiName: object.apiName.trim(),
    description: object.description.trim(),
    properties: object.attributes.map(mapCanvasProperty),
  };
}

/** @description 将已连接的画布关系转换为创建空间接口关系。 @param relation 画布关系。 @returns 接口关系参数或 undefined。 */

function mapCanvasLink(relation: Relation): CanvasLink | undefined {
  const source = objects.value.find((object) => object.id === relation.sourceId);
  const target = objects.value.find((object) => object.id === relation.targetId);
  if (!source || !target) return undefined;
  return {
    name: relation.displayName.trim(),
    apiName: relation.apiName.trim(),
    description: relation.description.trim(),
    fromOntologyApiName: source.apiName.trim(),
    toOntologyApiName: target.apiName.trim(),
  };
}

/** @description 按新建空间或已有空间场景组装画布保存请求体。 @returns 画布保存请求参数。 */

function buildCanvasSpaceParams(): CreateOntologySpaceWithCanvasContentParams {
  const params: CreateOntologySpaceWithCanvasContentParams = {
    ontologies: objects.value.map(mapCanvasOntology),
    links: relations.value
      .filter((relation) => relation.sourceId !== null && relation.targetId !== null)
      .map(mapCanvasLink)
      .filter((link): link is CanvasLink => link !== undefined),
  };
  if (routeSpaceId.value !== undefined) {
    params.spaceId = routeSpaceId.value;
  } else {
    params.displayName = spaceDisplayName.value.trim();
    params.apiName = spaceApiName.value.trim();
    params.description = "";
  }
  return params;
}

/** @description 调用画布保存接口，成功后进入目标空间概览，失败时保留当前画布。 */

async function saveConceptualModel() {
  if (saving.value) return;
  saveError.value = "";
  if (!spaceDisplayName.value.trim()) {
    saveError.value = "请输入空间名称。";
    ElMessage.warning(saveError.value);
    return;
  }
  if (!spaceApiName.value.trim()) {
    saveError.value = "请输入空间 API 名称。";
    ElMessage.warning(saveError.value);
    return;
  }
  const disconnectedRelation = relations.value.find((relation) => relation.sourceId === null || relation.targetId === null);
  if (disconnectedRelation) {
    saveError.value = `关系“${disconnectedRelation.displayName || "未命名关系"}”尚未连接完整。`;
    ElMessage.warning(saveError.value);
    return;
  }
  saving.value = true;
  try {
    const response = await createOntologySpaceWithCanvasContentInterface(buildCanvasSpaceParams());
    const spaceId = response.data?.spaceId ?? routeSpaceId.value;
    if (response.code !== 200 || !Number.isFinite(spaceId))
      throw new Error(response.message || (routeSpaceId.value === undefined ? "空间创建失败" : "保存失败"));
    ElMessage.success(routeSpaceId.value === undefined ? "空间创建成功" : "保存成功");
    await router.push({ name: "OntologySpaceManagementDetailOverview", params: { spaceId: String(spaceId) } });
  } catch (cause) {
    saveError.value =
      cause instanceof Error && cause.message.trim() ? cause.message : routeSpaceId.value === undefined ? "空间创建失败，请重试。" : "保存失败，请重试。";
    ElMessage.error(saveError.value);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.conceptual-model-create {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  gap: 12px;
  padding: 12px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-page-background);
}
.conceptual-model-create__topbar {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 72px;
  padding: 12px 14px;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 8px;
  background: linear-gradient(90deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow: 0 0 24px var(--aircas-color-accent-blue-soft);
}

:root[theme="light"] .conceptual-model-create__topbar {
  background: linear-gradient(90deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}
.conceptual-model-create__identity {
  flex: 1;
  min-width: 180px;
}
.conceptual-model-create__space-fields {
  display: grid;
  min-width: 300px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.conceptual-model-create__space-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}
.conceptual-model-create__space-field span {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
.conceptual-model-create__save-error {
  margin: 0;
  padding: 8px 12px;
  border: 1px solid var(--aircas-color-danger);
  border-radius: 6px;
  color: var(--aircas-color-danger);
  background: var(--aircas-color-danger-background);
  font-size: 12px;
}
.conceptual-model-create h1,
.conceptual-model-create h2 {
  margin: 0;
}
.conceptual-model-create h1 {
  font-size: 20px;
}
.conceptual-model-create h2 {
  font-size: 16px;
}
.conceptual-model-create p {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.conceptual-model-create__eyebrow {
  color: var(--aircas-color-accent-cyan);
  font-size: 11px;
  letter-spacing: 0.12em;
}
.conceptual-model-create__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
.conceptual-model-create__workspace {
  display: grid;
  grid-template-columns: 280px minmax(450px, 1fr) 300px;
  gap: 12px;
  min-height: 620px;
  flex: 1;
}
.conceptual-model-create__palette,
.conceptual-model-create__canvas-panel,
.conceptual-model-create__inspector {
  min-width: 0;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 8px;
  background: linear-gradient(180deg, var(--aircas-color-overlay), var(--aircas-color-panel-background-deep));
  box-shadow: 0 0 18px var(--aircas-color-accent-cyan-soft);
  overflow: hidden;
}

:root[theme="light"] .conceptual-model-create__palette,
:root[theme="light"] .conceptual-model-create__canvas-panel,
:root[theme="light"] .conceptual-model-create__inspector {
  background: linear-gradient(180deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}
.conceptual-model-create__palette,
.conceptual-model-create__inspector {
  padding: 16px;
}
.conceptual-model-create__palette-item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background-deep);
  text-align: left;
  cursor: grab;
}
.conceptual-model-create__palette-item:hover {
  border-color: var(--aircas-color-accent-cyan);
}
.conceptual-model-create__palette-item span:nth-child(2) {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}
.conceptual-model-create__palette-item small {
  color: var(--aircas-color-text-muted);
  font-size: 11px;
}
.conceptual-model-create__glyph {
  display: grid;
  width: 72px;
  height: 52px;
  place-items: center;
  border: 1px solid var(--aircas-color-accent-cyan);
  border-radius: 6px;
  color: var(--aircas-color-accent-cyan);
  font-size: 10px;
}
.conceptual-model-create__glyph.is-attribute {
  border-style: dashed;
  color: var(--aircas-color-accent-purple);
}
.conceptual-model-create__glyph.is-relation {
  border: 0;
  font-size: 22px;
}
.conceptual-model-create__palette-note {
  padding: 12px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
  line-height: 1.7;
}
.conceptual-model-create__canvas-panel {
  display: flex;
  min-height: 620px;
}
.conceptual-model-create__inspector h2 {
  margin: 0 0 5px;
}
.conceptual-model-create__inspector small {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
.conceptual-model-create__inspector-empty {
  display: grid;
  min-height: 200px;
  place-items: center;
  color: var(--aircas-color-text-muted);
  text-align: center;
  font-size: 12px;
}
.conceptual-model-create__inspector :deep(.el-checkbox) {
  margin-right: 14px;
}
@media (max-width: 1100px) {
  .conceptual-model-create__workspace {
    grid-template-columns: 240px minmax(400px, 1fr);
  }
  .conceptual-model-create__inspector {
    display: none;
  }
}
@media (max-width: 720px) {
  .conceptual-model-create__topbar {
    flex-wrap: wrap;
  }
  .conceptual-model-create__identity {
    order: 2;
    flex-basis: calc(100% - 80px);
  }
  .conceptual-model-create__actions {
    order: 4;
    flex-wrap: wrap;
  }
  .conceptual-model-create__workspace {
    grid-template-columns: 1fr;
  }
}
</style>
