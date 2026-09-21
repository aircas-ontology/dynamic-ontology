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
        <el-input v-model="spaceDisplayName" class="aircas-input" ariaLabel="空间名称" placeholder="空间名称" />
        <el-input v-model="spaceApiName" class="aircas-input" ariaLabel="空间 API 名称" placeholder="空间 API 名称" />
      </div>
      <div class="conceptual-model-create__actions">
        <span>{{ zoom }}%</span><el-button class="aircas-button" size="small" @click="zoomOut">缩小</el-button
        ><el-button class="aircas-button" size="small" @click="zoomIn">放大</el-button
        ><el-button class="aircas-button" size="small" @click="fitCanvas">适应画布</el-button
        ><el-button class="aircas-button" type="danger" size="small" :disabled="!selected" @click="deleteSelected">删除选中</el-button
        ><el-button class="aircas-button" type="primary" size="small" :loading="saving" @click="saveConceptualModel">保存并创建空间</el-button>
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
      <section ref="canvasRef" class="conceptual-model-create__canvas-panel" aria-label="概念模型画布" @dragover.prevent @drop="dropPalette">
        <div class="conceptual-model-create__canvas" @pointerdown.self="clearSelection">
          <div class="conceptual-model-create__stage" :style="{ transform: `scale(${zoom / 100})` }">
            <svg class="conceptual-model-create__edges" viewBox="0 0 1200 760">
              <defs>
                <marker id="model-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker>
              </defs>
              <g v-for="relation in relations" :key="relation.id">
                <line
                  class="conceptual-model-create__edge"
                  :class="{ 'is-selected': selected?.kind === 'relation' && selected.id === relation.id }"
                  :x1="pointFor(relation, 'source').x"
                  :y1="pointFor(relation, 'source').y"
                  :x2="pointFor(relation, 'target').x"
                  :y2="pointFor(relation, 'target').y"
                  marker-end="url(#model-arrow)"
                  @click.stop="select({ kind: 'relation', id: relation.id })"
                />
                <text
                  class="conceptual-model-create__edge-label"
                  :class="{ 'is-selected': selected?.kind === 'relation' && selected.id === relation.id }"
                  :x="(pointFor(relation, 'source').x + pointFor(relation, 'target').x) / 2"
                  :y="(pointFor(relation, 'source').y + pointFor(relation, 'target').y) / 2 - 8"
                  text-anchor="middle"
                >
                  {{ relation.displayName }}
                </text>
                <circle
                  v-for="endpoint in relationEndpoints"
                  :key="`${relation.id}-${endpoint}`"
                  class="conceptual-model-create__edge-port"
                  :class="[`is-${endpoint}`, { 'is-selected': selected?.kind === 'relation' && selected.id === relation.id }]"
                  :cx="pointFor(relation, endpoint).x"
                  :cy="pointFor(relation, endpoint).y"
                  r="6"
                  @pointerdown.stop="startRelationPortDrag(relation.id, endpoint, $event)"
                  @click.stop="select({ kind: 'relation', id: relation.id })"
                />
              </g>
            </svg>
            <div v-if="!objects.length" class="conceptual-model-create__empty"><strong>从左侧拖入 UML 组件</strong><span>开始构建你的空间概念模型</span></div>
            <article
              v-for="object in objects"
              :key="object.id"
              class="conceptual-model-create__object"
              :class="{ 'is-selected': selected?.kind === 'object' && selected.id === object.id }"
              :style="{ left: `${object.x}px`, top: `${object.y}px` }"
              @pointerdown.stop="startObjectDrag(object.id, $event)"
              @click.stop="select({ kind: 'object', id: object.id })"
            >
              <span class="conceptual-model-create__object-type">&lt;&lt;object&gt;&gt;</span><strong>{{ object.displayName }}</strong
              ><small>{{ object.displayName }}</small>
              <div v-if="object.attributes.length" class="conceptual-model-create__attributes">
                <button
                  v-for="attr in object.attributes"
                  :key="attr.id"
                  type="button"
                  @pointerdown.stop
                  @click.stop="select({ kind: 'attribute', id: attr.id })"
                >
                  + {{ attr.displayName }} <em>{{ attr.dataType }}</em>
                </button>
              </div>
              <span v-else class="conceptual-model-create__object-empty">将属性拖到此处，或点击下方添加</span
              ><button type="button" class="conceptual-model-create__add" @pointerdown.stop @click.stop="addAttribute(object.id)">添加属性</button
              ><button
                v-for="port in ports"
                :key="port"
                type="button"
                class="conceptual-model-create__port"
                :class="`is-${port}`"
                :aria-label="`${object.displayName}${port}连接点`"
                @pointerdown.stop="connectPort(object.id, port, $event)"
              ></button>
            </article>
          </div>
        </div>
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
              ><el-select class="aircas-input" :model-value="selectedAttribute.dataType" @update:model-value="updateAttribute('dataType', $event)"
                ><el-option v-for="type in dataTypes" :key="type" :label="type" :value="type" /></el-select></el-form-item
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
              ><el-select class="aircas-input" clearable :model-value="selectedRelation.sourceId" @update:model-value="updateRelation('sourceId', $event)"
                ><el-option v-for="object in objects" :key="object.id" :label="object.displayName" :value="object.id" /></el-select></el-form-item
            ><el-form-item label="目标对象"
              ><el-select class="aircas-input" clearable :model-value="selectedRelation.targetId" @update:model-value="updateRelation('targetId', $event)"
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
import { computed, onBeforeUnmount, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { createOntologySpaceWithCanvasContentInterface } from "@/apis";
import type { CanvasLink, CanvasOntology, CanvasProperty, CreateOntologySpaceWithCanvasContentParams } from "@/types";
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
const canvasRef = ref<HTMLElement | null>(null);
const spaceDisplayName = ref("新建本体空间");
const spaceApiName = ref("");
const saving = ref(false);
const saveError = ref("");
const zoom = ref(100);
const selected = ref<Selection | null>({ kind: "object", id: 1 });
const objects = ref<ModelObject[]>([{ id: 1, displayName: "Object_1", apiName: "Object_1", description: "", x: 120, y: 100, attributes: [] }]);
const relations = ref<Relation[]>([]);
const dataTypes = ["字符串", "整数", "小数", "布尔", "日期时间"];
const dataTypeMap: Record<string, string> = {
  字符串: "String",
  整数: "Integer",
  小数: "Double",
  布尔: "Boolean",
  日期时间: "DateTime",
};
const ports: Port[] = ["top", "right", "bottom", "left"];
const relationEndpoints: Array<"source" | "target"> = ["source", "target"];
let sequence = 1;
let dragState: { kind: "object"; id: number; offsetX: number; offsetY: number } | { kind: "relation"; id: number; endpoint: "source" | "target" } | null = null;
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
/** @description 返回空间管理页。 */ function goBack() {
  void router.push({ name: "OntologySpaceManagement" });
}
/** @description 选择画布元素。 */ function select(selection: Selection) {
  selected.value = selection;
}
/** @description 开始组件拖拽。 */ function startDrag(type: PaletteType, event: DragEvent) {
  event.dataTransfer?.setData("conceptual-model/type", type);
}
/** @description 处理组件拖放。 */ function dropPalette(event: DragEvent) {
  const type = event.dataTransfer?.getData("conceptual-model/type") as PaletteType | "";
  if (type) addPalette(type);
}
/** @description 添加对象、属性或关系。 */ function addPalette(type: PaletteType) {
  if (type === "object") addObject();
  else if (type === "attribute") addAttribute(selectedObject.value?.id);
  else addRelation();
}
/** @description 添加对象。 */ function addObject() {
  const id = ++sequence;
  objects.value.push({
    id,
    displayName: `Object_${id}`,
    apiName: `Object_${id}`,
    description: "",
    x: 120 + ((id - 1) % 3) * 230,
    y: 100 + Math.floor((id - 1) / 3) * 170,
    attributes: [],
  });
  select({ kind: "object", id });
}
/** @description 添加属性到对象。 */ function addAttribute(objectId?: number) {
  const object = objects.value.find((item) => item.id === objectId) ?? selectedObject.value;
  if (!object) {
    ElMessage.info("请先选择一个本体对象");
    return;
  }
  const id = ++sequence;
  const name = `attr_${object.attributes.length + 1}`;
  object.attributes.push({ id, displayName: name, apiName: name, dataType: "字符串", defaultValue: "", description: "", isPrimary: false, isNameKey: false });
  select({ kind: "attribute", id });
}
/** @description 添加待连接关系。 */ function addRelation() {
  const id = ++sequence;
  relations.value.push({
    id,
    displayName: "未命名关系",
    apiName: `relation_${id}`,
    description: "",
    sourceId: null,
    targetId: null,
    sourcePort: null,
    targetPort: null,
    sourcePoint: { x: 340, y: 300 },
    targetPoint: { x: 600, y: 300 },
  });
  select({ kind: "relation", id });
}
/** @description 开始拖动对象。 */ function startObjectDrag(id: number, event: PointerEvent) {
  const object = objects.value.find((item) => item.id === id);
  const canvas = canvasRef.value?.querySelector<HTMLElement>(".conceptual-model-create__canvas");
  if (!object || !canvas) return;
  const rect = canvas.getBoundingClientRect();
  dragState = {
    kind: "object",
    id,
    offsetX: (event.clientX - rect.left) / (zoom.value / 100) - object.x,
    offsetY: (event.clientY - rect.top) / (zoom.value / 100) - object.y,
  };
  select({ kind: "object", id });
  window.addEventListener("pointermove", moveObject);
  window.addEventListener("pointerup", stopObjectDrag, { once: true });
}
/** @description 移动对象节点。 */ function moveObject(event: PointerEvent) {
  if (!dragState || dragState.kind !== "object") return;
  const state = dragState;
  const canvas = canvasRef.value?.querySelector<HTMLElement>(".conceptual-model-create__canvas");
  const object = objects.value.find((item) => item.id === state.id);
  if (!canvas || !object) return;
  const rect = canvas.getBoundingClientRect();
  object.x = Math.max(0, (event.clientX - rect.left) / (zoom.value / 100) - state.offsetX);
  object.y = Math.max(0, (event.clientY - rect.top) / (zoom.value / 100) - state.offsetY);
}
/** @description 开始拖动关系端点。 */
function startRelationPortDrag(id: number, endpoint: "source" | "target", event: PointerEvent) {
  event.preventDefault();
  dragState = { kind: "relation", id, endpoint };
  select({ kind: "relation", id });
  window.addEventListener("pointermove", moveRelationPort);
  window.addEventListener("pointerup", stopRelationPort, { once: true });
}
/** @description 移动关系端点。 */
function moveRelationPort(event: PointerEvent) {
  if (!dragState || dragState.kind !== "relation") return;
  const state = dragState;
  const canvas = canvasRef.value?.querySelector<HTMLElement>(".conceptual-model-create__canvas");
  const relation = relations.value.find((item) => item.id === state.id);
  if (!canvas || !relation) return;
  const rect = canvas.getBoundingClientRect();
  const point = { x: (event.clientX - rect.left) / (zoom.value / 100), y: (event.clientY - rect.top) / (zoom.value / 100) };
  relation[state.endpoint === "source" ? "sourcePoint" : "targetPoint"] = point;
  if (state.endpoint === "source") {
    relation.sourceId = null;
    relation.sourcePort = null;
  } else {
    relation.targetId = null;
    relation.targetPort = null;
  }
}
/** @description 停止关系端点拖动，并将端点吸附到最近的对象连接点。 */
function stopRelationPort(event: PointerEvent) {
  if (dragState?.kind === "relation") {
    const state = dragState;
    const relation = relations.value.find((item) => item.id === state.id);
    const canvas = canvasRef.value?.querySelector<HTMLElement>(".conceptual-model-create__canvas");
    if (relation && canvas) {
      const rect = canvas.getBoundingClientRect();
      const point = { x: (event.clientX - rect.left) / (zoom.value / 100), y: (event.clientY - rect.top) / (zoom.value / 100) };
      let closest: { objectId: number; port: Port; point: { x: number; y: number }; distance: number } | undefined;
      for (const object of objects.value) {
        for (const port of ports) {
          const portPoint = objectPoint(object, port);
          const distance = Math.hypot(portPoint.x - point.x, portPoint.y - point.y);
          if (!closest || distance < closest.distance) closest = { objectId: object.id, port, point: portPoint, distance };
        }
      }
      if (closest && closest.distance <= 28) {
        if (state.endpoint === "source") {
          relation.sourceId = closest.objectId;
          relation.sourcePort = closest.port;
          relation.sourcePoint = closest.point;
        } else {
          relation.targetId = closest.objectId;
          relation.targetPort = closest.port;
          relation.targetPoint = closest.point;
        }
      }
    }
  }
  dragState = null;
  window.removeEventListener("pointermove", moveRelationPort);
}
/** @description 停止对象拖动。 */ function stopObjectDrag() {
  dragState = null;
  window.removeEventListener("pointermove", moveObject);
}
/** @description 连接关系到对象。 */ function connectPort(objectId: number, port: Port, event: PointerEvent) {
  if (selectedRelation.value) {
    const point = objectPoint(
      objects.value.find((item) => item.id === objectId)!,
      port,
    );
    if (selectedRelation.value.sourceId === null) {
      selectedRelation.value.sourceId = objectId;
      selectedRelation.value.sourcePort = port;
      selectedRelation.value.sourcePoint = point;
    } else {
      selectedRelation.value.targetId = objectId;
      selectedRelation.value.targetPort = port;
      selectedRelation.value.targetPoint = point;
    }
  }
  event.stopPropagation();
}
/** @description 计算对象连接点。 */ function objectPoint(object: ModelObject, port: Port) {
  return { x: object.x + (port === "left" ? 0 : port === "right" ? 190 : 95), y: object.y + (port === "top" ? 0 : port === "bottom" ? 120 : 60) };
}
/** @description 获取关系端点。 */ function pointFor(relation: Relation, endpoint: "source" | "target") {
  const object = objects.value.find((item) => item.id === (endpoint === "source" ? relation.sourceId : relation.targetId));
  const port = endpoint === "source" ? (relation.sourcePort ?? "right") : (relation.targetPort ?? "left");
  return object ? objectPoint(object, port) : endpoint === "source" ? relation.sourcePoint : relation.targetPoint;
}
/** @description 修改对象字段。 */ function updateObject(field: "apiName" | "displayName" | "description", value: string) {
  if (selectedObject.value) selectedObject.value[field] = value;
}
/** @description 修改属性字段。 */ function updateAttribute(field: keyof Attribute, value: string | boolean | number) {
  const owner = objects.value.find((item) => item.attributes.some((attr) => attr.id === selectedAttribute.value?.id));
  const attr = owner?.attributes.find((item) => item.id === selectedAttribute.value?.id);
  if (attr) attr[field] = value as never;
}
/** @description 修改关系字段。 */ function updateRelation(field: keyof Relation, value: string | number | null) {
  if (selectedRelation.value) selectedRelation.value[field] = value as never;
}
/** @description 清除选中元素。 */ function clearSelection() {
  selected.value = null;
}
/** @description 删除选中元素。 */ function deleteSelected() {
  const item = selected.value;
  if (!item) return;
  if (item.kind === "object") {
    objects.value = objects.value.filter((object) => object.id !== item.id);
    relations.value.forEach((relation) => {
      if (relation.sourceId === item.id) relation.sourceId = null;
      if (relation.targetId === item.id) relation.targetId = null;
    });
  } else if (item.kind === "relation") relations.value = relations.value.filter((relation) => relation.id !== item.id);
  else
    objects.value.forEach((object) => {
      object.attributes = object.attributes.filter((attr) => attr.id !== item.id);
    });
  selected.value = null;
}
/** @description 缩小画布。 */ function zoomOut() {
  zoom.value = Math.max(60, zoom.value - 10);
}
/** @description 放大画布。 */ function zoomIn() {
  zoom.value = Math.min(160, zoom.value + 10);
}
/** @description 适应画布。 */ function fitCanvas() {
  zoom.value = 100;
}
/** @description 将画布中的属性数据类型转换为后端枚举名称。 @param value 画布数据类型。 @returns 后端数据类型枚举名称。 */
function mapCanvasDataType(value: string): string {
  return dataTypeMap[value] ?? "String";
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

/** @description 组装画布一键创建空间接口请求体。 @returns 画布创建空间请求参数。 */
function buildCanvasSpaceParams(): CreateOntologySpaceWithCanvasContentParams {
  return {
    displayName: spaceDisplayName.value.trim(),
    apiName: spaceApiName.value.trim(),
    iconUrl: "",
    description: "",
    ontologies: objects.value.map(mapCanvasOntology),
    links: relations.value
      .filter((relation) => relation.sourceId !== null && relation.targetId !== null)
      .map(mapCanvasLink)
      .filter((link): link is CanvasLink => link !== undefined),
  };
}

/** @description 调用画布一键创建空间接口，成功后进入新空间概览，失败时保留当前画布。 */
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
    const spaceId = response.data?.spaceId;
    if (response.code !== 200 || !Number.isFinite(spaceId)) throw new Error(response.message || "空间创建失败");
    ElMessage.success("空间创建成功");
    await router.push({ name: "OntologySpaceManagementDetailOverview", params: { spaceId: String(spaceId) } });
  } catch (cause) {
    saveError.value = cause instanceof Error && cause.message.trim() ? cause.message : "空间创建失败，请重试。";
    ElMessage.error(saveError.value);
  } finally {
    saving.value = false;
  }
}
onBeforeUnmount(() => {
  window.removeEventListener("pointermove", moveObject);
  window.removeEventListener("pointerup", stopObjectDrag);
  window.removeEventListener("pointermove", moveRelationPort);
  window.removeEventListener("pointerup", stopRelationPort);
});
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
  min-height: 92px;
  padding: 14px 18px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 10px;
  background: var(--aircas-color-panel-background);
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
.conceptual-model-create__space-input {
  width: 190px;
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
  border: 1px solid var(--aircas-color-border);
  border-radius: 10px;
  background: var(--aircas-color-panel-background);
  overflow: hidden;
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
.conceptual-model-create__canvas {
  height: 100%;
  min-height: 620px;
  overflow: auto;
  background: var(--aircas-color-panel-background-deep);
}
.conceptual-model-create__stage {
  position: relative;
  width: 1200px;
  height: 760px;
  transform-origin: 0 0;
}
.conceptual-model-create__edges {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.conceptual-model-create__edges marker path {
  fill: var(--aircas-color-accent-cyan);
}
.conceptual-model-create__edge {
  stroke: var(--aircas-color-accent-cyan);
  stroke-width: 2;
  pointer-events: stroke;
  cursor: pointer;
}
.conceptual-model-create__edge.is-selected {
  stroke: var(--aircas-color-accent-purple);
  stroke-width: 3;
}
.conceptual-model-create__edge-label {
  fill: var(--aircas-color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  paint-order: stroke;
  pointer-events: none;
  stroke: var(--aircas-color-panel-background-deep);
  stroke-width: 4px;
}
.conceptual-model-create__edge-label.is-selected {
  fill: var(--aircas-color-accent-purple);
}
.conceptual-model-create__edge-port {
  fill: var(--aircas-color-accent-cyan);
  stroke: var(--aircas-color-panel-background);
  stroke-width: 2;
  pointer-events: all;
  cursor: grab;
}
.conceptual-model-create__edge-port.is-target {
  fill: var(--aircas-color-accent-purple);
}
.conceptual-model-create__edge-port.is-selected {
  r: 7;
}
.conceptual-model-create__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  color: var(--aircas-color-text-muted);
}
.conceptual-model-create__object {
  position: absolute;
  z-index: 2;
  display: flex;
  width: 190px;
  min-height: 120px;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
  box-shadow: 0 8px 18px var(--aircas-color-divider);
  cursor: move;
}
.conceptual-model-create__object.is-selected {
  border-color: var(--aircas-color-accent-cyan);
  box-shadow: 0 0 14px var(--aircas-color-accent-cyan-soft);
}
.conceptual-model-create__object-type {
  color: var(--aircas-color-accent-cyan);
  font-size: 10px;
}
.conceptual-model-create__object small {
  color: var(--aircas-color-text-secondary);
}
.conceptual-model-create__attributes {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-top: 1px solid var(--aircas-color-border-soft);
  padding-top: 5px;
  font-size: 11px;
}
.conceptual-model-create__attributes button {
  border: 0;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.conceptual-model-create__attributes em {
  float: right;
  color: var(--aircas-color-text-muted);
  font-style: normal;
}
.conceptual-model-create__object-empty {
  margin-top: 8px;
  color: var(--aircas-color-text-muted);
  font-size: 10px;
}
.conceptual-model-create__add {
  align-self: flex-start;
  padding: 0;
  border: 0;
  color: var(--aircas-color-accent-cyan);
  background: transparent;
  font-size: 11px;
  cursor: pointer;
}
.conceptual-model-create__port {
  position: absolute;
  width: 10px;
  height: 10px;
  padding: 0;
  border: 2px solid var(--aircas-color-panel-background);
  border-radius: 50%;
  background: var(--aircas-color-accent-cyan);
  cursor: crosshair;
}
.conceptual-model-create__port.is-top {
  top: -6px;
  left: calc(50% - 5px);
}
.conceptual-model-create__port.is-right {
  top: calc(50% - 5px);
  right: -6px;
}
.conceptual-model-create__port.is-bottom {
  bottom: -6px;
  left: calc(50% - 5px);
}
.conceptual-model-create__port.is-left {
  top: calc(50% - 5px);
  left: -6px;
  background: var(--aircas-color-accent-purple);
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
  .conceptual-model-create__space-input {
    order: 3;
    width: 100%;
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
