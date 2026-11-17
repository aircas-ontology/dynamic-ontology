import { computed, reactive, ref } from "vue";
import {
  getOntologyActionInfoInterface,
  getOntologyEntitiesInterface,
  getOntologyLinkByUniqueIdentifierInterface,
  postGetOntologyEntityRowDetailPageInterface,
} from "@/apis";
import { useBehaviorParameters } from "@/composables/behavior/useBehaviorParameters";
import type {
  BehaviorScheduleDraft,
  BehaviorScheduleFormMode,
  PostOntologyActionTreeTestParams,
  ScheduleBehaviorKind,
  ScheduleBehaviorOption,
  TestOntologyActionParams,
} from "@/types";
import { restoreScheduleBehaviorParameters } from "../utils/restoreScheduleBehaviorParameters";
import { useScheduleTreeParameters } from "./useScheduleTreeParameters";

/**
 * @description 周期调度表单按行为类型加载应用或行为树参数，并在确认时捕获执行请求。
 * @param getSpaceId 当前空间。
 * @param getDraft 可写草稿。
 * @param getBehaviorOptions 空间行为选项。
 * @param getVisible 弹窗是否可见。
 * @param getMode 表单模式。
 * @returns 参数控制器与加载、捕获操作。
 */
export function useSchedulePeriodParameters(
  getSpaceId: () => string,
  getDraft: () => BehaviorScheduleDraft,
  getBehaviorOptions: () => readonly ScheduleBehaviorOption[],
  getVisible: () => boolean,
  getMode: () => BehaviorScheduleFormMode,
) {
  const selectedBehaviorOption = computed(() => {
    const draft = getDraft();
    return getBehaviorOptions().find((item) => (draft.behaviorActionApi ? item.actionApi === draft.behaviorActionApi : item.id === draft.behaviorId));
  });
  /** @description 按选项或已保存 entityJson 推断当前行为类别。 @returns application / behaviorTree；未选行为时为空。 */
  const selectedBehaviorKind = computed((): ScheduleBehaviorKind | "" => {
    const option = selectedBehaviorOption.value;
    if (option) return option.kind;
    const draft = getDraft();
    if (!draft.behaviorActionApi) return "";
    return draft.savedEntityJson?.includes('"treeApi"') ? "behaviorTree" : "application";
  });
  const parameterRestoreError = ref("");
  const parameterContext = reactive({
    /** @description 提供当前空间。 @returns 空间标识。 */
    get spaceId() {
      return getSpaceId();
    },
    /** @description 应用行为上下文；行为树返回空。 @returns 当前应用行为或空值。 */
    get behavior() {
      const draft = getDraft();
      if (!draft.behaviorActionApi || selectedBehaviorKind.value !== "application") return null;
      const option = selectedBehaviorOption.value;
      return {
        id: draft.behaviorId ?? "",
        kind: "application" as const,
        valueType: "attributeValue" as const,
        basicAction: "" as const,
        behaviorApiName: draft.behaviorActionApi,
        ontologyUniqIdentifier: option?.ontologyUniqIdentifier || draft.behaviorOntologyIdentifier || "",
      };
    },
  });
  const parameterConfig = useBehaviorParameters(parameterContext, {
    getOntologyActionInfoInterface,
    getOntologyEntitiesInterface,
    getOntologyLinkByUniqueIdentifierInterface,
    postGetOntologyEntityRowDetailPageInterface,
  });
  const treeParameters = useScheduleTreeParameters(
    () => getSpaceId(),
    () => getDraft().behaviorActionApi ?? "",
  );
  let parameterSession = 0;

  /** @description 取消参数查询并清空两侧控制器。 */
  function clearScheduleParameters(): void {
    parameterSession += 1;
    parameterConfig.cancelParameterRequests();
    parameterConfig.clearDetailParamState();
    parameterConfig.clearRelationTestState();
    treeParameters.clearTreeParameters();
    parameterRestoreError.value = "";
  }

  /**
   * @description 按行为类型加载参数并恢复相同行为的配置，关闭或切换时忽略过期会话。
   * @returns 加载结束。
   */
  async function initializeScheduleParameters(): Promise<void> {
    const session = ++parameterSession;
    parameterConfig.cancelParameterRequests();
    parameterConfig.clearDetailParamState();
    parameterConfig.clearRelationTestState();
    treeParameters.clearTreeParameters();
    parameterRestoreError.value = "";
    const draft = getDraft();
    if (!getVisible() || draft.strategy !== "周期调度" || !draft.behaviorActionApi) return;
    if (selectedBehaviorKind.value === "behaviorTree") {
      await treeParameters.initializeTreeParameters(draft.savedEntityJson || null);
      if (session !== parameterSession || !getVisible()) return;
      if (treeParameters.parameterError.value) parameterRestoreError.value = treeParameters.parameterError.value;
      return;
    }
    const snapshot = draft.behaviorParameters;
    const savedJson = draft.savedEntityJson;
    await parameterConfig.loadApplicationTestForm();
    if (session !== parameterSession || !getVisible()) return;
    if (parameterConfig.detailError.value) parameterRestoreError.value = parameterConfig.detailError.value;
    else if (snapshot) {
      if (!parameterConfig.restoreParameterSnapshot(snapshot)) parameterRestoreError.value = "已保存参数与当前行为不匹配，请重新配置";
    } else if (savedJson) parameterRestoreError.value = restoreScheduleBehaviorParameters(parameterConfig, savedJson, getSpaceId(), draft.behaviorActionApi);
  }

  /**
   * @description 校验并捕获周期调度行为执行请求，同时写回草稿快照字段。
   * @returns 成功时的请求；失败时为错误文案。
   */
  function capturePeriodBehaviorRequest():
    { ok: true; request: TestOntologyActionParams | PostOntologyActionTreeTestParams; ontologyIdentifier: string } | { ok: false; error: string } {
    const draft = getDraft();
    const option = selectedBehaviorOption.value;
    draft.behaviorId = option?.id ?? draft.behaviorId;
    if (selectedBehaviorKind.value === "behaviorTree") {
      const captured = treeParameters.captureTreeParameters();
      if (!captured.ok) return captured;
      draft.behaviorParameters = null;
      draft.savedEntityJson = "";
      return {
        ok: true,
        request: captured.request,
        ontologyIdentifier: option?.ontologyUniqIdentifier || draft.behaviorOntologyIdentifier || "",
      };
    }
    if (getMode() === "create") {
      const unfilledParam = parameterConfig.paramRows.value.find((row) => !(parameterConfig.paramValues[row.paramName] ?? "").trim());
      if (unfilledParam) return { ok: false, error: `请填写行为参数「${unfilledParam.propertyDisplayName || unfilledParam.paramName}」` };
    }
    const result = parameterConfig.createParameterSnapshot();
    if (!result.ok) return result;
    draft.behaviorParameters = result.snapshot;
    draft.savedEntityJson = "";
    return {
      ok: true,
      request: result.snapshot.request,
      ontologyIdentifier: parameterConfig.resolvedOntologyUniqIdentifier.value.trim() || option?.ontologyUniqIdentifier || "",
    };
  }

  return {
    selectedBehaviorOption,
    selectedBehaviorKind,
    parameterConfig,
    treeParameters,
    parameterRestoreError,
    clearScheduleParameters,
    initializeScheduleParameters,
    capturePeriodBehaviorRequest,
  };
}
