<template>
  <el-dialog
    :model-value="modelValue"
    class="behavior-tree-orchestration-dialog"
    title="行为树编排"
    fullscreen
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="behavior-tree-orchestration">
      <header class="behavior-tree-orchestration__toolbar">
        <div class="behavior-tree-orchestration__meta">
          <span>{{ meta.displayName || "未命名行为树" }}</span>
          <code>{{ meta.actionApi }}</code>
          <el-tag size="small" :type="defsStatus === 'ready' ? 'success' : defsStatus === 'error' ? 'danger' : 'info'">
            {{ defsStatus === "ready" ? "目录已加载" : defsStatus === "loading" ? "目录加载中" : defsStatus === "error" ? "目录失败" : "未加载" }}
          </el-tag>
          <el-tag
            v-if="meta.isEditMode || hasPersisted"
            size="small"
            :type="detailStatus === 'ready' ? 'success' : detailStatus === 'error' ? 'danger' : 'info'"
          >
            {{ detailStatus === "ready" ? "定义已加载" : detailStatus === "loading" ? "定义加载中" : detailStatus === "error" ? "定义失败" : "待加载" }}
          </el-tag>
        </div>
        <div class="behavior-tree-orchestration__actions">
          <el-button @click="layoutBehaviorTree">自动布局</el-button>
          <el-button @click="fitBehaviorTreeView">适应画布</el-button>
          <el-button @click="clearBehaviorTree">清空</el-button>
          <el-button @click="emit('update:modelValue', false)">返回上一步</el-button>
          <el-button type="primary" :loading="saveStatus === 'submitting'" @click="saveBehaviorTreeAction">
            {{ hasPersisted ? "更新" : "保存" }}
          </el-button>
        </div>
      </header>

      <div class="behavior-tree-orchestration__body">
        <BehaviorTreePalette
          class="behavior-tree-orchestration__palette"
          :kind-meta="kindMeta"
          :available-actions="availableActions"
          :defs-status="defsStatus"
          :defs-error="defsError"
          @add-kind="(kind) => addBehaviorTreeNode(kind, null)"
          @add-action="(actionApi) => addBehaviorTreeNode('ACTION', null, { kind: 'ACTION', actionApi })"
          @retry-defs="loadBehaviorTreeNodeDefs"
        />

        <section class="behavior-tree-orchestration__canvas-wrap" aria-label="行为树画布">
          <div ref="canvasRef" class="behavior-tree-orchestration__canvas" />
          <p class="behavior-tree-orchestration__tip">从左侧拖入节点；从节点底部圆点连到其他节点建立父子关系</p>
        </section>

        <aside class="behavior-tree-orchestration__inspector" aria-label="行为树配置">
          <el-tabs :model-value="activeTab" @tab-change="handleInspectorTabChange">
            <el-tab-pane label="节点配置" name="node">
              <BehaviorTreeNodeInspector
                :node="selectedNode"
                :parent="selectedParent"
                :kind-meta="kindMeta"
                :available-actions="availableActions"
                :blackboard="model.blackboard"
                @patch-field="handlePatchField"
                @patch-config="handlePatchConfig"
                @reorder="reorderBehaviorTreeChild"
                @detach-root="detachBehaviorTreeNodeToRoot"
                @delete-node="deleteBehaviorTreeNode"
                @add-external-keys="handleAddExternalKeys"
              />
            </el-tab-pane>
            <el-tab-pane label="黑板 / 变量" name="board">
              <BehaviorTreeBlackboardPanel
                :rows="model.blackboard"
                :object-options="objectOptions"
                :object-properties="objectProperties"
                :property-catalog-status="propertyCatalogStatus"
                :property-catalog-error="propertyCatalogError"
                :object-property-loading-ids="objectPropertyLoadingIds"
                @add-row="addBehaviorTreeBlackboardRow"
                @delete-row="deleteBehaviorTreeBlackboardRow"
                @update-field="updateBehaviorTreeBlackboardField"
                @request-object-properties="ensureBehaviorTreeObjectProperties"
              />
            </el-tab-pane>
            <el-tab-pane label="执行 / 日志" name="exec">
              <BehaviorTreeExecPanel
                :plan-status="execPlanStatus"
                :plan-error="execPlanError"
                :test-status="execTestStatus"
                :test-error="execTestError"
                :test-result="execTestResult"
                :logs="execLogs"
                :external-rows="execExternalRows"
                :property-groups="execPropertyGroups"
                :node-blocks="execNodeBlocks"
                :external-draft="execExternalDraft"
                :blackboard-object-keys="execBlackboardObjectKeys"
                :node-drafts="execNodeDrafts"
                :instance-options="execInstanceOptions"
                :instance-loading-ids="execInstanceLoadingIds"
                :resolve-object-label="resolveExecObjectLabel"
                @load-plan="loadBehaviorTreeExecutePlan(false)"
                @run-test="runBehaviorTreeTest"
                @clear-logs="clearBehaviorTreeExecLogs"
                @ensure-instances="loadBehaviorTreeEntityOptions"
                @update-node-param="updateNodeParamDraft"
                @update-node-entity="updateNodeEntityKeyDraft"
                @update-node-output="updateNodeOutputDraft"
              />
            </el-tab-pane>
          </el-tabs>
        </aside>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { BehaviorTreeNodeDraft, BehaviorTreeOrchestrationMeta, BehaviorTreePersistMode, BehaviorTreeValueType } from "@/types";
import { createBehaviorTreeBlackboardItem } from "./utils/behaviorTreeBlackboard";
import { BEHAVIOR_TREE_VALUE_TYPES } from "./utils/behaviorTreeConstants";
import { findBehaviorTreeNode } from "./utils/behaviorTreeModel";
import { useBehaviorTreeGraph } from "./composables/useBehaviorTreeGraph";
import { useBehaviorTreeOrchestration } from "./composables/useBehaviorTreeOrchestration";
import { useBehaviorTreeExecution } from "./composables/useBehaviorTreeExecution";
import BehaviorTreePalette from "./components/BehaviorTreePalette.vue";
import BehaviorTreeNodeInspector from "./components/BehaviorTreeNodeInspector.vue";
import BehaviorTreeBlackboardPanel from "./components/BehaviorTreeBlackboardPanel.vue";
import BehaviorTreeExecPanel from "./components/BehaviorTreeExecPanel.vue";

const props = defineProps<{
  modelValue: boolean;
  meta: BehaviorTreeOrchestrationMeta;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  persisted: [mode: BehaviorTreePersistMode];
}>();

const canvasRef = ref<HTMLElement | null>(null);

const {
  kindMeta,
  model,
  availableActions,
  selectedId,
  selectedNode,
  activeTab,
  defsStatus,
  defsError,
  detailStatus,
  propertyCatalogStatus,
  propertyCatalogError,
  objectOptions,
  objectProperties,
  objectPropertyLoadingIds,
  saveStatus,
  hasPersisted,
  revision,
  loadBehaviorTreeNodeDefs,
  loadBehaviorTreeObjectPropertyCatalog,
  ensureBehaviorTreeObjectProperties,
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
  saveBehaviorTreeAction,
  reorderBehaviorTreeChild,
  bumpRevision,
} = useBehaviorTreeOrchestration(props.meta, {
  onPersisted: (mode) => emit("persisted", mode),
});

const {
  planStatus: execPlanStatus,
  planError: execPlanError,
  testStatus: execTestStatus,
  testError: execTestError,
  testResult: execTestResult,
  logs: execLogs,
  externalBlackboardRows: execExternalRows,
  propertyBlackboardGroups: execPropertyGroups,
  execNodeBlocks,
  externalInputDraft: execExternalDraft,
  blackboardObjectKeys: execBlackboardObjectKeys,
  nodeDrafts: execNodeDrafts,
  instanceOptions: execInstanceOptions,
  instanceLoadingIds: execInstanceLoadingIds,
  resolveObjectLabel: resolveExecObjectLabel,
  loadBehaviorTreeExecutePlan,
  runBehaviorTreeTest,
  clearBehaviorTreeExecLogs,
  loadBehaviorTreeEntityOptions,
  updateNodeParamDraft,
  updateNodeEntityKeyDraft,
  updateNodeOutputDraft,
} = useBehaviorTreeExecution({
  spaceId: () => props.meta.spaceId,
  treeApi: () => props.meta.actionApi,
  model,
  objectOptions,
  objectProperties,
});

const selectedParent = computed(() => {
  if (!selectedId.value) return null;
  for (const root of model.roots) {
    const found = findParentRecursive(root, selectedId.value);
    if (found) return found;
  }
  return null;
});

/**
 * @description 递归查找父节点。
 * @param node 当前节点。
 * @param childId 子 id。
 * @returns 父节点。
 */
function findParentRecursive(node: BehaviorTreeNodeDraft, childId: string): BehaviorTreeNodeDraft | null {
  if (node.children.some((child) => child.id === childId)) return node;
  for (const child of node.children) {
    const found = findParentRecursive(child, childId);
    if (found) return found;
  }
  return null;
}

const { initBehaviorTreeGraph, fitBehaviorTreeView } = useBehaviorTreeGraph({
  containerRef: canvasRef,
  model,
  kindMeta,
  selectedId,
  revision,
  onSelect: selectBehaviorTreeNode,
  onConnect: connectBehaviorTreeNodes,
  onDrop: (payload, parentId, point) => addBehaviorTreeNode(payload.kind, parentId, payload, point),
  onNodeMoved: (id, x, y) => {
    const node = findBehaviorTreeNode(model.roots, id);
    if (!node) return;
    node._x = x;
    node._y = y;
  },
});

/**
 * @description 切换右侧 Inspector Tab。
 * @param name Element Plus tab 名称。
 */
function handleInspectorTabChange(name: string | number): void {
  if (name === "node" || name === "board" || name === "exec") {
    activeTab.value = name;
  }
}

/**
 * @description 更新选中节点字段。
 * @param id 节点 id。
 * @param field 字段。
 * @param value 值。
 */
function handlePatchField(id: string, field: "displayName" | "enabled" | "skipIf" | "whileCondition", value: string | boolean): void {
  const node = findBehaviorTreeNode(model.roots, id);
  if (!node) return;
  if (field === "enabled") node.enabled = Boolean(value);
  else node[field] = String(value);
  bumpRevision();
}

/**
 * @description 更新选中节点配置。
 * @param id 节点 id。
 * @param field 配置字段。
 * @param value 值。
 */
function handlePatchConfig(id: string, field: string, value: string): void {
  const node = findBehaviorTreeNode(model.roots, id);
  if (!node) return;
  node.config = node.config || {};
  node.config[field] = value;
  bumpRevision();
}

/**
 * @description 为 ACTION 节点补齐外部入参黑板键。
 * @param id 节点 id。
 */
function handleAddExternalKeys(id: string): void {
  const node = findBehaviorTreeNode(model.roots, id);
  if (!node || node.kind !== "ACTION") return;
  const api = (node.config?.actionApi || "").trim();
  const bound = availableActions.value.find((item) => item.actionApi === api);
  if (!bound) {
    ElMessage.warning("先选择一个目录里的绑定行为");
    return;
  }
  const existing = new Set(model.blackboard.map((item) => item.key.trim()).filter(Boolean));
  let added = 0;
  for (const param of bound.externalParams || []) {
    if (!param.name || existing.has(param.name)) continue;
    const valueType = (BEHAVIOR_TREE_VALUE_TYPES.includes(param.type as BehaviorTreeValueType) ? param.type : "STRING") as BehaviorTreeValueType;
    model.blackboard.push(
      createBehaviorTreeBlackboardItem(param.name, {
        valueType,
        description: param.description || `外部输入参数，来自行为 ${bound.actionApi}`,
      }),
    );
    existing.add(param.name);
    added += 1;
  }
  bumpRevision();
  ElMessage.success(added ? `已补 ${added} 个黑板键` : "黑板里已经有全部外部输入参数的键");
}

/**
 * @description 打开弹框时加载目录与（编辑态）详情，再初始化画布。
 */
async function bootstrapBehaviorTreeOrchestration(): Promise<void> {
  await Promise.all([loadBehaviorTreeNodeDefs(), loadBehaviorTreeObjectPropertyCatalog()]);
  if (props.meta.isEditMode) await loadBehaviorTreeDetail();
  initBehaviorTreeGraph();
  fitBehaviorTreeView();
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    void bootstrapBehaviorTreeOrchestration();
  },
);

onMounted(() => {
  if (props.modelValue) void bootstrapBehaviorTreeOrchestration();
});
</script>

<style scoped lang="scss">
.behavior-tree-orchestration {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
  background: var(--aircas-color-page-background);
}

.behavior-tree-orchestration__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--aircas-color-border);
  background: var(--aircas-color-panel-background);
}

.behavior-tree-orchestration__meta {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--aircas-color-text-primary);
}

.behavior-tree-orchestration__meta code {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.behavior-tree-orchestration__actions {
  display: flex;
  gap: 8px;
}

.behavior-tree-orchestration__body {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: 240px minmax(0, 1fr) minmax(340px, 420px);
}

.behavior-tree-orchestration__canvas-wrap {
  position: relative;
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--aircas-color-border);
}

.behavior-tree-orchestration__canvas {
  width: 100%;
  height: 100%;
}

.behavior-tree-orchestration__tip {
  position: absolute;
  right: 12px;
  bottom: 10px;
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  pointer-events: none;
}

.behavior-tree-orchestration__inspector {
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 12px 12px;
  background: var(--aircas-color-panel-background);
}
</style>

<style lang="scss">
.behavior-tree-orchestration-dialog.el-dialog.is-fullscreen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  margin: 0;
  overflow: hidden;
  background: var(--aircas-color-page-background);
}

.behavior-tree-orchestration-dialog.el-dialog.is-fullscreen .el-dialog__header {
  flex-shrink: 0;
  margin-right: 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--aircas-color-border);
}

.behavior-tree-orchestration-dialog.el-dialog.is-fullscreen .el-dialog__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
</style>
