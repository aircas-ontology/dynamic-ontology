import type { TestOntologyActionEntityBinding, TestOntologyActionParams } from "@/types";
import { isMainStorageGroup, normalizeStorageGroup } from "./resolveAttributeValueSelection.ts";

/** 应用行为测试单个参数绑定选择快照。 */
export interface ApplicationTestParamBindingSelection {
  /** mappingIns.parameterName。 */
  paramName: string;
  ontologyUniqueIdentifier: string;
  entityPrimaryKey: string | number | boolean | Record<string, unknown>;
  /** mappingIns.storageGroup；main 或空不传 dataPrimaryKeys。 */
  storageGroup: string;
  /** 非 main 时必填的数据行主键。 */
  dataPrimaryKey?: string | number | boolean | Record<string, unknown> | null;
}

/** 应用行为测试关系两端快照（多选）。 */
export interface ApplicationTestLinkEntitySelection {
  ontologyUniqueIdentifierFrom: string;
  ontologyUniqueIdentifierTo: string;
  primaryKeysFrom: Array<string | number | boolean | Record<string, unknown>>;
  primaryKeysTo: Array<string | number | boolean | Record<string, unknown>>;
  /** 挂载侧：from / to；未知时约定 From 为本端、To 为对端。 */
  mountSide: "from" | "to" | "";
}

/** 组装应用行为测试请求的入参。 */
export interface BuildApplicationTestRequestParamsInput {
  ontologySpaceId: string;
  actionApi: string;
  /** EXTERNAL 入参已转换取值。 */
  params: Record<string, unknown>;
  /** INPUT PROPERTY 参数绑定（同名可多条）。 */
  inputParamSelections: ApplicationTestParamBindingSelection[];
  /** OUTPUT WRITE_PROPERTY 参数绑定（每参数一条）。 */
  outputParamSelections: ApplicationTestParamBindingSelection[];
  /** 有 linkMapping 且两端已选时传入；否则 null。 */
  linkEntitySelection: ApplicationTestLinkEntitySelection | null;
}

/** 组装成功。 */
export interface BuildApplicationTestRequestParamsSuccess {
  ok: true;
  request: TestOntologyActionParams;
}

/** 组装失败。 */
export interface BuildApplicationTestRequestParamsFailure {
  ok: false;
  error: string;
}

export type BuildApplicationTestRequestParamsResult = BuildApplicationTestRequestParamsSuccess | BuildApplicationTestRequestParamsFailure;

/**
 * @description 判断主键是否可用于提交。
 * @param value 主键。
 * @returns 可用时为 true。
 */
function hasUsablePrimaryKey(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

/**
 * @description 将单条选择快照转为实体绑定对象。
 * @param selection 选择快照。
 * @param sideLabel 错误文案侧别名。
 * @returns 绑定对象或错误。
 */
function mapSelectionToEntityBinding(
  selection: ApplicationTestParamBindingSelection,
  sideLabel: string,
): { ok: true; binding: TestOntologyActionEntityBinding } | { ok: false; error: string } {
  const paramName = selection.paramName.trim();
  if (!paramName) return { ok: false, error: `${sideLabel}缺少参数名，无法测试` };
  if (!hasUsablePrimaryKey(selection.entityPrimaryKey)) {
    return { ok: false, error: `请先选择${sideLabel}参数「${paramName}」的实例` };
  }
  const storageGroup = normalizeStorageGroup(selection.storageGroup);
  const next: TestOntologyActionEntityBinding = { entityPrimaryKey: selection.entityPrimaryKey };
  if (!isMainStorageGroup(storageGroup) && storageGroup) {
    if (!hasUsablePrimaryKey(selection.dataPrimaryKey)) {
      return { ok: false, error: `请先选择${sideLabel}参数「${paramName}」存储分组「${storageGroup}」的数据行` };
    }
    next.dataPrimaryKeys = {
      [storageGroup]: selection.dataPrimaryKey as string | number | boolean | Record<string, unknown>,
    };
  }
  return { ok: true, binding: next };
}

/**
 * @description 将入参选择列表组装为 paramName → 绑定数组。
 * @param selections 选择快照（同名可多条）。
 * @returns 成功时返回 map；失败时返回 error。
 */
function buildInputParamBindings(
  selections: ApplicationTestParamBindingSelection[],
): { ok: true; bindings: Record<string, TestOntologyActionEntityBinding[]> } | { ok: false; error: string } {
  const bindings: Record<string, TestOntologyActionEntityBinding[]> = {};
  for (const selection of selections) {
    const mapped = mapSelectionToEntityBinding(selection, "入参");
    if (!mapped.ok) return mapped;
    const paramName = selection.paramName.trim();
    const list = bindings[paramName] ?? [];
    list.push(mapped.binding);
    bindings[paramName] = list;
  }
  return { ok: true, bindings };
}

/**
 * @description 将出参选择列表组装为 paramName → 单个绑定。
 * @param selections 选择快照。
 * @returns 成功时返回 map；失败时返回 error。
 */
function buildOutputParamBindings(
  selections: ApplicationTestParamBindingSelection[],
): { ok: true; bindings: Record<string, TestOntologyActionEntityBinding> } | { ok: false; error: string } {
  const bindings: Record<string, TestOntologyActionEntityBinding> = {};
  for (const selection of selections) {
    const mapped = mapSelectionToEntityBinding(selection, "出参");
    if (!mapped.ok) return mapped;
    const paramName = selection.paramName.trim();
    bindings[paramName] = mapped.binding;
  }
  return { ok: true, bindings };
}

/**
 * @description 按文档规则组装应用行为测试请求体。
 * inputParams 为绑定数组；outputParams 为单绑定；关系写入 entityPrimaryKeys.from/to 数组。
 * @param input 表单快照。
 * @returns 请求体或错误信息。
 */
export function buildApplicationTestRequestParams(input: BuildApplicationTestRequestParamsInput): BuildApplicationTestRequestParamsResult {
  const ontologySpaceId = input.ontologySpaceId.trim();
  const actionApi = input.actionApi.trim();
  if (!ontologySpaceId) return { ok: false, error: "缺少对象空间 id，无法测试" };
  if (!actionApi) return { ok: false, error: "缺少行为 api，无法测试" };

  const inputBuilt = buildInputParamBindings(input.inputParamSelections);
  if (!inputBuilt.ok) return inputBuilt;
  const outputBuilt = buildOutputParamBindings(input.outputParamSelections);
  if (!outputBuilt.ok) return outputBuilt;

  const request: TestOntologyActionParams = {
    ontologySpaceId,
    actionApi,
  };

  if (Object.keys(input.params).length) {
    request.params = { ...input.params };
  }

  if (Object.keys(inputBuilt.bindings).length) {
    request.inputParams = inputBuilt.bindings;
  }
  if (Object.keys(outputBuilt.bindings).length) {
    request.outputParams = outputBuilt.bindings;
  }

  const link = input.linkEntitySelection;
  if (link) {
    const fromKeys = link.primaryKeysFrom.filter((item) => hasUsablePrimaryKey(item));
    const toKeys = link.primaryKeysTo.filter((item) => hasUsablePrimaryKey(item));
    if (fromKeys.length === 0) return { ok: false, error: "请先选择 From 侧实体实例" };
    if (toKeys.length === 0) return { ok: false, error: "请先选择 To 侧实体实例" };
    request.entityPrimaryKeys = {
      from: fromKeys,
      to: toKeys,
    };
  }

  return { ok: true, request };
}
