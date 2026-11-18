<template>
  <div class="behavior-tree-exec">
    <div v-if="showLoadPlanButton || showRunButton" class="behavior-tree-exec__toolbar">
      <el-button v-if="showLoadPlanButton" :loading="planStatus === 'loading'" @click="emit('load-plan')">读取执行要求</el-button>
      <el-button v-if="showRunButton" type="primary" :loading="testStatus === 'submitting'" @click="emit('run-test')">执行</el-button>
    </div>

    <p v-if="planStatus === 'loading'" class="behavior-tree-exec__state" role="status">正在读取执行要求…</p>
    <p v-else-if="planStatus === 'error'" class="behavior-tree-exec__state" role="alert">{{ planError }}</p>
    <p v-else-if="planStatus === 'empty'" class="behavior-tree-exec__state" role="status">{{ planError || "详情里没有 executeInputs" }}</p>

    <template v-if="planStatus === 'ready' || planStatus === 'empty'">
      <section class="behavior-tree-exec__section" aria-label="黑板变量">
        <h4 class="behavior-tree-exec__section-title">黑板变量</h4>

        <div v-if="!externalRows.length && !propertyGroups.length" class="behavior-tree-exec__empty">当前黑板没有外部输入或对象属性键</div>

        <div v-for="row in externalRows" :key="`ext-${row.key}`" class="behavior-tree-exec__field">
          <label
            >{{ row.key }} <code>{{ row.valueType }}</code></label
          >
          <el-input
            :model-value="externalDraft[row.key] ?? ''"
            :placeholder="row.defaultValueText ? `默认 ${row.defaultValueText}` : '留空不传'"
            @update:model-value="externalDraft[row.key] = String($event ?? '')"
          />
        </div>

        <div v-for="group in propertyGroups" :key="`prop-${group.objectId}`" class="behavior-tree-exec__property-group">
          <div class="behavior-tree-exec__field">
            <label>
              对象属性实例 · {{ resolveObjectLabel(group.objectId) }}
              <span v-if="group.items.length" class="behavior-tree-exec__muted">
                （{{ group.items.map((item) => item.key || item.bindPropertyUniqueIdentifier).join("、") }}）
              </span>
            </label>
            <el-select
              :model-value="blackboardObjectKeys[group.objectId] ?? ''"
              filterable
              clearable
              allow-create
              default-first-option
              style="width: 100%"
              :loading="Boolean(instanceLoadingIds[group.objectId])"
              placeholder="选择或输入实例主键"
              @visible-change="(open: boolean) => open && emit('ensure-instances', group.objectId)"
              @update:model-value="emit('update-blackboard-instance', group.objectId, String($event ?? ''))"
            >
              <el-option v-for="option in instanceOptions[group.objectId] || []" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </div>
          <div v-for="storageGroup in group.storageGroups || []" :key="`group-row-${group.objectId}-${storageGroup}`" class="behavior-tree-exec__field">
            <label>{{ storageGroup }} 行</label>
            <el-select
              :model-value="blackboardGroupRows[resolveGroupRowStateKey(group.objectId, storageGroup)] ?? ''"
              filterable
              clearable
              allow-create
              default-first-option
              style="width: 100%"
              :disabled="!(blackboardObjectKeys[group.objectId] || '').trim()"
              :loading="isGroupRowLoading(group.objectId, storageGroup)"
              :placeholder="(blackboardObjectKeys[group.objectId] || '').trim() ? `选择或输入 ${storageGroup} 行主键` : '先选实例'"
              @visible-change="(open: boolean) => open && emit('ensure-group-rows', group.objectId, storageGroup)"
              @update:model-value="emit('update-blackboard-group-row', group.objectId, storageGroup, String($event ?? ''))"
            >
              <el-option
                v-for="option in resolveGroupRowOptions(group.objectId, storageGroup)"
                :key="`${storageGroup}-${option.value}`"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
        </div>
      </section>

      <section class="behavior-tree-exec__section" aria-label="节点执行数据">
        <h4 class="behavior-tree-exec__section-title">节点</h4>
        <div v-if="!nodeBlocks.length" class="behavior-tree-exec__empty">执行要求未点名任何节点</div>

        <el-collapse v-else>
          <el-collapse-item v-for="block in nodeBlocks" :key="block.nodeId" :name="block.nodeId">
            <template #title>
              <span class="behavior-tree-exec__node-title">
                {{ block.displayName }}
                <span v-if="block.actionDisplayName" class="behavior-tree-exec__muted">{{ block.actionDisplayName }}</span>
              </span>
            </template>

            <div v-if="block.params.length" class="behavior-tree-exec__sub">
              <div class="behavior-tree-exec__sub-title">行为入参</div>
              <div v-for="param in block.params" :key="`${block.nodeId}-${param.key}`" class="behavior-tree-exec__field">
                <label>
                  {{ param.key }}
                  <code>{{ param.valueType || "STRING" }}</code>
                  <span class="behavior-tree-exec__muted">{{ inputSourceLabel(param.sourceType) }}</span>
                  <span v-if="param.required && resolveInputSource(param.sourceType) === 'EXTERNAL'" class="behavior-tree-exec__required">必填</span>
                </label>
                <el-input
                  v-if="resolveInputSource(param.sourceType) === 'EXTERNAL'"
                  :model-value="nodeDrafts[block.nodeId]?.params[param.key] ?? ''"
                  :placeholder="param.description || '请输入'"
                  @update:model-value="emit('update-node-param', block.nodeId, param.key, String($event ?? ''))"
                />
                <p v-else-if="resolveInputSource(param.sourceType) === 'FIXED'" class="behavior-tree-exec__muted">固定值，执行时取行为里声明的值</p>
                <el-select
                  v-else
                  :model-value="nodeDrafts[block.nodeId]?.inputParams[param.key]?.entityPrimaryKey ?? ''"
                  filterable
                  clearable
                  allow-create
                  default-first-option
                  style="width: 100%"
                  :loading="Boolean(param.objectIdentifier && instanceLoadingIds[param.objectIdentifier])"
                  :placeholder="param.objectIdentifier ? `选择 ${param.propertyDisplayName || resolveObjectLabel(param.objectIdentifier)}` : '没有对象标识'"
                  :disabled="!param.objectIdentifier"
                  @visible-change="(open: boolean) => open && param.objectIdentifier && emit('ensure-instances', param.objectIdentifier)"
                  @update:model-value="emit('update-node-input-instance', block.nodeId, param.key, String($event ?? ''))"
                >
                  <el-option
                    v-for="option in (param.objectIdentifier && instanceOptions[param.objectIdentifier]) || []"
                    :key="`${param.key}-${option.value}`"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </div>
            </div>

            <div v-if="block.ends" class="behavior-tree-exec__sub">
              <div class="behavior-tree-exec__sub-title">关系两端</div>
              <div class="behavior-tree-exec__field">
                <label>From · {{ resolveObjectLabel(block.ends.from) }}</label>
                <el-select
                  :model-value="nodeDrafts[block.nodeId]?.entityPrimaryKeys.from ?? ''"
                  filterable
                  clearable
                  allow-create
                  default-first-option
                  style="width: 100%"
                  :loading="Boolean(instanceLoadingIds[block.ends.from])"
                  placeholder="From 实例"
                  @visible-change="(open: boolean) => open && emit('ensure-instances', block.ends!.from)"
                  @update:model-value="emit('update-node-entity', block.nodeId, 'from', String($event ?? ''))"
                >
                  <el-option
                    v-for="option in instanceOptions[block.ends.from] || []"
                    :key="`from-${option.value}`"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </div>
              <div class="behavior-tree-exec__field">
                <label>To · {{ resolveObjectLabel(block.ends.to) }}</label>
                <el-select
                  :model-value="nodeDrafts[block.nodeId]?.entityPrimaryKeys.to ?? ''"
                  filterable
                  clearable
                  allow-create
                  default-first-option
                  style="width: 100%"
                  :loading="Boolean(instanceLoadingIds[block.ends.to])"
                  placeholder="To 实例"
                  @visible-change="(open: boolean) => open && emit('ensure-instances', block.ends!.to)"
                  @update:model-value="emit('update-node-entity', block.nodeId, 'to', String($event ?? ''))"
                >
                  <el-option v-for="option in instanceOptions[block.ends.to] || []" :key="`to-${option.value}`" :label="option.label" :value="option.value" />
                </el-select>
              </div>
            </div>

            <div v-else-if="block.objects.length" class="behavior-tree-exec__sub">
              <div class="behavior-tree-exec__sub-title">实例</div>
              <div v-for="objectId in block.objects" :key="`${block.nodeId}-obj-${objectId}`" class="behavior-tree-exec__field">
                <label>{{ resolveObjectLabel(objectId) }}</label>
                <el-select
                  :model-value="
                    block.objects.length === 1
                      ? nodeDrafts[block.nodeId]?.entityPrimaryKey || nodeDrafts[block.nodeId]?.entityPrimaryKeys[objectId] || ''
                      : nodeDrafts[block.nodeId]?.entityPrimaryKeys[objectId] || ''
                  "
                  filterable
                  clearable
                  allow-create
                  default-first-option
                  style="width: 100%"
                  :loading="Boolean(instanceLoadingIds[objectId])"
                  placeholder="选择或输入实例主键"
                  @visible-change="(open: boolean) => open && emit('ensure-instances', objectId)"
                  @update:model-value="
                    block.objects.length === 1
                      ? emit('update-node-entity', block.nodeId, 'entityPrimaryKey', String($event ?? ''))
                      : emit('update-node-entity', block.nodeId, objectId, String($event ?? ''))
                  "
                >
                  <el-option
                    v-for="option in instanceOptions[objectId] || []"
                    :key="`${objectId}-${option.value}`"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </div>
            </div>

            <div v-if="block.outputs.length" class="behavior-tree-exec__sub">
              <div class="behavior-tree-exec__sub-title">输出参数</div>
              <div
                v-for="target in block.outputs"
                :key="`${block.nodeId}-out-${target.key || target.paramName || target.storageGroup}`"
                class="behavior-tree-exec__output"
              >
                <div class="behavior-tree-exec__output-head">
                  <strong>{{ target.displayName || target.parameterName || target.paramName || target.key || "输出" }}</strong>
                  <code>{{ outputModeLabel(target.mode) }}</code>
                </div>
                <p v-if="target.mode === 'RESULT_ONLY'" class="behavior-tree-exec__muted">结果随执行返回，不落库</p>
                <template v-else>
                  <div v-if="target.mode !== 'DATA_PRIMARY_KEY' && target.objectIdentifier" class="behavior-tree-exec__field">
                    <label>写回实例 · {{ resolveObjectLabel(target.objectIdentifier) }}</label>
                    <el-select
                      :model-value="nodeDrafts[block.nodeId]?.outputParams[outputMapKey(target)]?.entityPrimaryKey ?? ''"
                      filterable
                      clearable
                      allow-create
                      default-first-option
                      style="width: 100%"
                      :loading="Boolean(instanceLoadingIds[target.objectIdentifier])"
                      placeholder="选择或输入实例主键"
                      @visible-change="(open: boolean) => open && emit('ensure-instances', target.objectIdentifier || '')"
                      @update:model-value="emit('update-node-output', block.nodeId, outputMapKey(target), 'entityPrimaryKey', String($event ?? ''))"
                    >
                      <el-option
                        v-for="option in instanceOptions[target.objectIdentifier] || []"
                        :key="`out-${option.value}`"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </div>
                  <div v-if="target.mode === 'DATA_PRIMARY_KEY' || target.rowRequired" class="behavior-tree-exec__field">
                    <label>行主键{{ target.storageGroup ? ` · ${target.storageGroup}` : "" }}</label>
                    <el-input
                      :model-value="nodeDrafts[block.nodeId]?.outputParams[outputMapKey(target)]?.rowKey ?? ''"
                      placeholder="分组行主键"
                      @update:model-value="emit('update-node-output', block.nodeId, outputMapKey(target), 'rowKey', String($event ?? ''))"
                    />
                  </div>
                </template>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </section>
    </template>

    <section v-if="showLogs" class="behavior-tree-exec__section" aria-label="接口日志">
      <div class="behavior-tree-exec__log-head">
        <h4 class="behavior-tree-exec__section-title">接口日志</h4>
        <el-button link type="danger" @click="emit('clear-logs')">清空</el-button>
      </div>
      <div v-if="!logs.length" class="behavior-tree-exec__empty">暂无日志</div>
      <article v-for="entry in logs" :key="entry.id" class="behavior-tree-exec__log">
        <header>
          <strong>{{ entry.label }}</strong>
          <time>{{ entry.at }}</time>
        </header>
        <pre class="behavior-tree-exec__pre">{{ entry.detail }}</pre>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import type {
  BehaviorTreeBlackboardItem,
  BehaviorTreeExecuteInputParam,
  BehaviorTreeExecuteOutputParam,
  BehaviorTreeExecLogEntry,
  BehaviorTreeNodeExecDraft,
} from "@/types";
import type { BehaviorTreeEntityOption, BehaviorTreeExecPlanStatus, BehaviorTreeExecTestStatus } from "@/composables/behaviorTree/useBehaviorTreeExecution";
import { resolveBehaviorTreeBbGroupRowStateKey, resolveBehaviorTreeOutputDraftKey } from "@/utils/behaviorTreeExecutePlan";

const props = withDefaults(
  defineProps<{
    planStatus: BehaviorTreeExecPlanStatus;
    planError: string;
    testStatus: BehaviorTreeExecTestStatus;
    logs: BehaviorTreeExecLogEntry[];
    externalRows: BehaviorTreeBlackboardItem[];
    propertyGroups: Array<{ objectId: string; items: BehaviorTreeBlackboardItem[]; storageGroups?: string[] }>;
    nodeBlocks: Array<{
      nodeId: string;
      displayName: string;
      actionApi: string;
      actionDisplayName?: string;
      params: BehaviorTreeExecuteInputParam[];
      outputs: BehaviorTreeExecuteOutputParam[];
      ends: { from: string; to: string; self: boolean } | null;
      objects: string[];
    }>;
    externalDraft: Record<string, string>;
    blackboardObjectKeys: Record<string, string>;
    blackboardGroupRows?: Record<string, string>;
    groupRowOptions?: Record<string, BehaviorTreeEntityOption[]>;
    groupRowLoadingIds?: Record<string, true>;
    nodeDrafts: Record<string, BehaviorTreeNodeExecDraft>;
    instanceOptions: Record<string, BehaviorTreeEntityOption[]>;
    instanceLoadingIds: Record<string, true>;
    resolveObjectLabel: (objectId: string) => string;
    /** 是否展示「读取执行要求」；测试弹框打开已自动读取时可关闭。 */
    showLoadPlanButton?: boolean;
    /** 是否展示「执行」；调度配置场景关闭。 */
    showRunButton?: boolean;
    /** 是否展示接口日志；调度配置场景关闭。 */
    showLogs?: boolean;
  }>(),
  {
    showLoadPlanButton: true,
    showRunButton: true,
    showLogs: true,
    blackboardGroupRows: () => ({}),
    groupRowOptions: () => ({}),
    groupRowLoadingIds: () => ({}),
  },
);

const emit = defineEmits<{
  "load-plan": [];
  "run-test": [];
  "clear-logs": [];
  "ensure-instances": [objectId: string];
  "ensure-group-rows": [objectId: string, storageGroup: string];
  "update-blackboard-instance": [objectId: string, value: string];
  "update-blackboard-group-row": [objectId: string, storageGroup: string, value: string];
  "update-node-param": [nodeId: string, key: string, value: string];
  "update-node-entity": [nodeId: string, objectOrRole: string, value: string];
  "update-node-input-instance": [nodeId: string, key: string, value: string];
  "update-node-output": [nodeId: string, mapKey: string, field: "entityPrimaryKey" | "rowKey", value: string];
}>();

/**
 * @description 出参草稿 map 键。
 * @param target 出参目标。
 * @returns 键。
 */
function outputMapKey(target: BehaviorTreeExecuteOutputParam): string {
  return resolveBehaviorTreeOutputDraftKey(target);
}

/**
 * @description 黑板分组行草稿键。
 * @param objectId 对象标识。
 * @param storageGroup 分组名。
 * @returns 草稿键。
 */
function resolveGroupRowStateKey(objectId: string, storageGroup: string): string {
  return resolveBehaviorTreeBbGroupRowStateKey(objectId, storageGroup);
}

/**
 * @description 读取分组行下拉候选。
 * @param objectId 对象标识。
 * @param storageGroup 分组名。
 * @returns 选项列表。
 */
function resolveGroupRowOptions(objectId: string, storageGroup: string): BehaviorTreeEntityOption[] {
  const instance = (props.blackboardObjectKeys[objectId] || "").trim();
  if (!instance) return [];
  const optionKey = `${objectId}|${instance}|${storageGroup}`;
  const options = props.groupRowOptions?.[optionKey] || [];
  const current = (props.blackboardGroupRows?.[resolveGroupRowStateKey(objectId, storageGroup)] || "").trim();
  if (current && !options.some((item) => item.value === current)) {
    return [{ value: current, label: `行 ${current}` }, ...options];
  }
  return options;
}

/**
 * @description 分组行是否在加载中。
 * @param objectId 对象标识。
 * @param storageGroup 分组名。
 * @returns 是否加载中。
 */
function isGroupRowLoading(objectId: string, storageGroup: string): boolean {
  const instance = (props.blackboardObjectKeys[objectId] || "").trim();
  if (!instance) return false;
  return Boolean(props.groupRowLoadingIds?.[`${objectId}|${instance}|${storageGroup}`]);
}

/**
 * @description 归一化入参来源。
 * @param sourceType 来源。
 * @returns 来源枚举值。
 */
function resolveInputSource(sourceType: string | null | undefined): string {
  const source = String(sourceType || "EXTERNAL").trim();
  return source || "EXTERNAL";
}

/**
 * @description 入参来源展示文案。
 * @param sourceType 来源。
 * @returns 文案。
 */
function inputSourceLabel(sourceType: string | null | undefined): string {
  const map: Record<string, string> = {
    EXTERNAL: "外部输入",
    PROPERTY: "对象属性",
    FIXED: "固定值",
    OBJECT: "对象",
    LIST: "List",
  };
  const source = resolveInputSource(sourceType);
  return map[source] || source;
}

/**
 * @description 出参模式展示文案。
 * @param mode 模式。
 * @returns 文案。
 */
function outputModeLabel(mode: string | null | undefined): string {
  if (mode === "DATA_PRIMARY_KEY") return "写分组行";
  if (mode === "RESULT_ONLY") return "仅返回";
  return "写入对象属性";
}
</script>

<style scoped lang="scss">
.behavior-tree-exec {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.behavior-tree-exec__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.behavior-tree-exec__state,
.behavior-tree-exec__empty,
.behavior-tree-exec__muted {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.behavior-tree-exec__state[role="alert"] {
  color: var(--el-color-danger);
}

.behavior-tree-exec__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid var(--aircas-color-border);
}

.behavior-tree-exec__section-title {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.behavior-tree-exec__property-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.behavior-tree-exec__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.behavior-tree-exec__field > label {
  color: var(--aircas-color-text-primary);
  font-size: 12px;
}

.behavior-tree-exec__field code,
.behavior-tree-exec__node-title code,
.behavior-tree-exec__output-head code {
  margin-left: 4px;
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
}

.behavior-tree-exec__required {
  margin-left: 6px;
  color: var(--el-color-danger);
  font-size: 11px;
}

.behavior-tree-exec__node-title {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  color: var(--aircas-color-text-primary);
  font-size: 12px;
}

.behavior-tree-exec__sub {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.behavior-tree-exec__sub-title {
  color: var(--aircas-color-text-primary);
  font-size: 12px;
  font-weight: 600;
}

.behavior-tree-exec__output {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  background: var(--aircas-color-page-background);
}

.behavior-tree-exec__output-head {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  color: var(--aircas-color-text-primary);
  font-size: 12px;
}

.behavior-tree-exec__log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.behavior-tree-exec__log {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
}

.behavior-tree-exec__log > header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
  color: var(--aircas-color-text-primary);
  font-size: 12px;
}

.behavior-tree-exec__log time {
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
}

.behavior-tree-exec__pre {
  margin: 0;
  max-height: 220px;
  overflow: auto;
  color: var(--aircas-color-text-primary);
  font-size: 11px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
