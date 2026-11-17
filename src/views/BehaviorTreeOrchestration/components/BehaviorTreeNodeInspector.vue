<template>
  <div v-if="!node" class="behavior-tree-node-inspector__empty">在画布中选中节点后可编辑配置</div>
  <div v-else class="behavior-tree-node-inspector">
    <p class="behavior-tree-node-inspector__hint" role="note">{{ maxChildrenHint }}</p>
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
          <el-select :model-value="configText('runMode')" style="width: 100%" @change="patchConfig('runMode', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_RUN_MODE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'PARALLEL'">
        <el-form-item label="成败策略">
          <el-select :model-value="configText('policy')" style="width: 100%" @change="patchConfig('policy', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_PARALLEL_POLICY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="最大并发">
          <el-input :model-value="configText('maxConcurrency')" placeholder="可空" @update:model-value="patchConfig('maxConcurrency', String($event))" />
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'REPEATER'">
        <el-form-item label="循环模式">
          <el-select :model-value="configText('loopMode')" style="width: 100%" @change="patchConfig('loopMode', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_LOOP_MODE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="次数">
          <el-input :model-value="configText('times')" @update:model-value="patchConfig('times', String($event))" />
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'UNTIL_SUCCESS' || node.kind === 'UNTIL_FAILURE'">
        <el-form-item label="最大重试">
          <el-input :model-value="configText('maxTimes')" @update:model-value="patchConfig('maxTimes', String($event))" />
        </el-form-item>
        <el-form-item label="收尾状态">
          <el-select :model-value="configText('finishState')" style="width: 100%" @change="patchConfig('finishState', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_STATE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'COOLDOWN'">
        <el-form-item label="冷却秒数">
          <el-input :model-value="configText('intervalSeconds')" @update:model-value="patchConfig('intervalSeconds', String($event))" />
        </el-form-item>
        <el-form-item label="实例黑板键">
          <el-input
            :model-value="configText('entityPrimaryKeyKey')"
            placeholder="可空"
            @update:model-value="patchConfig('entityPrimaryKeyKey', String($event))"
          />
        </el-form-item>
        <el-form-item label="冷却结果">
          <el-select :model-value="configText('hitResult')" style="width: 100%" @change="patchConfig('hitResult', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_STATE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'TIME_LIMIT'">
        <el-form-item label="限时秒数">
          <el-input :model-value="configText('limitSeconds')" @update:model-value="patchConfig('limitSeconds', String($event))" />
        </el-form-item>
        <el-form-item label="超时状态">
          <el-select :model-value="configText('timeoutState')" style="width: 100%" @change="patchConfig('timeoutState', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_STATE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'BLACKBOARD_CONDITION'">
        <el-form-item label="黑板键">
          <el-input :model-value="configText('key')" @update:model-value="patchConfig('key', String($event))" />
        </el-form-item>
        <el-form-item label="比较方式">
          <el-select :model-value="configText('op')" style="width: 100%" @change="patchConfig('op', String($event))">
            <el-option v-for="item in BEHAVIOR_TREE_OP_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isBehaviorTreeValueLessOp(configText('op'))" label="比较值">
          <el-input :model-value="configText('value')" @update:model-value="patchConfig('value', String($event))" />
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'CONDITION'">
        <el-form-item label="SpEL 表达式">
          <el-input :model-value="configText('expression')" type="textarea" :rows="3" @update:model-value="patchConfig('expression', String($event))" />
        </el-form-item>
      </template>
      <template v-else-if="node.kind === 'ACTION'">
        <el-form-item label="绑定行为">
          <el-select :model-value="configText('actionApi')" filterable clearable style="width: 100%" @change="patchConfig('actionApi', String($event || ''))">
            <el-option
              v-for="item in availableActions"
              :key="item.actionApi"
              :label="`${item.displayName || item.actionApi} · ${item.actionApi}`"
              :value="item.actionApi"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="重试次数">
          <el-input :model-value="configText('retryTimes')" placeholder="留空或 0" @update:model-value="patchConfig('retryTimes', String($event))" />
        </el-form-item>

        <template v-if="boundActionExternalParams.length">
          <div class="behavior-tree-node-inspector__subtitle">外部输入参数</div>
          <p class="behavior-tree-node-inspector__hint">执行时由本节点在 nodeExecutes 里传值；下面改成黑板或上游出参后，该参数不用再传。</p>
          <div class="behavior-tree-node-inspector__param-list" role="list">
            <div v-for="param in boundActionExternalParams" :key="`ext-${param.name}`" class="behavior-tree-node-inspector__param-row" role="listitem">
              <code>{{ param.name }}</code>
              <span class="behavior-tree-node-inspector__param-meta">{{ param.type || "STRING" }}</span>
              <span class="behavior-tree-node-inspector__param-meta">{{ param.description || "" }}</span>
            </div>
          </div>
        </template>

        <template v-if="boundActionInputs.length">
          <div class="behavior-tree-node-inspector__subtitle">入参取值</div>
          <div v-for="param in boundActionInputs" :key="`in-${param.name}`" class="behavior-tree-node-inspector__binding-card">
            <div class="behavior-tree-node-inspector__binding-head">
              <code>{{ param.name }}</code>
              <span class="behavior-tree-node-inspector__param-meta">{{ param.type || "STRING" }}</span>
              <span class="behavior-tree-node-inspector__param-meta">{{ resolveParamSourceLabel(param.sourceType) }}</span>
            </div>
            <el-form-item label="本节点取值">
              <el-select :model-value="resolveInputFrom(param.name)" style="width: 100%" @change="handleInputFromChange(param.name, String($event || ''))">
                <el-option v-for="item in BEHAVIOR_TREE_INPUT_FROM_OPTIONS" :key="item.value || 'default'" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="resolveInputFrom(param.name) === 'BLACKBOARD'" label="黑板键">
              <el-select
                :model-value="resolveInputBlackboardKey(param.name)"
                clearable
                filterable
                style="width: 100%"
                @change="emit('patch-input-binding', node.id, param.name, { from: 'BLACKBOARD', blackboardKey: String($event || '') })"
              >
                <el-option v-for="item in blackboardKeyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <template v-else-if="resolveInputFrom(param.name) === 'ACTION_OUTPUT'">
              <p v-if="!previousActionNode" class="behavior-tree-node-inspector__hint">前面没有行为节点可引用：请改用黑板变量传递。</p>
              <el-form-item v-else :label="`上一个行为「${previousActionLabel}」的出参`">
                <el-select
                  :model-value="resolveInputFromOutput(param.name)"
                  clearable
                  filterable
                  style="width: 100%"
                  @change="handleInputOutputChange(param.name, String($event || ''))"
                >
                  <el-option v-for="item in previousActionOutputOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </template>
          </div>
        </template>

        <template v-if="boundActionOutputs.length">
          <div class="behavior-tree-node-inspector__subtitle">出参回传黑板</div>
          <div v-for="output in boundActionOutputs" :key="`out-${output.name}`" class="behavior-tree-node-inspector__binding-card">
            <div class="behavior-tree-node-inspector__binding-head">
              <code>{{ output.fieldName || output.name }}</code>
              <span class="behavior-tree-node-inspector__param-meta">{{ output.type || "" }}</span>
              <span class="behavior-tree-node-inspector__param-meta">{{ output.description || "" }}</span>
            </div>
            <el-form-item label="回传黑板键">
              <el-select
                :model-value="resolveOutputBlackboardKey(output.name)"
                clearable
                filterable
                style="width: 100%"
                @change="emit('patch-output-binding', node.id, output.name, String($event || ''))"
              >
                <el-option
                  v-for="item in listReturnableOptions(output.name)"
                  :key="`${output.name}-${item.value || 'none'}`"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
        </template>
        <p v-else-if="hasOrphanOutputBindings" class="behavior-tree-node-inspector__hint">该行为没有可回传的出参，请先去掉节点上配的出参回传。</p>
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
import type {
  ActionTreeBindableAction,
  BehaviorTreeBlackboardItem,
  BehaviorTreeInputBindingDraft,
  BehaviorTreeKindMeta,
  BehaviorTreeNodeDraft,
  BehaviorTreeNodeKind,
} from "@/types";
import {
  BEHAVIOR_TREE_INPUT_FROM_OPTIONS,
  BEHAVIOR_TREE_PARAM_SOURCE_LABELS,
  findBehaviorTreeBindableAction,
  findBehaviorTreeInputBindingDraft,
  findBehaviorTreeOutputBindingDraft,
  findBehaviorTreeSurePreviousActionNode,
  listBehaviorTreeBindableInputs,
  listBehaviorTreeBindableOutputs,
  listBehaviorTreeOutputBindingDrafts,
  listBehaviorTreeReturnableBlackboardOptions,
} from "../utils/behaviorTreeActionBindings";
import {
  BEHAVIOR_TREE_LOCAL_KINDS,
  BEHAVIOR_TREE_LOOP_MODE_OPTIONS,
  BEHAVIOR_TREE_OP_OPTIONS,
  BEHAVIOR_TREE_PARALLEL_POLICY_OPTIONS,
  BEHAVIOR_TREE_RUN_MODE_OPTIONS,
  BEHAVIOR_TREE_STATE_OPTIONS,
  formatBehaviorTreeMaxChildrenHint,
  isBehaviorTreeValueLessOp,
} from "../utils/behaviorTreeConstants";

const props = defineProps<{
  node: BehaviorTreeNodeDraft | null;
  parent: BehaviorTreeNodeDraft | null;
  roots: BehaviorTreeNodeDraft[];
  blackboard: BehaviorTreeBlackboardItem[];
  kindMeta: Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>;
  availableActions: ActionTreeBindableAction[];
}>();

const emit = defineEmits<{
  "patch-field": [id: string, field: "displayName" | "enabled" | "skipIf" | "whileCondition", value: string | boolean];
  "patch-config": [id: string, field: string, value: string];
  "patch-input-binding": [id: string, paramName: string, patch: Partial<BehaviorTreeInputBindingDraft> & { from?: BehaviorTreeInputBindingDraft["from"] }];
  "patch-output-binding": [id: string, outputName: string, blackboardKey: string];
  reorder: [parentId: string, childId: string, delta: number];
  "detach-root": [id: string];
  "delete-node": [id: string];
}>();

/**
 * @description 读取配置标量文本。
 * @param field 字段名。
 * @returns 字符串。
 */
function configText(field: string): string {
  const value = props.node?.config?.[field];
  return typeof value === "string" ? value : "";
}

const maxChildrenHint = computed(() => {
  const kind = props.node?.kind;
  if (!kind) return "";
  const meta = props.kindMeta[kind];
  const maxChildren = typeof meta?.maxChildren === "number" ? meta.maxChildren : 0;
  return formatBehaviorTreeMaxChildrenHint(maxChildren);
});

const isCompositeNode = computed(() => {
  const kind = props.node?.kind;
  return kind === "SELECTOR" || kind === "SEQUENCE" || kind === "PARALLEL";
});

const boundAction = computed(() => findBehaviorTreeBindableAction(props.availableActions, configText("actionApi")));

const boundActionInputs = computed(() => listBehaviorTreeBindableInputs(boundAction.value));

const boundActionOutputs = computed(() => listBehaviorTreeBindableOutputs(boundAction.value));

const boundActionExternalParams = computed(() => {
  const action = boundAction.value;
  if (!action) return [];
  return (action.externalParams || []).filter((item) => {
    if (!item.name) return false;
    return !findBehaviorTreeInputBindingDraft(props.node?.config, item.name)?.from;
  });
});

const previousActionNode = computed(() => {
  if (!props.node) return null;
  return findBehaviorTreeSurePreviousActionNode(props.roots, props.node.id);
});

const previousActionLabel = computed(() => {
  const node = previousActionNode.value;
  if (!node) return "";
  return node.displayName.trim() || node.id;
});

const previousActionOutputOptions = computed(() => {
  const previous = previousActionNode.value;
  if (!previous) return [] as Array<{ value: string; label: string }>;
  const action = findBehaviorTreeBindableAction(props.availableActions, String(previous.config?.actionApi || ""));
  const outputs = listBehaviorTreeBindableOutputs(action);
  const options = outputs.map((item) => ({
    value: item.name,
    label: `${item.fieldName || item.name} · ${item.description || ""} (${item.type || ""})`,
  }));
  return [{ value: "", label: outputs.length ? "（选择出参）" : "（上一个节点的行为没有可引用的出参）" }, ...options];
});

const blackboardKeyOptions = computed(() => {
  const options = props.blackboard
    .map((item) => {
      const key = item.key.trim();
      if (!key) return null;
      return { value: key, label: `${key} (${item.valueType})` };
    })
    .filter((item): item is { value: string; label: string } => Boolean(item));
  return [{ value: "", label: "（未选择）" }, ...options];
});

const hasOrphanOutputBindings = computed(() => listBehaviorTreeOutputBindingDrafts(props.node?.config).length > 0);

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
 * @description 解析行为声明来源文案。
 * @param sourceType 来源。
 * @returns 文案。
 */
function resolveParamSourceLabel(sourceType: string | undefined): string {
  const key = String(sourceType || "").trim();
  return BEHAVIOR_TREE_PARAM_SOURCE_LABELS[key] || key || "—";
}

/**
 * @description 读取入参取值来源。
 * @param paramName 入参名。
 * @returns 来源。
 */
function resolveInputFrom(paramName: string): BehaviorTreeInputBindingDraft["from"] {
  return findBehaviorTreeInputBindingDraft(props.node?.config, paramName)?.from || "";
}

/**
 * @description 读取入参黑板键。
 * @param paramName 入参名。
 * @returns 黑板键。
 */
function resolveInputBlackboardKey(paramName: string): string {
  return findBehaviorTreeInputBindingDraft(props.node?.config, paramName)?.blackboardKey || "";
}

/**
 * @description 读取入参上游出参名。
 * @param paramName 入参名。
 * @returns 出参名。
 */
function resolveInputFromOutput(paramName: string): string {
  return findBehaviorTreeInputBindingDraft(props.node?.config, paramName)?.fromOutput || "";
}

/**
 * @description 读取出参回传黑板键。
 * @param outputName 出参标识。
 * @returns 黑板键。
 */
function resolveOutputBlackboardKey(outputName: string): string {
  return findBehaviorTreeOutputBindingDraft(props.node?.config, outputName)?.blackboardKey || "";
}

/**
 * @description 列出某出参可回传黑板选项。
 * @param outputName 出参标识。
 * @returns 选项。
 */
function listReturnableOptions(outputName: string): Array<{ value: string; label: string }> {
  return listBehaviorTreeReturnableBlackboardOptions(props.blackboard, outputName, resolveOutputBlackboardKey(outputName));
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

/**
 * @description 切换入参取值来源。
 * @param paramName 入参名。
 * @param from 来源。
 */
function handleInputFromChange(paramName: string, from: string): void {
  if (!props.node) return;
  const nextFrom = from === "BLACKBOARD" || from === "ACTION_OUTPUT" ? from : "";
  emit("patch-input-binding", props.node.id, paramName, nextFrom ? { from: nextFrom, blackboardKey: "", fromNodeId: "", fromOutput: "" } : { from: "" });
}

/**
 * @description 选择上游出参。
 * @param paramName 入参名。
 * @param output 出参名。
 */
function handleInputOutputChange(paramName: string, output: string): void {
  if (!props.node) return;
  const previous = previousActionNode.value;
  emit("patch-input-binding", props.node.id, paramName, {
    from: "ACTION_OUTPUT",
    fromNodeId: previous?.id || "",
    fromOutput: output,
  });
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

.behavior-tree-node-inspector__param-list,
.behavior-tree-node-inspector__binding-card {
  margin: 0 0 10px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-input-background);
}

.behavior-tree-node-inspector__param-row,
.behavior-tree-node-inspector__binding-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  padding: 8px 10px;
  font-size: 12px;
}

.behavior-tree-node-inspector__binding-card {
  padding: 0 10px 8px;
}

.behavior-tree-node-inspector__binding-head {
  padding-left: 0;
  padding-right: 0;
}

.behavior-tree-node-inspector__param-meta {
  color: var(--aircas-color-text-secondary);
}

.behavior-tree-node-inspector__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
</style>
