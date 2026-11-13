<template>
  <div v-if="!node" class="behavior-tree-node-inspector__empty">在画布中选中节点后可编辑配置</div>
  <div v-else class="behavior-tree-node-inspector">
    <el-form label-position="top">
      <el-form-item label="显示名称">
        <el-input :model-value="node.displayName" @update:model-value="patchField('displayName', String($event))" />
      </el-form-item>
      <el-form-item label="启用">
        <el-switch :model-value="node.enabled !== false" @update:model-value="patchField('enabled', Boolean($event))" />
      </el-form-item>
      <el-form-item label="跳过条件">
        <el-input :model-value="node.skipIf" placeholder="SpEL，可空" @update:model-value="patchField('skipIf', String($event))" />
      </el-form-item>
      <el-form-item label="持续执行条件">
        <el-input :model-value="node.whileCondition" placeholder="SpEL，可空" @update:model-value="patchField('whileCondition', String($event))" />
      </el-form-item>

      <template v-if="isCompositeNode">
        <div class="behavior-tree-node-inspector__subtitle">子节点顺序</div>
        <p class="behavior-tree-node-inspector__hint">选择 / 顺序按这里的顺序执行，并行按这里的顺序提交并返回结果；新连上的子节点追加在末尾，可在这里调整</p>
        <div v-if="node.children.length" class="behavior-tree-node-inspector__child-order" role="list">
          <div v-for="(child, index) in node.children" :key="child.id" class="behavior-tree-node-inspector__child-row" role="listitem">
            <span class="behavior-tree-node-inspector__child-index">{{ index + 1 }}</span>
            <span class="behavior-tree-node-inspector__child-name" :title="resolveChildLabel(child)">{{ resolveChildLabel(child) }}</span>
            <el-button size="small" :disabled="index === 0" @click="emit('reorder', node.id, child.id, -1)">↑</el-button>
            <el-button size="small" :disabled="index === node.children.length - 1" @click="emit('reorder', node.id, child.id, 1)">↓</el-button>
          </div>
        </div>
        <p v-else class="behavior-tree-node-inspector__hint">还没有子节点；把节点连到这里后才能调整先后</p>
        <p v-if="node.children.length === 1" class="behavior-tree-node-inspector__hint">
          只有 1 个子节点，没有可调整的先后；要在这个节点里按顺序执行多个节点，先把它们都连到这里
        </p>
      </template>

      <template v-if="node.kind === 'SELECTOR' || node.kind === 'SEQUENCE'">
        <el-form-item label="执行模式">
          <el-select :model-value="config.runMode" style="width: 100%" @change="patchConfig('runMode', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_RUN_MODE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'PARALLEL'">
        <el-form-item label="成败策略">
          <el-select :model-value="config.policy" style="width: 100%" @change="patchConfig('policy', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_PARALLEL_POLICY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="最大并发">
          <el-input :model-value="config.maxConcurrency" placeholder="可空" @update:model-value="patchConfig('maxConcurrency', String($event))" />
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'REPEATER'">
        <el-form-item label="循环模式">
          <el-select :model-value="config.loopMode" style="width: 100%" @change="patchConfig('loopMode', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_LOOP_MODE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="次数">
          <el-input :model-value="config.times" @update:model-value="patchConfig('times', String($event))" />
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'UNTIL_SUCCESS' || node.kind === 'UNTIL_FAILURE'">
        <el-form-item label="最大重试">
          <el-input :model-value="config.maxTimes" @update:model-value="patchConfig('maxTimes', String($event))" />
        </el-form-item>
        <el-form-item label="收尾状态">
          <el-select :model-value="config.finishState" style="width: 100%" @change="patchConfig('finishState', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_STATE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'COOLDOWN'">
        <el-form-item label="冷却秒数">
          <el-input :model-value="config.intervalSeconds" @update:model-value="patchConfig('intervalSeconds', String($event))" />
        </el-form-item>
        <el-form-item label="实例黑板键">
          <el-input :model-value="config.entityPrimaryKeyKey" placeholder="可空" @update:model-value="patchConfig('entityPrimaryKeyKey', String($event))" />
        </el-form-item>
        <el-form-item label="冷却结果">
          <el-select :model-value="config.hitResult" style="width: 100%" @change="patchConfig('hitResult', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_STATE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'TIME_LIMIT'">
        <el-form-item label="限时秒数">
          <el-input :model-value="config.limitSeconds" @update:model-value="patchConfig('limitSeconds', String($event))" />
        </el-form-item>
        <el-form-item label="超时状态">
          <el-select :model-value="config.timeoutState" style="width: 100%" @change="patchConfig('timeoutState', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_STATE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'BLACKBOARD_CONDITION'">
        <el-form-item label="黑板键">
          <el-input :model-value="config.key" @update:model-value="patchConfig('key', String($event))" />
        </el-form-item>
        <el-form-item label="比较方式">
          <el-select :model-value="config.op" style="width: 100%" @change="patchConfig('op', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_OP_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isBehaviorTreeValueLessOp(config.op || '')" label="比较值">
          <el-input :model-value="config.value" @update:model-value="patchConfig('value', String($event))" />
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'CONDITION'">
        <el-form-item label="SpEL 表达式">
          <el-input :model-value="config.expression" type="textarea" :rows="3" @update:model-value="patchConfig('expression', String($event))" />
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'ACTION'">
        <el-form-item label="绑定行为">
          <el-select :model-value="config.actionApi" filterable clearable style="width: 100%" @change="patchConfig('actionApi', String($event || ''))">
            <el-option
              v-for="item in availableActions"
              :key="item.actionApi"
              :label="`${item.displayName || item.actionApi} · ${item.actionApi}`"
              :value="item.actionApi"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="重试次数">
          <el-input :model-value="config.retryTimes" placeholder="留空或 0" @update:model-value="patchConfig('retryTimes', String($event))" />
        </el-form-item>
        <el-button v-if="missingExternalKeys.length" @click="emit('add-external-keys', node.id)">补全 {{ missingExternalKeys.length }} 个黑板键</el-button>
      </template>
    </el-form>

    <div class="behavior-tree-node-inspector__actions">
      <el-button v-if="parent" @click="emit('detach-root', node.id)">脱离父节点设为根</el-button>
      <el-button type="danger" @click="emit('delete-node', node.id)">删除节点及其子树</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ActionTreeBindableAction, BehaviorTreeBlackboardItem, BehaviorTreeNodeDraft } from "@/types";
import {
  BEHAVIOR_TREE_LOCAL_KINDS,
  BEHAVIOR_TREE_LOOP_MODE_OPTIONS,
  BEHAVIOR_TREE_OP_OPTIONS,
  BEHAVIOR_TREE_PARALLEL_POLICY_OPTIONS,
  BEHAVIOR_TREE_RUN_MODE_OPTIONS,
  BEHAVIOR_TREE_STATE_OPTIONS,
  isBehaviorTreeValueLessOp,
} from "../utils/behaviorTreeConstants";

const props = defineProps<{
  node: BehaviorTreeNodeDraft | null;
  parent: BehaviorTreeNodeDraft | null;
  availableActions: ActionTreeBindableAction[];
  blackboard: BehaviorTreeBlackboardItem[];
}>();

const emit = defineEmits<{
  "patch-field": [id: string, field: "displayName" | "enabled" | "skipIf" | "whileCondition", value: string | boolean];
  "patch-config": [id: string, field: string, value: string];
  reorder: [parentId: string, childId: string, delta: number];
  "detach-root": [id: string];
  "delete-node": [id: string];
  "add-external-keys": [id: string];
}>();

const config = computed(() => props.node?.config || {});

const isCompositeNode = computed(() => {
  const kind = props.node?.kind;
  return kind === "SELECTOR" || kind === "SEQUENCE" || kind === "PARALLEL";
});

const missingExternalKeys = computed(() => {
  if (!props.node || props.node.kind !== "ACTION") return [];
  const api = (props.node.config?.actionApi || "").trim();
  const bound = props.availableActions.find((item) => item.actionApi === api);
  const keys = new Set(props.blackboard.map((item) => item.key.trim()).filter(Boolean));
  return (bound?.externalParams || []).filter((item) => item.name && !keys.has(item.name));
});

/**
 * @description 解析子节点展示名。
 * @param child 子节点。
 * @returns 显示名称。
 */
function resolveChildLabel(child: BehaviorTreeNodeDraft): string {
  const displayName = child.displayName.trim();
  if (displayName) return displayName;
  const meta = BEHAVIOR_TREE_LOCAL_KINDS.find((item) => item.kind === child.kind);
  return meta?.name || child.kind;
}

/**
 * @description 更新节点字段。
 * @param field 字段名。
 * @param value 新值。
 */
function patchField(field: "displayName" | "enabled" | "skipIf" | "whileCondition", value: string | boolean): void {
  if (!props.node) return;
  emit("patch-field", props.node.id, field, value);
}

/**
 * @description 更新节点配置。
 * @param field 配置字段。
 * @param value 新值。
 */
function patchConfig(field: string, value: string): void {
  if (!props.node) return;
  emit("patch-config", props.node.id, field, value);
}
</script>

<style scoped lang="scss">
.behavior-tree-node-inspector__empty {
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.behavior-tree-node-inspector__subtitle {
  margin: 8px 0 4px;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.behavior-tree-node-inspector__hint {
  margin: 0 0 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.behavior-tree-node-inspector__child-order {
  margin: 0 0 10px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
}

.behavior-tree-node-inspector__child-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-top: 1px solid var(--aircas-color-border);
  font-size: 12px;
}

.behavior-tree-node-inspector__child-row:first-child {
  border-top: none;
}

.behavior-tree-node-inspector__child-index {
  flex: 0 0 18px;
  color: var(--aircas-color-text-secondary);
}

.behavior-tree-node-inspector__child-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-tree-node-inspector__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
</style>
