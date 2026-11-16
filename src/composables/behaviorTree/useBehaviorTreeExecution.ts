import { computed, reactive, ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import { getOntologyActionInfoInterface, getOntologyEntitiesInterface, postOntologyActionTreeTestInterface } from "@/apis";
import type {
  BehaviorTreeBlackboardItem,
  BehaviorTreeExecuteInputs,
  BehaviorTreeExecLogEntry,
  BehaviorTreeModel,
  BehaviorTreeNodeExecDraft,
  BehaviorTreeObjectPropertyOption,
  PostOntologyActionTreeTestData,
  SpaceRelationObjectOption,
} from "@/types";
import { mapBehaviorTreeDefinitionToBlackboardItems, resolveBehaviorTreeBlackboardSource } from "@/utils/behaviorTreeBlackboard.ts";
import {
  buildBehaviorTreeTestPayload,
  collectBehaviorTreeExecMissingFields,
  createBehaviorTreeNodeExecDraft,
  findBehaviorTreeExecuteNodePlan,
  listBehaviorTreeExecPlanNodeIds,
  listBehaviorTreeExecPlanObjectIds,
  listBehaviorTreeNodeInputParams,
  listBehaviorTreeNodeOutputTargets,
  listBehaviorTreeNodeRequirements,
  mapBehaviorTreeEntityRecordOption,
  resolveBehaviorTreeNodeDisplayName,
  resolveBehaviorTreeNodeLinkEnds,
  resolveBehaviorTreeOutputDraftKey,
} from "@/utils/behaviorTreeExecutePlan.ts";

/** 实例下拉选项。 */
export interface BehaviorTreeEntityOption {
  value: string;
  label: string;
}

/** 执行面板加载态。 */
export type BehaviorTreeExecPlanStatus = "idle" | "loading" | "ready" | "empty" | "error";

/** 试跑命令态。 */
export type BehaviorTreeExecTestStatus = "idle" | "submitting" | "success" | "error";

/**
 * @description 管理行为树「执行 / 日志」：读 executeInputs、填参、试跑与本面板接口日志。
 * @param options 编排上下文。
 * @returns 执行面板状态与命令。
 */
export function useBehaviorTreeExecution(options: {
  spaceId: Ref<string> | (() => string);
  treeApi: Ref<string> | (() => string);
  model: BehaviorTreeModel;
  objectOptions: Ref<SpaceRelationObjectOption[]>;
  objectProperties: Ref<Record<string, BehaviorTreeObjectPropertyOption>>;
}) {
  const planStatus = ref<BehaviorTreeExecPlanStatus>("idle");
  const planError = ref("");
  const execPlan = ref<BehaviorTreeExecuteInputs | null>(null);
  const externalInputDraft = reactive<Record<string, string>>({});
  const blackboardObjectKeys = reactive<Record<string, string>>({});
  const nodeDrafts = reactive<Record<string, BehaviorTreeNodeExecDraft>>({});
  const instanceOptions = reactive<Record<string, BehaviorTreeEntityOption[]>>({});
  const instanceLoadingIds = reactive<Record<string, true>>({});
  const testStatus = ref<BehaviorTreeExecTestStatus>("idle");
  const testError = ref("");
  const testResult = ref<PostOntologyActionTreeTestData>(null);
  const logs = ref<BehaviorTreeExecLogEntry[]>([]);
  let planToken = 0;
  let testToken = 0;
  let logSeq = 0;

  /**
   * @description 读取空间 id。
   * @returns 空间 id。
   */
  function readSpaceId(): string {
    const value = typeof options.spaceId === "function" ? options.spaceId() : options.spaceId.value;
    return String(value ?? "").trim();
  }

  /**
   * @description 读取行为树 api。
   * @returns treeApi。
   */
  function readTreeApi(): string {
    const value = typeof options.treeApi === "function" ? options.treeApi() : options.treeApi.value;
    return String(value ?? "").trim();
  }

  /**
   * @description 追加本面板接口日志（仅用于执行接口返回）。
   * @param label 摘要。
   * @param detail 详情。
   */
  function appendBehaviorTreeExecLog(label: string, detail: unknown): void {
    logSeq += 1;
    let text = "";
    try {
      text = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
    } catch {
      text = String(detail);
    }
    logs.value = [
      {
        id: `log_${logSeq}`,
        at: new Date().toLocaleString(),
        label,
        detail: text,
      },
      ...logs.value,
    ].slice(0, 80);
  }

  /**
   * @description 清空接口日志。
   */
  function clearBehaviorTreeExecLogs(): void {
    logs.value = [];
  }

  /**
   * @description 确保节点草稿存在。
   * @param nodeId 节点 id。
   * @returns 草稿。
   */
  function ensureBehaviorTreeNodeExecDraft(nodeId: string): BehaviorTreeNodeExecDraft {
    if (!nodeDrafts[nodeId]) nodeDrafts[nodeId] = createBehaviorTreeNodeExecDraft();
    const draft = nodeDrafts[nodeId];
    if (!draft.params) draft.params = {};
    if (!draft.entityPrimaryKeys) draft.entityPrimaryKeys = {};
    if (!draft.inputParams) draft.inputParams = {};
    if (!draft.outputParams) draft.outputParams = {};
    return draft;
  }

  /**
   * @description 外部输入黑板键列表。
   */
  const externalBlackboardRows = computed(() => options.model.blackboard.filter((item) => resolveBehaviorTreeBlackboardSource(item) === "EXTERNAL"));

  /**
   * @description 对象属性黑板键按对象分组（优先 executeInputs.blackboardInstances）。
   */
  const propertyBlackboardGroups = computed(() => {
    const groups = new Map<string, BehaviorTreeBlackboardItem[]>();
    for (const item of options.model.blackboard) {
      if (resolveBehaviorTreeBlackboardSource(item) !== "PROPERTY") continue;
      const bound = options.objectProperties.value[item.bindPropertyUniqueIdentifier.trim()];
      const objectId = (bound?.objectId || "").trim();
      if (!objectId) continue;
      const list = groups.get(objectId) || [];
      list.push(item);
      groups.set(objectId, list);
    }
    for (const requirement of execPlan.value?.blackboardInstances ?? []) {
      const keys = requirement.blackboardKeys ?? [];
      const objectId = (requirement.objectIdentifier || "").trim();
      if (!objectId) continue;
      if (!groups.has(objectId)) {
        groups.set(
          objectId,
          keys.map((key) => ({
            key,
            valueType: "STRING" as const,
            source: "PROPERTY" as const,
            bindPropertyUniqueIdentifier: "",
            fixedValueText: "",
            defaultValueText: "",
            description: "",
          })),
        );
      }
    }
    return [...groups.entries()].map(([objectId, items]) => ({ objectId, items }));
  });

  /**
   * @description 执行要求涉及的节点块（取自 executeInputs.nodes）。
   */
  const execNodeBlocks = computed(() => {
    const plan = execPlan.value;
    if (!plan) return [];
    return listBehaviorTreeExecPlanNodeIds(plan).map((nodeId) => {
      const nodePlan = findBehaviorTreeExecuteNodePlan(plan, nodeId);
      const params = listBehaviorTreeNodeInputParams(plan, nodeId);
      const requirements = listBehaviorTreeNodeRequirements(plan, nodeId);
      const outputs = listBehaviorTreeNodeOutputTargets(plan, nodeId);
      const ends = resolveBehaviorTreeNodeLinkEnds(requirements);
      const endIds = ends ? [ends.from, ends.to] : [];
      const objects = [
        ...new Set(
          requirements
            .filter((item) => !(item.blackboardKeys ?? []).length)
            .map((item) => (item.objectIdentifier || "").trim())
            .filter((objectId) => objectId && !endIds.includes(objectId)),
        ),
      ];
      return {
        nodeId,
        displayName: (nodePlan?.nodeDisplayName || "").trim() || resolveBehaviorTreeNodeDisplayName(options.model.roots, nodeId) || nodeId,
        actionApi: (nodePlan?.actionApi || "").trim(),
        actionDisplayName: (nodePlan?.actionDisplayName || "").trim(),
        params,
        requirements,
        outputs,
        ends,
        objects,
      };
    });
  });

  /**
   * @description 对象展示名。
   * @param objectId 对象 id。
   * @returns 展示名。
   */
  function resolveObjectLabel(objectId: string): string {
    const found = options.objectOptions.value.find((item) => item.value === objectId);
    return found?.label || objectId;
  }

  /**
   * @description 加载指定对象的实例列表（首屏 50 条）。
   * @param objectId 对象 uniqueIdentifier。
   */
  async function loadBehaviorTreeEntityOptions(objectId: string): Promise<void> {
    const id = objectId.trim();
    if (!id || instanceOptions[id] || instanceLoadingIds[id]) return;
    instanceLoadingIds[id] = true;
    try {
      const response = await getOntologyEntitiesInterface({
        ontologyUniqueIdentifier: id,
        pageNum: 1,
        pageSize: 50,
      });
      if (response.code !== 200 || !response.data) {
        instanceOptions[id] = [];
        return;
      }
      const records = Array.isArray(response.data.records) ? response.data.records : [];
      instanceOptions[id] = records
        .map((item) => mapBehaviorTreeEntityRecordOption(item as Record<string, unknown>))
        .filter((item): item is BehaviorTreeEntityOption => item != null);
    } catch {
      instanceOptions[id] = [];
    } finally {
      delete instanceLoadingIds[id];
    }
  }

  /**
   * @description 按当前执行要求预拉实例列表。
   */
  async function prefetchBehaviorTreePlanInstances(): Promise<void> {
    const objectIds = new Set(listBehaviorTreeExecPlanObjectIds(execPlan.value));
    for (const group of propertyBlackboardGroups.value) objectIds.add(group.objectId);
    await Promise.all([...objectIds].map((objectId) => loadBehaviorTreeEntityOptions(objectId)));
  }

  /**
   * @description 读取执行要求（GET /ontology/action → executeInputs.nodes）。
   * @param silent 是否静默（不弹 toast）。
   */
  async function loadBehaviorTreeExecutePlan(silent = false): Promise<void> {
    const spaceId = readSpaceId();
    const treeApi = readTreeApi();
    if (!spaceId || !treeApi) {
      planStatus.value = "error";
      planError.value = "缺少空间 id 或行为 api";
      if (!silent) ElMessage.error(planError.value);
      return;
    }
    const requestToken = ++planToken;
    planStatus.value = "loading";
    planError.value = "";
    try {
      const response = await getOntologyActionInfoInterface({ actionApi: treeApi, ontologySpaceId: spaceId });
      if (requestToken !== planToken) return;
      const plan = response.data?.executeInputs ?? null;
      if (response.code !== 200 || !response.data) {
        throw new Error(response.message || "读取执行要求失败");
      }
      if (response.data.actionKind && response.data.actionKind !== "TREE") {
        throw new Error(`该 api 不是行为树，actionKind=${response.data.actionKind}`);
      }
      if (response.data.treeDefinition) {
        options.model.blackboard.splice(0, options.model.blackboard.length, ...mapBehaviorTreeDefinitionToBlackboardItems(response.data.treeDefinition));
      }
      execPlan.value = plan;
      for (const nodeId of listBehaviorTreeExecPlanNodeIds(plan)) ensureBehaviorTreeNodeExecDraft(nodeId);
      for (const item of options.model.blackboard) {
        if (resolveBehaviorTreeBlackboardSource(item) !== "EXTERNAL") continue;
        const key = item.key.trim();
        if (key && externalInputDraft[key] == null) {
          externalInputDraft[key] = String(item.defaultValueText ?? "");
        }
      }
      if (!plan) {
        planStatus.value = "empty";
        planError.value = "详情里没有 executeInputs";
        if (!silent) ElMessage.warning(planError.value);
        return;
      }
      planStatus.value = "ready";
      await prefetchBehaviorTreePlanInstances();
      if (!silent) ElMessage.success("已读取执行要求");
    } catch (error) {
      if (requestToken !== planToken) return;
      planStatus.value = "error";
      planError.value = error instanceof Error ? error.message : "读取执行要求失败";
      if (!silent) ElMessage.error(planError.value);
    }
  }

  /**
   * @description 更新节点行为入参草稿。
   * @param nodeId 节点 id。
   * @param key 参数名。
   * @param value 文本值。
   */
  function updateNodeParamDraft(nodeId: string, key: string, value: string): void {
    ensureBehaviorTreeNodeExecDraft(nodeId).params[key] = value;
  }

  /**
   * @description 更新节点实例主键草稿。
   * @param nodeId 节点 id。
   * @param objectOrRole 对象 id 或 from/to。
   * @param value 主键文本。
   */
  function updateNodeEntityKeyDraft(nodeId: string, objectOrRole: string, value: string): void {
    const draft = ensureBehaviorTreeNodeExecDraft(nodeId);
    if (objectOrRole === "entityPrimaryKey") {
      draft.entityPrimaryKey = value;
      return;
    }
    draft.entityPrimaryKeys[objectOrRole] = value;
  }

  /**
   * @description 更新节点出参位置草稿。
   * @param nodeId 节点 id。
   * @param mapKey 出参键。
   * @param field 字段。
   * @param value 值。
   */
  function updateNodeOutputDraft(nodeId: string, mapKey: string, field: "entityPrimaryKey" | "rowKey", value: string): void {
    const draft = ensureBehaviorTreeNodeExecDraft(nodeId);
    if (!draft.outputParams[mapKey]) draft.outputParams[mapKey] = { entityPrimaryKey: "", rowKey: "" };
    draft.outputParams[mapKey][field] = value;
    if (field === "rowKey") draft.dataPrimaryKey = value;
  }

  /**
   * @description 更新节点入参读实例草稿。
   * @param nodeId 节点 id。
   * @param key 参数名。
   * @param field 字段。
   * @param value 值。
   * @param group 分组名（行主键时）。
   */
  function updateNodeInputParamDraft(nodeId: string, key: string, field: "entityPrimaryKey" | "row", value: string, group = ""): void {
    const draft = ensureBehaviorTreeNodeExecDraft(nodeId);
    if (!draft.inputParams[key]) draft.inputParams[key] = { entityPrimaryKey: "", rows: {} };
    if (field === "entityPrimaryKey") {
      draft.inputParams[key].entityPrimaryKey = value;
      return;
    }
    if (group) draft.inputParams[key].rows[group] = value;
  }

  /**
   * @description 试跑行为树。
   */
  async function runBehaviorTreeTest(): Promise<void> {
    const spaceId = readSpaceId();
    const treeApi = readTreeApi();
    if (!spaceId || !treeApi) {
      ElMessage.error("缺少空间 id 或行为 api");
      return;
    }
    if (planStatus.value === "idle" || !execPlan.value) {
      ElMessage.warning("请先读取执行要求");
      return;
    }
    const objectLabelById: Record<string, string> = {};
    for (const item of options.objectOptions.value) {
      objectLabelById[item.value] = item.label || item.value;
    }
    const missing = collectBehaviorTreeExecMissingFields({
      plan: execPlan.value,
      objectLabelById,
      blackboardObjectKeys,
      nodeDrafts,
    });
    if (missing.length) {
      ElMessage.error(`执行前先补数据：${missing.join("、")}`);
      return;
    }
    const built = buildBehaviorTreeTestPayload({
      spaceId,
      treeApi,
      plan: execPlan.value,
      blackboard: options.model.blackboard,
      objectProperties: options.objectProperties.value,
      externalInputDraft,
      blackboardObjectKeys,
      nodeDrafts,
    });
    if ("error" in built) {
      ElMessage.error(built.error);
      return;
    }
    const requestToken = ++testToken;
    testStatus.value = "submitting";
    testError.value = "";
    try {
      const response = await postOntologyActionTreeTestInterface(built.payload);
      if (requestToken !== testToken) return;
      clearBehaviorTreeExecLogs();
      appendBehaviorTreeExecLog("POST /ontology/action/tree/test 返回", {
        code: response.code,
        message: response.message,
        data: response.data,
      });
      if (response.code !== 200) {
        throw new Error(response.message || "试跑失败");
      }
      testResult.value = response.data ?? null;
      testStatus.value = "success";
      ElMessage.success("试跑完成");
    } catch (error) {
      if (requestToken !== testToken) return;
      testStatus.value = "error";
      testError.value = error instanceof Error ? error.message : "试跑失败";
      ElMessage.error(testError.value);
    }
  }

  return {
    planStatus,
    planError,
    execPlan,
    externalInputDraft,
    blackboardObjectKeys,
    nodeDrafts,
    instanceOptions,
    instanceLoadingIds,
    testStatus,
    testError,
    testResult,
    logs,
    externalBlackboardRows,
    propertyBlackboardGroups,
    execNodeBlocks,
    resolveObjectLabel,
    resolveBehaviorTreeOutputDraftKey,
    appendBehaviorTreeExecLog,
    clearBehaviorTreeExecLogs,
    ensureBehaviorTreeNodeExecDraft,
    loadBehaviorTreeExecutePlan,
    loadBehaviorTreeEntityOptions,
    updateNodeParamDraft,
    updateNodeEntityKeyDraft,
    updateNodeOutputDraft,
    updateNodeInputParamDraft,
    runBehaviorTreeTest,
  };
}
