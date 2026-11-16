<template>
  <el-dialog
    :model-value="modelValue"
    width="860px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    class="behavior-tree-test-dialog"
    @close="emit('update:modelValue', false)"
  >
    <template #header>
      <div class="behavior-tree-test-dialog__header">
        <span class="behavior-tree-test-dialog__title">执行行为树 · {{ behaviorTitle }}</span>
        <el-tag size="small" effect="plain" type="info">行为树</el-tag>
      </div>
    </template>

    <p class="behavior-tree-test-dialog__hint">打开时会自动读取库中已保存定义的执行要求；必填项未传会被后端拒绝。</p>
    <p v-if="catalogError" class="behavior-tree-test-dialog__state" role="alert">{{ catalogError }}</p>

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
      :node-drafts="nodeDrafts"
      :instance-options="instanceOptions"
      :instance-loading-ids="instanceLoadingIds"
      :resolve-object-label="resolveObjectLabel"
      @load-plan="loadBehaviorTreeExecutePlan(false)"
      @run-test="runBehaviorTreeTest"
      @clear-logs="clearBehaviorTreeExecLogs"
      @ensure-instances="loadBehaviorTreeEntityOptions"
      @update-node-param="updateNodeParamDraft"
      @update-node-entity="updateNodeEntityKeyDraft"
      @update-node-input-instance="(nodeId, key, value) => updateNodeInputParamDraft(nodeId, key, 'entityPrimaryKey', value)"
      @update-node-output="updateNodeOutputDraft"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { getOntologyCategoryTreeInterface } from "@/apis";
import BehaviorTreeExecPanel from "@/components/BehaviorTreeExecPanel.vue";
import { useBehaviorTreeExecution } from "@/composables/behaviorTree/useBehaviorTreeExecution";
import type { BehaviorTreeModel, BehaviorTreeObjectPropertyOption, SpaceBehaviorItem, SpaceRelationObjectOption } from "@/types";
import { mapOntologyObjectsToRelationOptions } from "@/utils/mapOntologyObjectsToRelationOptions";

const props = defineProps<{
  modelValue: boolean;
  spaceId: string;
  behavior: SpaceBehaviorItem | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

/** 本地模型：读执行要求时用 treeDefinition 灌入黑板。 */
const model = reactive<BehaviorTreeModel>({ blackboard: [], roots: [] });
const objectOptions = ref<SpaceRelationObjectOption[]>([]);
const objectProperties = ref<Record<string, BehaviorTreeObjectPropertyOption>>({});
const catalogError = ref("");
let catalogToken = 0;
let openToken = 0;

const behaviorTitle = computed(() => (props.behavior?.displayName || props.behavior?.behaviorApiName || "未命名").trim());
const treeApi = computed(() => (props.behavior?.behaviorApiName || "").trim());
const spaceIdRef = computed(() => props.spaceId.trim());

const {
  planStatus,
  planError,
  externalInputDraft,
  blackboardObjectKeys,
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
  updateNodeParamDraft,
  updateNodeEntityKeyDraft,
  updateNodeInputParamDraft,
  updateNodeOutputDraft,
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
    const response = await getOntologyCategoryTreeInterface({ spaceId });
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
 * @description 打开弹窗时重置状态并自动读取执行要求。
 */
async function openBehaviorTreeTestDialog(): Promise<void> {
  const token = ++openToken;
  model.blackboard.splice(0, model.blackboard.length);
  model.roots.splice(0, model.roots.length);
  clearBehaviorTreeExecLogs();
  await loadBehaviorTreeTestObjectCatalog();
  if (token !== openToken) return;
  await loadBehaviorTreeExecutePlan(true);
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    if (!treeApi.value) {
      catalogError.value = "缺少行为 api";
      return;
    }
    void openBehaviorTreeTestDialog();
  },
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

.behavior-tree-test-dialog__hint,
.behavior-tree-test-dialog__state {
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.behavior-tree-test-dialog__state[role="alert"] {
  color: var(--el-color-danger);
}
</style>
