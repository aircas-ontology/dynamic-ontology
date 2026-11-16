import { onScopeDispose, reactive, ref } from "vue";
import { useBehaviorParameters } from "@/composables/behavior/useBehaviorParameters";
import {
  getOntologyActionInfoInterface,
  getOntologyEntitiesInterface,
  getOntologyLinkByUniqueIdentifierInterface,
  postGetOntologyEntityRowDetailPageInterface,
} from "@/apis";
import type { RuleFlowThenAction, ScheduleBehaviorOption } from "@/types";

/** @description 为规则行为节点复用周期调度参数控制器，维护独立加载会话与快照。 @param getSpaceId 当前空间。 @param getOption 当前行为选项。 @param getAction 当前编辑副本。 @param getVisible 弹窗可见状态。 @returns 参数控制器及节点校验操作。 */
export function useRuleActionParameters(
  getSpaceId: () => string,
  getOption: () => ScheduleBehaviorOption | undefined,
  getAction: () => RuleFlowThenAction | undefined,
  getVisible: () => boolean,
) {
  const context = reactive({
    /** @description 获取当前空间上下文。 @returns 空间标识。 */
    get spaceId() {
      return getSpaceId();
    },
    /** @description 构造与周期调度一致的应用行为上下文。 @returns 当前行为或空值。 */
    get behavior() {
      const option = getOption();
      if (!option) return null;
      return {
        id: option.id,
        kind: "application" as const,
        valueType: "attributeValue" as const,
        basicAction: "" as const,
        behaviorApiName: option.actionApi,
        ontologyUniqIdentifier: option.ontologyUniqIdentifier,
      };
    },
  });
  const parameterConfig = useBehaviorParameters(context, {
    getOntologyActionInfoInterface,
    getOntologyEntitiesInterface,
    getOntologyLinkByUniqueIdentifierInterface,
    postGetOntologyEntityRowDetailPageInterface,
  });
  const parameterBusy = ref(false);
  const parameterError = ref("");
  let session = 0;
  let readyAction: RuleFlowThenAction | undefined;
  let readyBehaviorId = "";
  let readySpaceId = "";

  /** @description 关闭或切换节点时取消查询并使旧会话失效。 */
  function clearActionParameters(): void {
    session++;
    readyAction = undefined;
    readyBehaviorId = "";
    parameterBusy.value = false;
    parameterError.value = "";
    parameterConfig.cancelParameterRequests();
    parameterConfig.clearDetailParamState();
    parameterConfig.clearRelationTestState();
  }
  /** @description 加载当前行为详情并仅恢复同一会话的参数快照。 @returns 加载结束。 */
  async function initializeActionParameters(): Promise<void> {
    clearActionParameters();
    const action = getAction();
    const option = getOption();
    if (!action || !getVisible()) return;
    if (!option) {
      parameterError.value = "请选择当前空间可用的行为";
      return;
    }
    const token = session;
    const spaceId = getSpaceId();
    const snapshot = action.behaviorParameters;
    parameterBusy.value = true;
    try {
      await parameterConfig.loadApplicationTestForm();
      if (token !== session || !getVisible() || action !== getAction() || option.id !== getOption()?.id || spaceId !== getSpaceId()) return;
      if (parameterConfig.detailError.value) {
        parameterError.value = parameterConfig.detailError.value;
        return;
      }
      if (snapshot && !parameterConfig.restoreParameterSnapshot(snapshot)) {
        parameterError.value = "已保存参数与当前行为不匹配，请重新选择行为";
        return;
      }
      if (!snapshot) {
        for (const param of action.params) {
          if (param.value.kind === "input" && parameterConfig.paramRows.value.some((row) => row.paramName === param.paramName))
            parameterConfig.paramValues[param.paramName] = param.value.text;
        }
      }
      readyAction = action;
      readyBehaviorId = option.id;
      readySpaceId = spaceId;
    } catch (cause) {
      if (token === session) parameterError.value = cause instanceof Error ? cause.message : "行为参数加载失败";
    } finally {
      if (token === session) parameterBusy.value = false;
    }
  }
  /** @description 校验当前参数并仅向编辑副本写入配置，不发送执行请求。 @returns 是否允许确认节点。 */
  function captureActionParameters(): boolean {
    const action = getAction();
    if (!action || parameterBusy.value || parameterConfig.detailLoading.value) return false;
    if (action !== readyAction || readyBehaviorId !== getOption()?.id || readySpaceId !== getSpaceId()) return false;
    if (parameterConfig.detailError.value) {
      parameterError.value = parameterConfig.detailError.value;
      return false;
    }
    const empty = parameterConfig.paramRows.value.find((row) => !(parameterConfig.paramValues[row.paramName] ?? "").trim());
    if (empty) {
      parameterError.value = `请填写行为参数「${empty.propertyDisplayName || empty.paramName}」`;
      return false;
    }
    const result = parameterConfig.createParameterSnapshot();
    if (!result.ok) {
      parameterError.value = result.error;
      return false;
    }
    action.behaviorParameters = result.snapshot;
    action.params = parameterConfig.paramRows.value.map((row) => ({
      paramId: row.paramName,
      paramName: row.paramName,
      valueType: "string",
      value: { kind: "input", text: result.snapshot.values[row.paramName] ?? "" },
    }));
    parameterError.value = "";
    return true;
  }
  onScopeDispose(clearActionParameters);
  return { parameterConfig, parameterBusy, parameterError, clearActionParameters, initializeActionParameters, captureActionParameters };
}
