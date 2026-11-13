import { computed, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getActionTreeNodeDefsInterface,
  getOntologyActionInfoInterface,
  postCreateBehaviorTreeActionInterface,
  putUpdateBehaviorTreeActionInterface,
} from "@/apis";
import type {
  ActionTreeBindableAction,
  BehaviorTreeBlackboardItem,
  BehaviorTreeDragPayload,
  BehaviorTreeInspectorTab,
  BehaviorTreeKindMeta,
  BehaviorTreeModel,
  BehaviorTreeNodeDraft,
  BehaviorTreeNodeKind,
  BehaviorTreeOrchestrationLoadStatus,
  BehaviorTreeOrchestrationMeta,
  BehaviorTreePersistMode,
  BehaviorTreeSaveStatus,
  BehaviorTreeValueType,
} from "@/types";
import { BEHAVIOR_TREE_VALUE_TYPES, createBehaviorTreeKindMetaMap } from "../utils/behaviorTreeConstants.ts";
import { buildBehaviorTreeSavePayload, importBehaviorTreeDefinition } from "../utils/behaviorTreeDefinition.ts";
import { layoutBehaviorTreeRoots } from "../utils/behaviorTreeLayout.ts";
import {
  canAttachBehaviorTreeChild,
  createDefaultBehaviorTreeConfig,
  createEmptyBehaviorTreeModel,
  findBehaviorTreeNode,
  findBehaviorTreeParent,
  nextBehaviorTreeNodeId,
  placeOfNewBehaviorTreeNode,
  removeBehaviorTreeNodeFromTree,
  renameBehaviorTreeKeyRefs,
  reorderBehaviorTreeChild,
  reparentBehaviorTreeNode,
} from "../utils/behaviorTreeModel.ts";
import { extractBehaviorTreeDefinitionFromDetail, resolveBehaviorTreeSaveMethod } from "../utils/behaviorTreePersistence.ts";
import { collectBehaviorTreeErrors, collectBehaviorTreeWarnings } from "../utils/behaviorTreeValidate.ts";

/**
 * @description 管理行为树编排工作区状态：目录加载、详情加载、树模型、保存与画布命令。
 * @param meta 编排元数据。
 * @param options 可选回调。
 * @returns 工作区状态与命令。
 */
export function useBehaviorTreeOrchestration(meta: BehaviorTreeOrchestrationMeta, options: { onPersisted?: (mode: BehaviorTreePersistMode) => void } = {}) {
  const kindMeta = reactive(createBehaviorTreeKindMetaMap()) as Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>;
  const model = reactive(createEmptyBehaviorTreeModel()) as BehaviorTreeModel;
  const availableActions = ref<ActionTreeBindableAction[]>([]);
  const selectedId = ref<string | null>(null);
  const activeTab = ref<BehaviorTreeInspectorTab>("node");
  const defsStatus = ref<BehaviorTreeOrchestrationLoadStatus>("idle");
  const defsError = ref("");
  const detailStatus = ref<BehaviorTreeOrchestrationLoadStatus>("idle");
  const detailError = ref("");
  const saveStatus = ref<BehaviorTreeSaveStatus>("idle");
  const hasPersisted = ref(Boolean(meta.isEditMode));
  const revision = ref(0);
  const seq = { value: 1 };
  let defsToken = 0;
  let detailToken = 0;
  let saveToken = 0;

  const selectedNode = computed(() => findBehaviorTreeNode(model.roots, selectedId.value));
  const definitionJson = computed(() => {
    revision.value;
    return JSON.stringify(buildBehaviorTreeSavePayload(model, kindMeta, meta).treeDefinition, null, 2);
  });
  const payloadJson = computed(() => {
    revision.value;
    return JSON.stringify(buildBehaviorTreeSavePayload(model, kindMeta, meta), null, 2);
  });
  const validationErrors = computed(() => {
    revision.value;
    return collectBehaviorTreeErrors(model, kindMeta);
  });
  const validationWarnings = computed(() => {
    revision.value;
    return collectBehaviorTreeWarnings(model, availableActions.value);
  });

  /**
   * @description 触发视图刷新令牌。
   */
  function bumpRevision(): void {
    revision.value += 1;
  }

  /**
   * @description 加载节点目录与可绑定行为。
   */
  async function loadBehaviorTreeNodeDefs(): Promise<void> {
    const token = ++defsToken;
    const spaceId = Number(meta.spaceId);
    defsStatus.value = "loading";
    defsError.value = "";
    if (!Number.isInteger(spaceId)) {
      defsStatus.value = "error";
      defsError.value = "空间标识无效";
      availableActions.value = [];
      return;
    }
    try {
      const response = await getActionTreeNodeDefsInterface({ ontologySpaceId: spaceId });
      if (token !== defsToken) return;
      if ((response.code !== 0 && response.code !== 200) || !response.data) {
        throw new Error(response.message || "节点目录加载失败");
      }
      for (const item of response.data.nodes ?? []) {
        const kind = item.kind as BehaviorTreeNodeKind;
        if (!kindMeta[kind]) continue;
        if (item.name) kindMeta[kind].name = item.name;
        if (item.category === "COMPOSITE" || item.category === "DECORATOR" || item.category === "LEAF") {
          kindMeta[kind].category = item.category;
        }
        if (typeof item.maxChildren === "number") kindMeta[kind].maxChildren = item.maxChildren;
      }
      availableActions.value = response.data.availableActions ?? [];
      defsStatus.value = "ready";
    } catch (error) {
      if (token !== defsToken) return;
      availableActions.value = [];
      defsStatus.value = "error";
      defsError.value = error instanceof Error ? error.message : "节点目录加载失败";
    }
  }

  /**
   * @description 选中节点并切到节点配置 Tab。
   * @param id 节点 id。
   */
  function selectBehaviorTreeNode(id: string | null): void {
    selectedId.value = id;
    if (id) activeTab.value = "node";
    bumpRevision();
  }

  /**
   * @description 新增节点。
   * @param kind 节点 kind。
   * @param parentId 父节点；空则尝试挂到选中/根。
   * @param preset 预设（如 actionApi）。
   * @param point 画布落点。
   */
  function addBehaviorTreeNode(
    kind: BehaviorTreeNodeKind,
    parentId: string | null,
    preset: BehaviorTreeDragPayload | null = null,
    point: { x: number; y: number } | null = null,
  ): void {
    const metaOfKind = kindMeta[kind];
    if (!metaOfKind) {
      ElMessage.error(`未知节点类型：${kind}`);
      return;
    }
    let targetParentId = parentId;
    if (targetParentId) {
      if (!canAttachBehaviorTreeChild(model.roots, kindMeta, targetParentId, null)) {
        ElMessage.warning(`${metaOfKind.name} 不能挂到该节点下（叶子节点或装饰器已满）`);
        return;
      }
    } else if (model.roots.length >= 1) {
      const selected = findBehaviorTreeNode(model.roots, selectedId.value);
      let fallback = selected && canAttachBehaviorTreeChild(model.roots, kindMeta, selected.id, null) ? selected.id : null;
      const rootNode = model.roots[0];
      if (!fallback && rootNode && canAttachBehaviorTreeChild(model.roots, kindMeta, rootNode.id, null)) fallback = rootNode.id;
      if (!fallback) {
        ElMessage.warning("只能有一个根节点，且当前根节点无法接收子节点");
        return;
      }
      targetParentId = fallback;
    }
    const anchor = findBehaviorTreeNode(model.roots, targetParentId) || findBehaviorTreeNode(model.roots, selectedId.value);
    const pos = placeOfNewBehaviorTreeNode(anchor, point);
    const node: BehaviorTreeNodeDraft = {
      id: nextBehaviorTreeNodeId(model.roots, seq),
      kind,
      displayName: metaOfKind.name,
      enabled: true,
      skipIf: "",
      whileCondition: "",
      config: createDefaultBehaviorTreeConfig(kind),
      children: [],
      _x: pos.x,
      _y: pos.y,
    };
    if (preset?.actionApi && kind === "ACTION" && node.config) node.config.actionApi = preset.actionApi;
    if (targetParentId) findBehaviorTreeNode(model.roots, targetParentId)?.children.push(node);
    else model.roots.push(node);
    selectedId.value = node.id;
    activeTab.value = "node";
    bumpRevision();
  }

  /**
   * @description 连接父子节点。
   * @param parentId 父 id。
   * @param childId 子 id。
   */
  function connectBehaviorTreeNodes(parentId: string, childId: string): void {
    const parent = findBehaviorTreeNode(model.roots, parentId);
    const child = findBehaviorTreeNode(model.roots, childId);
    if (!parent || !child || parentId === childId) return;
    if (!canAttachBehaviorTreeChild(model.roots, kindMeta, parentId, childId)) {
      if (canAttachBehaviorTreeChild(model.roots, kindMeta, childId, parentId)) {
        connectBehaviorTreeNodes(childId, parentId);
        return;
      }
      ElMessage.warning("无法建立该连线（叶子不能作父、装饰器已满或会成环）");
      return;
    }
    reparentBehaviorTreeNode(model, childId, parentId);
    selectedId.value = childId;
    bumpRevision();
    ElMessage.success(`已挂到「${parent.displayName || kindMeta[parent.kind].name}」下`);
  }

  /**
   * @description 删除节点及子树。
   * @param id 节点 id。
   */
  async function deleteBehaviorTreeNode(id: string): Promise<void> {
    const node = findBehaviorTreeNode(model.roots, id);
    if (!node) return;
    try {
      await ElMessageBox.confirm(`删除节点「${node.displayName || kindMeta[node.kind].name}」及其子树？`, "确定删除", {
        type: "warning",
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
      });
    } catch {
      return;
    }
    removeBehaviorTreeNodeFromTree(model, id);
    if (selectedId.value === id) selectedId.value = null;
    bumpRevision();
    ElMessage.success("已删除节点");
  }

  /**
   * @description 脱离父节点设为根。
   * @param id 节点 id。
   */
  async function detachBehaviorTreeNodeToRoot(id: string): Promise<void> {
    const node = findBehaviorTreeNode(model.roots, id);
    const parent = findBehaviorTreeParent(model.roots, id);
    if (!node || !parent) return;
    try {
      await ElMessageBox.confirm(`把「${node.displayName || kindMeta[node.kind].name}」设为根节点？树会暂时有多个根。`, "设为根节点", {
        type: "warning",
        confirmButtonText: "设为根节点",
        cancelButtonText: "取消",
      });
    } catch {
      return;
    }
    removeBehaviorTreeNodeFromTree(model, id);
    model.roots.push(node);
    selectedId.value = id;
    bumpRevision();
  }

  /**
   * @description 自动布局。
   */
  function layoutBehaviorTree(): void {
    layoutBehaviorTreeRoots(model.roots);
    bumpRevision();
  }

  /**
   * @description 清空整棵树。
   */
  async function clearBehaviorTree(): Promise<void> {
    try {
      await ElMessageBox.confirm("清空当前行为树定义？", "清空", { type: "warning", confirmButtonText: "清空", cancelButtonText: "取消" });
    } catch {
      return;
    }
    model.blackboard.splice(0, model.blackboard.length);
    model.roots.splice(0, model.roots.length);
    selectedId.value = null;
    seq.value = 1;
    bumpRevision();
  }

  /**
   * @description 新增黑板键。
   */
  function addBehaviorTreeBlackboardRow(): void {
    const index = model.blackboard.length + 1;
    model.blackboard.push({
      key: `key_${index}`,
      valueType: "STRING",
      bindPropertyUniqueIdentifier: "",
      defaultValueText: "",
      description: "",
    });
    bumpRevision();
  }

  /**
   * @description 更新黑板行字段。
   * @param index 行下标。
   * @param field 字段。
   * @param value 新值。
   */
  function updateBehaviorTreeBlackboardField(index: number, field: keyof BehaviorTreeBlackboardItem, value: string): void {
    const item = model.blackboard[index];
    if (!item) return;
    if (field === "key") {
      const oldKey = item.key.trim();
      item.key = value;
      renameBehaviorTreeKeyRefs(model.roots, oldKey, value.trim());
    } else if (field === "valueType") {
      item.valueType = (BEHAVIOR_TREE_VALUE_TYPES.includes(value as BehaviorTreeValueType) ? value : "STRING") as BehaviorTreeValueType;
    } else {
      item[field] = value;
    }
    bumpRevision();
  }

  /**
   * @description 删除黑板行。
   * @param index 行下标。
   */
  function deleteBehaviorTreeBlackboardRow(index: number): void {
    model.blackboard.splice(index, 1);
    bumpRevision();
  }

  /**
   * @description 应用定义 JSON。
   * @param raw JSON 文本。
   */
  function applyBehaviorTreeDefinitionJson(raw: string): void {
    try {
      const parsed = JSON.parse(raw) as Parameters<typeof importBehaviorTreeDefinition>[0];
      const next = importBehaviorTreeDefinition(parsed);
      model.blackboard.splice(0, model.blackboard.length, ...next.blackboard);
      model.roots.splice(0, model.roots.length, ...next.roots);
      selectedId.value = null;
      layoutBehaviorTreeRoots(model.roots);
      bumpRevision();
      ElMessage.success("已应用定义 JSON");
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : "定义 JSON 无效");
    }
  }

  /**
   * @description 编辑态加载已有行为树详情并导入定义。
   */
  async function loadBehaviorTreeDetail(): Promise<void> {
    if (!meta.isEditMode && !hasPersisted.value) {
      detailStatus.value = "idle";
      detailError.value = "";
      return;
    }
    const token = ++detailToken;
    detailStatus.value = "loading";
    detailError.value = "";
    const spaceId = meta.spaceId.trim();
    const actionApi = meta.actionApi.trim();
    if (!spaceId || !actionApi) {
      detailStatus.value = "error";
      detailError.value = "空间标识或行为 api 无效，无法加载详情";
      return;
    }
    try {
      const response = await getOntologyActionInfoInterface({ actionApi, ontologySpaceId: spaceId });
      if (token !== detailToken) return;
      if ((response.code !== 0 && response.code !== 200) || !response.data) {
        throw new Error(response.message || "行为详情加载失败");
      }
      const definition = extractBehaviorTreeDefinitionFromDetail(response.data);
      const next = importBehaviorTreeDefinition(definition);
      model.blackboard.splice(0, model.blackboard.length, ...next.blackboard);
      model.roots.splice(0, model.roots.length, ...next.roots);
      selectedId.value = null;
      layoutBehaviorTreeRoots(model.roots);
      hasPersisted.value = true;
      bumpRevision();
      detailStatus.value = "ready";
      ElMessage.success("已加载行为树定义");
    } catch (error) {
      if (token !== detailToken) return;
      detailStatus.value = "error";
      detailError.value = error instanceof Error ? error.message : "行为详情加载失败";
      ElMessage.error(detailError.value);
    }
  }

  /**
   * @description 校验后创建或更新行为树；成功后停留当前页。
   */
  async function saveBehaviorTreeAction(): Promise<void> {
    if (saveStatus.value === "submitting") return;
    const errors = collectBehaviorTreeErrors(model, kindMeta);
    if (!meta.spaceId.trim()) errors.unshift("对象空间 id 不能为空");
    if (!meta.actionApi.trim()) errors.unshift("行为 api 不能为空");
    if (!meta.displayName.trim()) errors.unshift("显示名称不能为空");
    if (!meta.categoryId.trim()) errors.unshift("行为分类不能为空");
    if (errors.length) {
      activeTab.value = "json";
      ElMessage.warning(errors[0]);
      return;
    }
    const token = ++saveToken;
    saveStatus.value = "submitting";
    const method = resolveBehaviorTreeSaveMethod(hasPersisted.value);
    const payload = buildBehaviorTreeSavePayload(model, kindMeta, meta);
    try {
      const response = method === "POST" ? await postCreateBehaviorTreeActionInterface(payload) : await putUpdateBehaviorTreeActionInterface(payload);
      if (token !== saveToken) return;
      if (response.code !== 0 && response.code !== 200) {
        throw new Error(response.message || "行为树保存失败");
      }
      const mode: BehaviorTreePersistMode = method === "POST" ? "created" : "updated";
      hasPersisted.value = true;
      saveStatus.value = "success";
      options.onPersisted?.(mode);
      ElMessage.success(mode === "created" ? "新增成功（草稿）" : "更新成功");
    } catch (error) {
      if (token !== saveToken) return;
      saveStatus.value = "error";
      ElMessage.error(error instanceof Error ? error.message : "行为树保存失败");
    }
  }

  watch(
    () => meta.spaceId,
    () => {
      void loadBehaviorTreeNodeDefs();
    },
  );

  return {
    kindMeta,
    model,
    availableActions,
    selectedId,
    selectedNode,
    activeTab,
    defsStatus,
    defsError,
    detailStatus,
    detailError,
    saveStatus,
    hasPersisted,
    revision,
    definitionJson,
    payloadJson,
    validationErrors,
    validationWarnings,
    loadBehaviorTreeNodeDefs,
    loadBehaviorTreeDetail,
    selectBehaviorTreeNode,
    addBehaviorTreeNode,
    connectBehaviorTreeNodes,
    deleteBehaviorTreeNode,
    detachBehaviorTreeNodeToRoot,
    layoutBehaviorTree,
    clearBehaviorTree,
    addBehaviorTreeBlackboardRow,
    updateBehaviorTreeBlackboardField,
    deleteBehaviorTreeBlackboardRow,
    applyBehaviorTreeDefinitionJson,
    saveBehaviorTreeAction,
    reorderBehaviorTreeChild: (parentId: string, childId: string, delta: number) => {
      reorderBehaviorTreeChild(model, parentId, childId, delta);
      bumpRevision();
    },
    bumpRevision,
    canAttach: (parentId: string, childId: string | null) => canAttachBehaviorTreeChild(model.roots, kindMeta, parentId, childId),
    findParent: (id: string) => findBehaviorTreeParent(model.roots, id),
  };
}

export type BehaviorTreeOrchestrationApi = ReturnType<typeof useBehaviorTreeOrchestration>;
