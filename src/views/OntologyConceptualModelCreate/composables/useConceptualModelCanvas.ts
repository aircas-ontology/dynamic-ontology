import { computed, onBeforeUnmount, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import type {
  ConceptualModelAttribute,
  ConceptualModelObject,
  ConceptualModelPaletteItem,
  ConceptualModelPaletteType,
  ConceptualModelPort,
  ConceptualModelRelation,
  ConceptualModelSelection,
} from "@/types";
import { objectPoint, pointFor as resolveRelationPoint } from "../utils/conceptualModelGeometry";

type DragState = { kind: "object"; id: number; offsetX: number; offsetY: number } | { kind: "relation"; id: number; endpoint: "source" | "target" };

/**
 * @description 概念模型画布页面状态与交互：对象/属性/关系编辑、拖拽连线、缩放与保存提示。
 * @returns 页面模板所需的状态与操作方法
 */
export function useConceptualModelCanvas() {
  const router = useRouter();
  const canvasRef = ref<HTMLElement | null>(null);
  const spaceApiName = ref("");
  const zoom = ref(100);
  const selected = ref<ConceptualModelSelection | null>({ kind: "object", id: 1 });
  const objects = ref<ConceptualModelObject[]>([{ id: 1, displayName: "Object_1", apiName: "Object_1", description: "", x: 120, y: 100, attributes: [] }]);
  const relations = ref<ConceptualModelRelation[]>([]);
  const dataTypes = ["字符串", "整数", "小数", "布尔", "日期时间"];
  const ports: ConceptualModelPort[] = ["top", "right", "bottom", "left"];
  const relationEndpoints: Array<"source" | "target"> = ["source", "target"];
  let sequence = 1;
  let dragState: DragState | null = null;
  const palette: ConceptualModelPaletteItem[] = [
    { type: "object", label: "本体对象", hint: "UML Class · 可编辑名称与描述", glyph: "<<object>>" },
    { type: "attribute", label: "对象属性", hint: "拖到对象上，或选中对象后点击", glyph: "+ attr: String" },
    { type: "relation", label: "对象关系", hint: "实线单向箭头：连接两个对象", glyph: "→" },
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

  /** @description 返回空间管理页。 */
  function goBack() {
    void router.push({ name: "OntologySpaceManagement" });
  }

  /** @description 选择画布元素。 */
  function select(selection: ConceptualModelSelection) {
    selected.value = selection;
  }

  /** @description 开始组件拖拽。 */
  function startDrag(type: ConceptualModelPaletteType, event: DragEvent) {
    event.dataTransfer?.setData("conceptual-model/type", type);
  }

  /** @description 处理组件拖放。 */
  function dropPalette(event: DragEvent) {
    const type = event.dataTransfer?.getData("conceptual-model/type") as ConceptualModelPaletteType | "";
    if (type) addPalette(type);
  }

  /** @description 添加对象、属性或关系。 */
  function addPalette(type: ConceptualModelPaletteType) {
    if (type === "object") addObject();
    else if (type === "attribute") addAttribute(selectedObject.value?.id);
    else addRelation();
  }

  /** @description 添加对象。 */
  function addObject() {
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
      dataType: "字符串",
      defaultValue: "",
      description: "",
      isPrimary: false,
      isNameKey: false,
    });
    select({ kind: "attribute", id });
  }

  /** @description 添加待连接关系。 */
  function addRelation() {
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

  /** @description 开始拖动对象。 */
  function startObjectDrag(id: number, event: PointerEvent) {
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

  /** @description 移动对象节点。 */
  function moveObject(event: PointerEvent) {
    if (!dragState || dragState.kind !== "object") return;
    const state = dragState;
    const canvas = canvasRef.value?.querySelector<HTMLElement>(".conceptual-model-create__canvas");
    const object = objects.value.find((item) => item.id === state.id);
    if (!canvas || !object) return;
    const rect = canvas.getBoundingClientRect();
    object.x = Math.max(0, (event.clientX - rect.left) / (zoom.value / 100) - state.offsetX);
    object.y = Math.max(0, (event.clientY - rect.top) / (zoom.value / 100) - state.offsetY);
  }

  /**
   * @description 开始拖动关系端点。
   * @param id 关系 id
   * @param endpoint 源端或目标端
   * @param event 指针事件
   */
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

  /**
   * @description 停止关系端点拖动，并将端点吸附到最近的对象连接点。
   * @param event 指针抬起事件
   */
  function stopRelationPort(event: PointerEvent) {
    if (dragState?.kind === "relation") {
      const state = dragState;
      const relation = relations.value.find((item) => item.id === state.id);
      const canvas = canvasRef.value?.querySelector<HTMLElement>(".conceptual-model-create__canvas");
      if (relation && canvas) {
        const rect = canvas.getBoundingClientRect();
        const point = { x: (event.clientX - rect.left) / (zoom.value / 100), y: (event.clientY - rect.top) / (zoom.value / 100) };
        let closest: { objectId: number; port: ConceptualModelPort; point: { x: number; y: number }; distance: number } | undefined;
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

  /** @description 停止对象拖动。 */
  function stopObjectDrag() {
    dragState = null;
    window.removeEventListener("pointermove", moveObject);
  }

  /**
   * @description 连接关系到对象。
   * @param objectId 对象 id
   * @param port 连接点
   * @param event 指针事件
   */
  function connectPort(objectId: number, port: ConceptualModelPort, event: PointerEvent) {
    if (selectedRelation.value) {
      const object = objects.value.find((item) => item.id === objectId);
      if (!object) return;
      const point = objectPoint(object, port);
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

  /**
   * @description 获取关系端点坐标。
   * @param relation 关系
   * @param endpoint 源端或目标端
   * @returns 端点坐标
   */
  function pointFor(relation: ConceptualModelRelation, endpoint: "source" | "target") {
    return resolveRelationPoint(relation, endpoint, objects.value);
  }

  /**
   * @description 修改对象字段。
   * @param field 字段名
   * @param value 字段值
   */
  function updateObject(field: "apiName" | "displayName" | "description", value: string) {
    if (selectedObject.value) selectedObject.value[field] = value;
  }

  /**
   * @description 修改属性字段。
   * @param field 字段名
   * @param value 字段值
   */
  function updateAttribute(field: keyof ConceptualModelAttribute, value: string | boolean | number) {
    const owner = objects.value.find((item) => item.attributes.some((attr) => attr.id === selectedAttribute.value?.id));
    const attr = owner?.attributes.find((item) => item.id === selectedAttribute.value?.id);
    if (!attr) return;
    if (field === "isPrimary" || field === "isNameKey") {
      attr[field] = Boolean(value);
      return;
    }
    if (field === "displayName" || field === "apiName" || field === "dataType" || field === "defaultValue" || field === "description") {
      attr[field] = String(value);
    }
  }

  /**
   * @description 修改关系字段。
   * @param field 字段名
   * @param value 字段值
   */
  function updateRelation(field: keyof ConceptualModelRelation, value: string | number | null | undefined) {
    if (!selectedRelation.value) return;
    if (field === "sourceId" || field === "targetId") {
      selectedRelation.value[field] = typeof value === "number" ? value : null;
      return;
    }
    if (field === "displayName" || field === "apiName" || field === "description") {
      selectedRelation.value[field] = String(value ?? "");
    }
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

  /** @description 缩小画布。 */
  function zoomOut() {
    zoom.value = Math.max(60, zoom.value - 10);
  }

  /** @description 放大画布。 */
  function zoomIn() {
    zoom.value = Math.min(160, zoom.value + 10);
  }

  /** @description 适应画布。 */
  function fitCanvas() {
    zoom.value = 100;
  }

  /** @description 保存概念模型。 */
  function saveConceptualModel() {
    ElMessage.success("概念模型已保存，空间创建流程已准备就绪");
  }

  /**
   * @description 绑定画布面板根节点，供拖拽坐标换算读取 DOM。
   * @param el 画布面板元素
   */
  function setCanvasPanelEl(el: HTMLElement | null) {
    canvasRef.value = el;
  }

  onBeforeUnmount(() => {
    window.removeEventListener("pointermove", moveObject);
    window.removeEventListener("pointerup", stopObjectDrag);
    window.removeEventListener("pointermove", moveRelationPort);
    window.removeEventListener("pointerup", stopRelationPort);
  });

  return {
    canvasRef,
    setCanvasPanelEl,
    spaceApiName,
    zoom,
    selected,
    objects,
    relations,
    dataTypes,
    ports,
    relationEndpoints,
    palette,
    selectedObject,
    selectedAttribute,
    selectedRelation,
    goBack,
    select,
    startDrag,
    dropPalette,
    addPalette,
    addAttribute,
    startObjectDrag,
    startRelationPortDrag,
    connectPort,
    pointFor,
    updateObject,
    updateAttribute,
    updateRelation,
    clearSelection,
    deleteSelected,
    zoomOut,
    zoomIn,
    fitCanvas,
    saveConceptualModel,
  };
}
