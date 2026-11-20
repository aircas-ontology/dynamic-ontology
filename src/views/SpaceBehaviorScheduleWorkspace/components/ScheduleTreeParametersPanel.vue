<template>
  <BehaviorTreeExecPanel
    :plan-status="treeParameters.planStatus.value"
    :plan-error="treeParameters.planError.value"
    :test-status="treeParameters.testStatus.value"
    :logs="treeParameters.logs.value"
    :external-rows="treeParameters.externalBlackboardRows.value"
    :property-groups="treeParameters.propertyBlackboardGroups.value"
    :node-blocks="treeParameters.execNodeBlocks.value"
    :external-draft="treeParameters.externalInputDraft"
    :blackboard-object-keys="treeParameters.blackboardObjectKeys"
    :blackboard-group-rows="treeParameters.blackboardGroupRows"
    :group-row-options="treeParameters.groupRowOptions"
    :group-row-loading-ids="treeParameters.groupRowLoadingIds"
    :node-drafts="treeParameters.nodeDrafts"
    :instance-options="treeParameters.instanceOptions"
    :instance-loading-ids="treeParameters.instanceLoadingIds"
    :resolve-object-label="treeParameters.resolveObjectLabel"
    :show-load-plan-button="false"
    :show-run-button="false"
    :show-logs="false"
    @ensure-instances="treeParameters.loadBehaviorTreeEntityOptions"
    @ensure-group-rows="treeParameters.loadBehaviorTreeGroupRowOptions"
    @update-blackboard-group-row="treeParameters.updateBlackboardGroupRow"
    @update-node-param="treeParameters.updateNodeParamDraft"
    @update-node-entity="treeParameters.updateNodeEntityKeyDraft"
    @update-node-input-instance="(nodeId, key, value) => treeParameters.updateNodeInputParamDraft(nodeId, key, 'entityPrimaryKey', value)"
    @update-node-input-rows="(nodeId, key, value) => treeParameters.updateNodeInputParamDraft(nodeId, key, 'rowKeys', value)"
    @update-node-output="treeParameters.updateNodeOutputDraft"
  />
</template>

<script setup lang="ts">
import BehaviorTreeExecPanel from "@/components/BehaviorTreeExecPanel.vue";
import type { useScheduleTreeParameters } from "../composables/useScheduleTreeParameters";

defineProps<{
  /** 调度场景行为树参数控制器。 */
  treeParameters: ReturnType<typeof useScheduleTreeParameters>;
}>();
</script>
