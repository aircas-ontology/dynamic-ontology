import { computed, onScopeDispose, reactive, ref } from "vue";
import { getOntologyCategoryTreeInterface } from "@/apis";
import { useBehaviorTreeExecution } from "@/composables/behaviorTree/useBehaviorTreeExecution";
import type { BehaviorTreeModel, BehaviorTreeObjectPropertyOption, PostOntologyActionTreeTestParams, SpaceRelationObjectOption } from "@/types";
import { buildBehaviorTreeTestPayload, collectBehaviorTreeExecMissingFields } from "@/utils/behaviorTreeExecutePlan";
import { mapOntologyObjectsToRelationOptions } from "@/utils/mapOntologyObjectsToRelationOptions";
import { hydrateScheduleTreeParameters } from "../utils/hydrateScheduleTreeParameters";

/**
 * @description 为调度配置场景加载行为树参数面板：读执行要求、填参、捕获试跑请求，不执行。
 * @param getSpaceId 当前空间。
 * @param getTreeApi 当前行为树 api。
 * @returns 面板状态与加载、捕获操作。
 */
export function useScheduleTreeParameters(getSpaceId: () => string, getTreeApi: () => string) {
  const model = reactive<BehaviorTreeModel>({ blackboard: [], roots: [] });
  const objectOptions = ref<SpaceRelationObjectOption[]>([]);
  const objectProperties = ref<Record<string, BehaviorTreeObjectPropertyOption>>({});
  const catalogError = ref("");
  const parameterBusy = ref(false);
  const parameterError = ref("");
  let session = 0;

  const spaceIdRef = computed(() => getSpaceId().trim());
  const treeApiRef = computed(() => getTreeApi().trim());

  const execution = useBehaviorTreeExecution({
    spaceId: () => spaceIdRef.value,
    treeApi: () => treeApiRef.value,
    model,
    objectOptions,
    objectProperties,
  });

  /**
   * @description 清空目录与执行草稿，并使旧会话失效。
   */
  function clearTreeParameters(): void {
    session += 1;
    catalogError.value = "";
    parameterBusy.value = false;
    parameterError.value = "";
    objectOptions.value = [];
    objectProperties.value = {};
    model.blackboard.splice(0, model.blackboard.length);
    model.roots.splice(0, model.roots.length);
    execution.clearBehaviorTreeExecLogs();
    for (const draft of [execution.externalInputDraft, execution.blackboardObjectKeys, execution.nodeDrafts, execution.instanceOptions]) {
      for (const key of Object.keys(draft)) delete draft[key];
    }
    execution.cancelBehaviorTreeExecutionRequests();
  }

  /**
   * @description 加载对象目录与执行要求，并按需回填已保存请求。
   * @param savedRequest 已保存试跑请求或 JSON。
   * @returns 加载结束。
   */
  async function initializeTreeParameters(savedRequest: unknown = null): Promise<void> {
    clearTreeParameters();
    const token = session;
    const spaceId = spaceIdRef.value;
    const treeApi = treeApiRef.value;
    if (!spaceId || !treeApi) {
      parameterError.value = "缺少空间标识或行为 api";
      return;
    }
    parameterBusy.value = true;
    try {
      const response = await getOntologyCategoryTreeInterface({ spaceId });
      if (token !== session) return;
      if (response.code !== 200 || !response.data) throw new Error(response.message || "对象目录加载失败");
      objectOptions.value = mapOntologyObjectsToRelationOptions(response.data);
      await execution.loadBehaviorTreeExecutePlan(true);
      if (token !== session) return;
      if (execution.planStatus.value === "error") {
        parameterError.value = execution.planError.value || "行为树参数加载失败";
        return;
      }
      if (savedRequest != null && savedRequest !== "") {
        const error = hydrateScheduleTreeParameters(savedRequest, treeApi, spaceId, {
          externalInputDraft: execution.externalInputDraft,
          blackboardObjectKeys: execution.blackboardObjectKeys,
          nodeDrafts: execution.nodeDrafts,
        });
        if (error) {
          parameterError.value = error;
          return;
        }
      }
      parameterError.value = "";
    } catch (cause) {
      if (token === session) parameterError.value = cause instanceof Error ? cause.message : "行为树参数加载失败";
    } finally {
      if (token === session) parameterBusy.value = false;
    }
  }

  /**
   * @description 校验并捕获当前行为树试跑请求。
   * @returns 成功时的请求；失败时为错误文案。
   */
  function captureTreeParameters(): { ok: true; request: PostOntologyActionTreeTestParams } | { ok: false; error: string } {
    if (parameterBusy.value || execution.planStatus.value === "loading") return { ok: false, error: "请等待行为树参数加载完成" };
    if (execution.planStatus.value === "error") return { ok: false, error: execution.planError.value || "行为树参数加载失败" };
    if (execution.planStatus.value !== "ready" || !execution.execPlan.value) return { ok: false, error: "请先加载行为树执行要求" };
    const objectLabelById: Record<string, string> = {};
    for (const item of objectOptions.value) objectLabelById[item.value] = item.label || item.value;
    const missing = collectBehaviorTreeExecMissingFields({
      plan: execution.execPlan.value,
      objectLabelById,
      blackboardObjectKeys: execution.blackboardObjectKeys,
      nodeDrafts: execution.nodeDrafts,
    });
    if (missing.length) return { ok: false, error: `请完善行为树参数：${missing.join("、")}` };
    const built = buildBehaviorTreeTestPayload({
      spaceId: spaceIdRef.value,
      treeApi: treeApiRef.value,
      plan: execution.execPlan.value,
      blackboard: model.blackboard,
      objectProperties: objectProperties.value,
      externalInputDraft: execution.externalInputDraft,
      blackboardObjectKeys: execution.blackboardObjectKeys,
      nodeDrafts: execution.nodeDrafts,
    });
    if ("error" in built) return { ok: false, error: built.error };
    return { ok: true, request: built.payload };
  }

  onScopeDispose(clearTreeParameters);

  return {
    ...execution,
    catalogError,
    parameterBusy,
    parameterError,
    clearTreeParameters,
    initializeTreeParameters,
    captureTreeParameters,
  };
}
