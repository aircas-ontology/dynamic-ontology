import type { useBehaviorParameters } from "@/composables/behavior/useBehaviorParameters";
import type {
  ApplicationInputBindingRecord,
  BehaviorParameterSnapshot,
  BehaviorTestEntityRow,
  TestOntologyActionEntityBinding,
  TestOntologyActionParams,
} from "@/types";

type PrimaryKey = TestOntologyActionEntityBinding["entityPrimaryKey"];

/** @description 校验 JSON 对象。 @param value 输入值。 @returns 是否为记录对象。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @description 校验保存的实例或数据行主键，保留原始类型。 @param value 输入值。 @returns 是否为可用主键。 */
function isPrimaryKey(value: unknown): value is PrimaryKey {
  return (typeof value === "string" && value !== "") || (typeof value === "number" && Number.isFinite(value)) || typeof value === "boolean" || isRecord(value);
}

/** @description 校验参数绑定。 @param value 输入值。 @returns 是否为实例及数据行绑定。 */
function isBinding(value: unknown): value is TestOntologyActionEntityBinding {
  return (
    isRecord(value) &&
    isPrimaryKey(value.entityPrimaryKey) &&
    (value.dataPrimaryKeys === undefined || (isRecord(value.dataPrimaryKeys) && Object.values(value.dataPrimaryKeys).every(isPrimaryKey)))
  );
}

/** @description 校验从接口解析的执行参数。 @param value 输入对象。 @returns 是否为完整且类型安全的执行参数。 */
function isExecutionRequest(value: unknown): value is TestOntologyActionParams {
  if (!isRecord(value) || typeof value.ontologySpaceId !== "string" || typeof value.actionApi !== "string") return false;
  if (value.params !== undefined && !isRecord(value.params)) return false;
  if (
    value.inputParams !== undefined &&
    (!isRecord(value.inputParams) || !Object.values(value.inputParams).every((items) => Array.isArray(items) && items.every(isBinding)))
  )
    return false;
  if (value.outputParams !== undefined && (!isRecord(value.outputParams) || !Object.values(value.outputParams).every(isBinding))) return false;
  if (
    value.entityPrimaryKeys !== undefined &&
    (!isRecord(value.entityPrimaryKeys) ||
      !Array.isArray(value.entityPrimaryKeys.from) ||
      !value.entityPrimaryKeys.from.every(isPrimaryKey) ||
      !Array.isArray(value.entityPrimaryKeys.to) ||
      !value.entityPrimaryKeys.to.every(isPrimaryKey))
  )
    return false;
  return [value.entityPrimaryKey, value.dataPrimaryKey, value.linkEntityPrimaryKey].every((key) => key === undefined || isPrimaryKey(key));
}

/** @description 从执行参数恢复实际参数组件，而非仅显示原始 JSON；失败不修改已加载配置。 @param controller 已完成参数定义加载的组件状态。 @param entityJson 保存的执行参数。 @param spaceId 当前空间。 @param actionApi 当前行为。 @returns 错误提示；成功为空。 */
export function restoreScheduleBehaviorParameters(
  controller: ReturnType<typeof useBehaviorParameters>,
  entityJson: string,
  spaceId: string,
  actionApi: string,
): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(entityJson);
  } catch {
    return "已保存的行为参数 JSON 格式无效";
  }
  if (!isRecord(parsed)) return "已保存的行为参数必须为对象";
  const request = { ...parsed, ontologySpaceId: String(parsed.ontologySpaceId ?? spaceId), actionApi: parsed.actionApi ?? actionApi };
  if (!isExecutionRequest(request)) return "已保存的行为参数结构无效";
  if (request.actionApi !== actionApi || request.ontologySpaceId !== spaceId) return "已保存参数与当前行为或空间不匹配";
  if (controller.detailLoading.value || controller.detailError.value || controller.resolvedActionApi.value !== actionApi)
    return controller.detailError.value || "请等待行为参数定义加载完成";

  /** @description 从当前页解析实体名称，未加载的实例以保存主键回显并跨页保留。 @param key 保存主键。 @param rows 当前页记录。 @returns 可恢复的选中行。 */
  function resolveSavedEntity(key: PrimaryKey, rows: BehaviorTestEntityRow[]): BehaviorTestEntityRow {
    const label = controller.formatPrimaryKeyLabel(key);
    const matched = rows.find((row) => controller.formatPrimaryKeyLabel(row.primaryKey) === label);
    if (matched) return { ...matched, savedPrimaryKey: key };
    return {
      rowKey: label,
      displayName: `已保存实例（${label}）`,
      primaryKey: typeof key === "number" || typeof key === "string" ? key : label,
      savedPrimaryKey: key,
      primaryKeyLabel: label,
      ontologyName: "",
      propertySummary: "",
      raw: {},
    };
  }

  const snapshot: BehaviorParameterSnapshot = {
    actionApi,
    spaceId,
    request,
    values: {},
    inputBindings: {},
    ontologyPickers: [],
    storagePickers: [],
    fromEntities: [],
    toEntities: [],
  };
  for (const row of controller.paramRows.value) {
    const value = request.params?.[row.paramName];
    snapshot.values[row.paramName] = value === undefined || value === null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  }
  const configuredInputs = new Set(
    controller.applicationOntologyPickers.value.filter((picker) => picker.selectionMode === "multiple").map((picker) => picker.paramName),
  );
  const configuredOutputs = new Set(
    controller.applicationOntologyPickers.value.filter((picker) => picker.selectionMode === "single").map((picker) => picker.paramName),
  );
  if (
    Object.keys(request.inputParams ?? {}).some((name) => !configuredInputs.has(name)) ||
    Object.keys(request.outputParams ?? {}).some((name) => !configuredOutputs.has(name))
  )
    return "保存的实例绑定与当前行为参数定义不匹配";

  for (const picker of controller.applicationOntologyPickers.value) {
    const outputBinding = request.outputParams?.[picker.paramName];
    const bindings = picker.selectionMode === "multiple" ? (request.inputParams?.[picker.paramName] ?? []) : outputBinding ? [outputBinding] : [];
    const selected = bindings.map((binding) => resolveSavedEntity(binding.entityPrimaryKey, [...picker.rows, ...picker.selectedEntities]));
    snapshot.ontologyPickers.push({ ...picker, selectedEntities: selected, selectedRowKeys: selected.map((row) => row.rowKey) });
    if (picker.selectionMode === "multiple") {
      const inputRow = controller.applicationInputRows.value.find((row) => row.paramName === picker.paramName);
      const records: ApplicationInputBindingRecord[] = bindings.map((binding, index) => {
        const dataPrimaryKey = binding.dataPrimaryKeys?.[inputRow?.storageGroup ?? ""];
        return {
          recordKey: controller.buildApplicationInputBindingRecordKey(binding.entityPrimaryKey, dataPrimaryKey),
          entityPrimaryKey: binding.entityPrimaryKey,
          entityDisplayName: selected[index]?.displayName || controller.formatPrimaryKeyLabel(binding.entityPrimaryKey),
          dataPrimaryKey,
          dataPrimaryKeyLabel: dataPrimaryKey === undefined ? "" : controller.formatPrimaryKeyLabel(dataPrimaryKey),
        };
      });
      snapshot.inputBindings[picker.paramName] = records;
    }
  }
  for (const picker of controller.applicationStorageGroupPickers.value) {
    const selected = snapshot.ontologyPickers.find((item) => item.paramName === picker.paramName)?.selectedEntities ?? [];
    const bindings = request.inputParams?.[picker.paramName] ?? [];
    snapshot.storagePickers.push({
      ...picker,
      entitySlots: bindings.map((binding, index) => {
        const dataKey = binding.dataPrimaryKeys?.[picker.storageGroup];
        const label = dataKey === undefined ? "" : controller.formatPrimaryKeyLabel(dataKey);
        return {
          entityRowKey: selected[index]?.rowKey || controller.formatPrimaryKeyLabel(binding.entityPrimaryKey),
          entityPrimaryKey: binding.entityPrimaryKey,
          entityDisplayName: selected[index]?.displayName || "",
          loading: false,
          error: "",
          rows: [],
          total: 0,
          page: 1,
          pageSize: 10,
          selectedRowKey: label,
          selectedDataRow:
            dataKey === undefined
              ? null
              : { rowKey: label, storageGroup: picker.storageGroup, dataPrimaryKey: dataKey, dataPrimaryKeyLabel: label, propertySummary: "" },
        };
      }),
    });
  }
  snapshot.fromEntities = (request.entityPrimaryKeys?.from ?? []).map((key) => resolveSavedEntity(key, controller.fromEntityRows.value));
  snapshot.toEntities = (request.entityPrimaryKeys?.to ?? []).map((key) => resolveSavedEntity(key, controller.toEntityRows.value));
  return controller.restoreParameterSnapshot(snapshot) ? "" : "已保存参数恢复失败，请重试";
}
