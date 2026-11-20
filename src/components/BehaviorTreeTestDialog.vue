<template>
  <el-dialog
    :model-value="modelValue"
    :width="showBehaviorDetailPanel ? 'min(1200px, 94vw)' : '860px'"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    class="behavior-tree-test-dialog"
    :class="{ 'behavior-tree-test-dialog--with-detail': showBehaviorDetailPanel }"
    @close="emit('update:modelValue', false)"
  >
    <template #header>
      <div class="behavior-tree-test-dialog__header">
        <span class="behavior-tree-test-dialog__title">执行行为树 · {{ behaviorTitle }}</span>
        <el-tag size="small" effect="plain" type="info">行为树</el-tag>
      </div>
    </template>

    <p v-if="catalogError" class="behavior-tree-test-dialog__state" role="alert">{{ catalogError }}</p>

    <div class="behavior-tree-test-dialog__layout" :class="{ 'behavior-tree-test-dialog__layout--params-only': !showBehaviorDetailPanel }">
      <aside v-if="showBehaviorDetailPanel" class="behavior-tree-test-dialog__detail" aria-label="行为详情">
        <h4 class="behavior-tree-test-dialog__section-title">行为详情</h4>
        <p v-if="detailLoading" class="behavior-tree-test-dialog__state" role="status">正在加载行为详情…</p>
        <p v-else-if="detailError" class="behavior-tree-test-dialog__state" role="alert">{{ detailError }}</p>
        <template v-else-if="actionInfoViewState">
          <p class="behavior-tree-test-dialog__description" :title="actionInfoViewState.description || '暂无描述'">
            {{ actionInfoViewState.description || "暂无描述" }}
          </p>
          <el-descriptions class="behavior-tree-test-dialog__summary" :column="1" border size="small">
            <el-descriptions-item label="行为名称">{{ actionInfoViewState.displayName || "—" }}</el-descriptions-item>
            <el-descriptions-item label="行为 API">{{ actionInfoViewState.actionApi || "—" }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ SPACE_BEHAVIOR_STATUS_LABELS[actionInfoViewState.status] }}</el-descriptions-item>
            <el-descriptions-item label="行为类别">{{ actionInfoViewState.actionKindLabel || "—" }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ actionInfoViewState.createTime || "—" }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ behaviorUpdatedAt || "—" }}</el-descriptions-item>
          </el-descriptions>
        </template>
        <p v-else class="behavior-tree-test-dialog__state" role="status">暂无行为详情</p>
      </aside>

      <div class="behavior-tree-test-dialog__execution">
        <BehaviorTreeExecPanel
          :plan-status="planStatus"
          :plan-error="planError"
          :test-status="testStatus"
          :logs="logs"
          :external-rows="externalBlackboardRows"
          :property-groups="propertyBlackboardGroups"
          :node-blocks="execNodeBlocks"
          :external-draft="externalInputDraft"
          :blackboard-object-keys="blackboardObjectKeys"
          :blackboard-group-rows="blackboardGroupRows"
          :group-row-options="groupRowOptions"
          :group-row-loading-ids="groupRowLoadingIds"
          :node-drafts="nodeDrafts"
          :instance-options="instanceOptions"
          :instance-loading-ids="instanceLoadingIds"
          :resolve-object-label="resolveObjectLabel"
          :show-load-plan-button="false"
          @run-test="runBehaviorTreeTest"
          @clear-logs="clearBehaviorTreeExecLogs"
          @ensure-instances="loadBehaviorTreeEntityOptions"
          @ensure-group-rows="loadBehaviorTreeGroupRowOptions"
          @update-blackboard-instance="updateBlackboardObjectKey"
          @update-blackboard-group-row="updateBlackboardGroupRow"
          @update-node-param="updateNodeParamDraft"
          @update-node-entity="updateNodeEntityKeyDraft"
          @update-node-input-instance="(nodeId, key, value) => updateNodeInputParamDraft(nodeId, key, 'entityPrimaryKey', value)"
          @update-node-input-rows="(nodeId, key, value) => updateNodeInputParamDraft(nodeId, key, 'rowKeys', value)"
          @update-node-output="updateNodeOutputDraft"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, reactive, ref, watch } from "vue";
import { getOntologyActionInfoInterface, type getOntologyCategoryTreeInterface } from "@/apis";
import BehaviorTreeExecPanel from "@/components/BehaviorTreeExecPanel.vue";
import { useBehaviorTreeExecution } from "@/composables/behaviorTree/useBehaviorTreeExecution";
import type { BehaviorTestEntityRow, BehaviorTreeModel, BehaviorTreeObjectPropertyOption, SpaceBehaviorItem, SpaceRelationObjectOption } from "@/types";
import { SPACE_BEHAVIOR_STATUS_LABELS } from "@/types";
import { mapOntologyActionInfoToViewState, type SpaceBehaviorActionInfoViewState } from "@/utils/behaviorParameters/mapOntologyActionInfoToViewState";
import { mapOntologyObjectsToRelationOptions } from "@/utils/mapOntologyObjectsToRelationOptions";

const props = withDefaults(
  defineProps<{
    queryObjectCatalog: typeof getOntologyCategoryTreeInterface;
    initialEntity?: BehaviorTestEntityRow;
    modelValue: boolean;
    spaceId: string;
    behavior: SpaceBehaviorItem | null;
    /** 为 true 时展示左侧行为详情栏；仅空间浏览行为详情使用。 */
    showBehaviorDetailPanel?: boolean;
  }>(),
  { showBehaviorDetailPanel: false },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

/** 本地模型：读执行要求时用 treeDefinition 灌入黑板。 */
const model = reactive<BehaviorTreeModel>({ blackboard: [], roots: [] });
const objectOptions = ref<SpaceRelationObjectOption[]>([]);
const objectProperties = ref<Record<string, BehaviorTreeObjectPropertyOption>>({});
const catalogError = ref("");
const detailLoading = ref(false);
const detailError = ref("");
const actionInfoViewState = ref<SpaceBehaviorActionInfoViewState | null>(null);
let catalogToken = 0;
let openToken = 0;
let detailToken = 0;

const behaviorTitle = computed(() => (props.behavior?.displayName || props.behavior?.behaviorApiName || "未命名").trim());
const treeApi = computed(() => (props.behavior?.behaviorApiName || "").trim());
const spaceIdRef = computed(() => props.spaceId.trim());
const behaviorUpdatedAt = computed(() => props.behavior?.updatedAt?.trim() || "");

const {
  planStatus,
  planError,
  externalInputDraft,
  blackboardObjectKeys,
  blackboardGroupRows,
  groupRowOptions,
  groupRowLoadingIds,
  nodeDrafts,
  instanceOptions,
  instanceLoadingIds,
  testStatus,
  logs,
  externalBlackboardRows,
  propertyBlackboardGroups,
  execNodeBlocks,
  resolveObjectLabel,
  loadBehaviorTreeExecutePlan,
  runBehaviorTreeTest,
  clearBehaviorTreeExecLogs,
  loadBehaviorTreeEntityOptions,
  loadBehaviorTreeGroupRowOptions,
  updateBlackboardObjectKey,
  updateBlackboardGroupRow,
  updateNodeParamDraft,
  updateNodeEntityKeyDraft,
  updateNodeInputParamDraft,
  updateNodeOutputDraft,
  resolveBehaviorTreeOutputDraftKey,
  cancelBehaviorTreeExecutionRequests,
} = useBehaviorTreeExecution({
  spaceId: () => spaceIdRef.value,
  treeApi: () => treeApi.value,
  model,
  objectOptions,
  objectProperties,
});

/**
 * @description 加载空间对象目录，供实例标签展示。
 */
async function loadBehaviorTreeTestObjectCatalog(): Promise<void> {
  const token = ++catalogToken;
  catalogError.value = "";
  objectOptions.value = [];
  objectProperties.value = {};
  const spaceId = spaceIdRef.value;
  if (!spaceId) {
    catalogError.value = "空间标识无效";
    return;
  }
  try {
    const response = await props.queryObjectCatalog({ spaceId });
    if (token !== catalogToken) return;
    if (response.code !== 200 || !response.data) {
      throw new Error(response.message || "对象目录加载失败");
    }
    objectOptions.value = mapOntologyObjectsToRelationOptions(response.data);
  } catch (error) {
    if (token !== catalogToken) return;
    catalogError.value = error instanceof Error ? error.message : "对象目录加载失败";
  }
}

/**
 * @description 浏览详情模式下加载行为详情摘要。
 */
async function loadBehaviorTreeActionDetail(): Promise<void> {
  if (!props.showBehaviorDetailPanel) {
    actionInfoViewState.value = null;
    detailError.value = "";
    detailLoading.value = false;
    return;
  }
  const token = ++detailToken;
  const ontologySpaceId = spaceIdRef.value;
  const actionApi = treeApi.value;
  detailLoading.value = true;
  detailError.value = "";
  actionInfoViewState.value = null;
  try {
    if (!ontologySpaceId || !actionApi) throw new Error("缺少空间或行为标识");
    const response = await getOntologyActionInfoInterface({ ontologySpaceId, actionApi });
    if (token !== detailToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "行为详情加载失败");
    actionInfoViewState.value = mapOntologyActionInfoToViewState(response.data);
  } catch (error) {
    if (token !== detailToken) return;
    detailError.value = error instanceof Error ? error.message : "行为详情加载失败";
  } finally {
    if (token === detailToken) detailLoading.value = false;
  }
}

/**
 * @description 打开弹窗时重置状态并自动读取执行要求。
 */
async function openBehaviorTreeTestDialog(): Promise<void> {
  const token = ++openToken;
  model.blackboard.splice(0, model.blackboard.length);
  model.roots.splice(0, model.roots.length);
  clearBehaviorTreeExecLogs();
  for (const draft of [externalInputDraft, blackboardObjectKeys, nodeDrafts, instanceOptions]) {
    for (const key of Object.keys(draft)) delete draft[key];
  }
  await Promise.all([loadBehaviorTreeTestObjectCatalog(), loadBehaviorTreeActionDetail()]);
  if (token !== openToken) return;
  await loadBehaviorTreeExecutePlan(true);
  if (token !== openToken) return;
  prefillBehaviorTreeEntity();
}

/** @description 将当前实例填入执行要求中明确匹配对象的实例位置，其他对象和子表行保持待选。 */
function prefillBehaviorTreeEntity(): void {
  const entity = props.initialEntity;
  const objectId = entity?.raw.ontologyUniqueIdentifier?.trim();
  if (!entity || !objectId) return;
  const primaryKey = String(entity.primaryKey);
  const options = instanceOptions[objectId] ?? [];
  instanceOptions[objectId] = [
    { value: primaryKey, label: entity.displayName + " · " + entity.primaryKeyLabel },
    ...options.filter((item) => item.value !== primaryKey),
  ];
  for (const group of propertyBlackboardGroups.value) {
    if (group.objectId === objectId) blackboardObjectKeys[objectId] = primaryKey;
  }
  for (const block of execNodeBlocks.value) {
    if (block.objects.includes(objectId)) updateNodeEntityKeyDraft(block.nodeId, objectId, primaryKey);
    if (block.ends?.from === objectId) updateNodeEntityKeyDraft(block.nodeId, "from", primaryKey);
    else if (block.ends?.to === objectId) updateNodeEntityKeyDraft(block.nodeId, "to", primaryKey);
    for (const param of block.params) {
      if (param.objectIdentifier === objectId && ["PROPERTY", "OBJECT", "LIST"].includes(param.sourceType ?? "")) {
        updateNodeInputParamDraft(block.nodeId, param.key, "entityPrimaryKey", primaryKey);
      }
    }
    for (const output of block.outputs) {
      if (output.objectIdentifier !== objectId || output.mode === "RESULT_ONLY" || output.mode === "DATA_PRIMARY_KEY") continue;
      const key = resolveBehaviorTreeOutputDraftKey(output);
      if (key) updateNodeOutputDraft(block.nodeId, key, "entityPrimaryKey", primaryKey);
    }
  }
}

/** @description 关闭、切换或卸载时阻止目录请求和旧打开流程继续更新弹窗。 */
function invalidateBehaviorTreeTestRequests(): void {
  catalogToken += 1;
  openToken += 1;
  detailToken += 1;
  cancelBehaviorTreeExecutionRequests();
}

onScopeDispose(invalidateBehaviorTreeTestRequests);

watch(
  () => [props.modelValue, props.behavior?.id, props.behavior?.behaviorApiName, props.spaceId, props.initialEntity, props.showBehaviorDetailPanel] as const,
  ([visible]) => {
    invalidateBehaviorTreeTestRequests();
    if (!visible) return;
    if (!treeApi.value) {
      catalogError.value = "缺少行为 api";
      return;
    }
    void openBehaviorTreeTestDialog();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.behavior-tree-test-dialog__header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.behavior-tree-test-dialog__title {
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.behavior-tree-test-dialog__state {
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.behavior-tree-test-dialog__state[role="alert"] {
  color: var(--el-color-danger);
}

.behavior-tree-test-dialog__layout {
  display: grid;
  grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
  height: min(70vh, 720px);
  max-height: min(70vh, 720px);
  overflow: hidden;
}

.behavior-tree-test-dialog__layout--params-only {
  grid-template-columns: minmax(0, 1fr);
  height: auto;
  max-height: none;
}

.behavior-tree-test-dialog__detail,
.behavior-tree-test-dialog__execution {
  min-width: 0;
  min-height: 0;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}

.behavior-tree-test-dialog__layout--params-only .behavior-tree-test-dialog__execution {
  padding: 0;
  border: none;
  background: transparent;
}

.behavior-tree-test-dialog__section-title {
  margin: 0 0 10px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.behavior-tree-test-dialog__description {
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.behavior-tree-test-dialog__summary {
  width: 100%;
}

@media (max-width: 900px) {
  .behavior-tree-test-dialog__layout {
    grid-template-columns: 1fr;
    height: auto;
    max-height: none;
  }

  .behavior-tree-test-dialog__detail {
    max-height: 280px;
  }
}
</style>
