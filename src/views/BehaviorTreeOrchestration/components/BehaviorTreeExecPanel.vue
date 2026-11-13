<template>
  <div class="behavior-tree-exec">
    <div class="behavior-tree-exec__toolbar">
      <el-button :loading="planStatus === 'loading'" @click="emit('load-plan')">读取执行要求</el-button>
      <el-button type="primary" :loading="testStatus === 'submitting'" @click="emit('run-test')">试跑 tree/test</el-button>
    </div>

    <p class="behavior-tree-exec__hint">试跑不要求发布，但读的是库里已保存的定义——改了画布请先保存再试跑。必填项没传会被后端拒绝。</p>

    <p v-if="planStatus === 'loading'" class="behavior-tree-exec__state" role="status">正在读取执行要求…</p>
    <p v-else-if="planStatus === 'error'" class="behavior-tree-exec__state" role="alert">{{ planError }}</p>
    <p v-else-if="planStatus === 'empty'" class="behavior-tree-exec__state" role="status">{{ planError || "详情里没有 executeInputs" }}</p>
    <p v-else-if="planStatus === 'idle'" class="behavior-tree-exec__state" role="status">
      还没读取执行要求：点「读取执行要求」按当前行为 api 读详情里的 executeInputs。
    </p>

    <template v-if="planStatus === 'ready' || planStatus === 'empty'">
      <section class="behavior-tree-exec__section" aria-label="黑板变量">
        <h4 class="behavior-tree-exec__section-title">黑板变量</h4>
        <p class="behavior-tree-exec__hint">外部输入留空时取默认值；对象属性在这里选实例，执行时按实例当前值重读。</p>

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

        <div v-for="group in propertyGroups" :key="`prop-${group.objectId}`" class="behavior-tree-exec__field">
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
            @update:model-value="blackboardObjectKeys[group.objectId] = String($event ?? '')"
          >
            <el-option v-for="option in instanceOptions[group.objectId] || []" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </div>
      </section>

      <section class="behavior-tree-exec__section" aria-label="节点执行数据">
        <h4 class="behavior-tree-exec__section-title">节点</h4>
        <p class="behavior-tree-exec__hint">nodeExecutes：按节点填行为入参、实例/关系两端与写回行。</p>
        <div v-if="!nodeBlocks.length" class="behavior-tree-exec__empty">执行要求未点名任何节点</div>

        <el-collapse v-else>
          <el-collapse-item v-for="block in nodeBlocks" :key="block.nodeId" :name="block.nodeId">
            <template #title>
              <span class="behavior-tree-exec__node-title">
                {{ block.displayName }}
                <code>{{ block.nodeId }}</code>
                <span v-if="block.actionApi" class="behavior-tree-exec__muted">{{ block.actionApi }}</span>
              </span>
            </template>

            <div v-if="block.params.length" class="behavior-tree-exec__sub">
              <div class="behavior-tree-exec__sub-title">行为入参</div>
              <div v-for="param in block.params" :key="`${block.nodeId}-${param.key}`" class="behavior-tree-exec__field">
                <label>
                  {{ param.key }}
                  <code>{{ param.valueType || "STRING" }}</code>
                  <span v-if="param.required" class="behavior-tree-exec__required">必填</span>
                </label>
                <el-input
                  :model-value="nodeDrafts[block.nodeId]?.params[param.key] ?? ''"
                  :placeholder="param.description || '请输入'"
                  @update:model-value="emit('update-node-param', block.nodeId, param.key, String($event ?? ''))"
                />
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
                  <strong>{{ target.displayName || target.paramName || target.key || "输出" }}</strong>
                  <code>{{ target.mode || "OUTPUT_PARAM" }}</code>
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
                  <div v-if="target.mode === 'DATA_PRIMARY_KEY' || (target.storageGroup && target.storageGroup !== 'main')" class="behavior-tree-exec__field">
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

    <section class="behavior-tree-exec__section" aria-label="试跑结果">
      <h4 class="behavior-tree-exec__section-title">试跑结果</h4>
      <p v-if="testStatus === 'submitting'" class="behavior-tree-exec__state" role="status">试跑中…</p>
      <p v-else-if="testStatus === 'error'" class="behavior-tree-exec__state" role="alert">{{ testError }}</p>
      <p v-else-if="testStatus === 'idle'" class="behavior-tree-exec__empty">尚未试跑</p>
      <el-descriptions v-else-if="testResult && isPlainResultObject(testResult)" :column="1" size="small" border>
        <el-descriptions-item v-for="(value, key) in flattenResultEntries(testResult)" :key="String(key)" :label="String(key)">
          <pre class="behavior-tree-exec__pre">{{ formatResultValue(value) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <pre v-else-if="testResult != null" class="behavior-tree-exec__pre">{{ formatResultValue(testResult) }}</pre>
    </section>

    <section class="behavior-tree-exec__section" aria-label="接口日志">
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
  BehaviorTreeExecuteOutputParam,
  BehaviorTreeExecLogEntry,
  BehaviorTreeNodeExecDraft,
  PostOntologyActionTreeTestData,
} from "@/types";
import type { BehaviorTreeEntityOption, BehaviorTreeExecPlanStatus, BehaviorTreeExecTestStatus } from "../composables/useBehaviorTreeExecution";

defineProps<{
  planStatus: BehaviorTreeExecPlanStatus;
  planError: string;
  testStatus: BehaviorTreeExecTestStatus;
  testError: string;
  testResult: PostOntologyActionTreeTestData;
  logs: BehaviorTreeExecLogEntry[];
  externalRows: BehaviorTreeBlackboardItem[];
  propertyGroups: Array<{ objectId: string; items: BehaviorTreeBlackboardItem[] }>;
  nodeBlocks: Array<{
    nodeId: string;
    displayName: string;
    actionApi: string;
    params: Array<{ key: string; valueType?: string; required?: boolean; description?: string | null }>;
    outputs: BehaviorTreeExecuteOutputParam[];
    ends: { from: string; to: string; self: boolean } | null;
    objects: string[];
  }>;
  externalDraft: Record<string, string>;
  blackboardObjectKeys: Record<string, string>;
  nodeDrafts: Record<string, BehaviorTreeNodeExecDraft>;
  instanceOptions: Record<string, BehaviorTreeEntityOption[]>;
  instanceLoadingIds: Record<string, true>;
  resolveObjectLabel: (objectId: string) => string;
}>();

const emit = defineEmits<{
  "load-plan": [];
  "run-test": [];
  "clear-logs": [];
  "ensure-instances": [objectId: string];
  "update-node-param": [nodeId: string, key: string, value: string];
  "update-node-entity": [nodeId: string, objectOrRole: string, value: string];
  "update-node-output": [nodeId: string, mapKey: string, field: "entityPrimaryKey" | "rowKey", value: string];
}>();

/**
 * @description 出参草稿 map 键。
 * @param target 出参目标。
 * @returns 键。
 */
function outputMapKey(target: BehaviorTreeExecuteOutputParam): string {
  return (target.key || target.paramName || target.storageGroup || "").trim();
}

/**
 * @description 判断结果是否为普通对象。
 * @param value 结果。
 * @returns 是否对象。
 */
function isPlainResultObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * @description 展平结果条目（一层）。
 * @param value 结果对象。
 * @returns 键值对。
 */
function flattenResultEntries(value: Record<string, unknown>): Record<string, unknown> {
  return value;
}

/**
 * @description 格式化结果值。
 * @param value 任意值。
 * @returns 文本。
 */
function formatResultValue(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
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

.behavior-tree-exec__hint,
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
