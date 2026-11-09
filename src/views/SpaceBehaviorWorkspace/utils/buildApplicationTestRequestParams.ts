import type { TestOntologyActionEntityBinding, TestOntologyActionParams } from "@/types";
import { isMainStorageGroup, normalizeStorageGroup } from "./resolveAttributeValueSelection.ts";

/** 应用行为测试单个对象绑定选择快照。 */
export interface ApplicationTestEntityBindingSelection {
  ontologyUniqueIdentifier: string;
  entityPrimaryKey: string | number | boolean | Record<string, unknown>;
  /** mappingIns.storageGroup；main 或空不传 dataPrimaryKeys。 */
  storageGroup: string;
  /** 非 main 时必填的数据行主键。 */
  dataPrimaryKey?: string | number | boolean | Record<string, unknown> | null;
}

/** 应用行为测试关系两端快照。 */
export interface ApplicationTestLinkEntitySelection {
  ontologyUniqueIdentifierFrom: string;
  ontologyUniqueIdentifierTo: string;
  primaryKeyFrom: string | number | boolean | Record<string, unknown>;
  primaryKeyTo: string | number | boolean | Record<string, unknown>;
  /** 挂载侧：from / to；未知时约定 From 为本端、To 为对端。 */
  mountSide: "from" | "to" | "";
}

/** 组装应用行为测试请求的入参。 */
export interface BuildApplicationTestRequestParamsInput {
  ontologySpaceId: string;
  actionApi: string;
  /** EXTERNAL 入参已转换取值。 */
  params: Record<string, unknown>;
  /** INPUT PROPERTY 对象绑定。 */
  inputEntitySelections: ApplicationTestEntityBindingSelection[];
  /** OUTPUT WRITE_PROPERTY 对象绑定。 */
  outputEntitySelections: ApplicationTestEntityBindingSelection[];
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
 * @description 将绑定选择列表聚合为 ontology → entityBinding。
 * @param selections 选择快照。
 * @param sideLabel 错误文案侧别名。
 * @returns 成功时返回 map；失败时返回 error。
 */
function aggregateEntityBindings(
  selections: ApplicationTestEntityBindingSelection[],
  sideLabel: string,
): { ok: true; bindings: Record<string, TestOntologyActionEntityBinding> } | { ok: false; error: string } {
  const bindings: Record<string, TestOntologyActionEntityBinding> = {};
  for (const selection of selections) {
    const ontologyId = selection.ontologyUniqueIdentifier.trim();
    if (!ontologyId) return { ok: false, error: `${sideLabel}缺少对象标识，无法测试` };
    if (!hasUsablePrimaryKey(selection.entityPrimaryKey)) {
      return { ok: false, error: `请先选择${sideLabel}对象「${ontologyId}」的实例` };
    }
    const storageGroup = normalizeStorageGroup(selection.storageGroup);
    const existing = bindings[ontologyId];
    if (existing && existing.entityPrimaryKey !== selection.entityPrimaryKey) {
      return { ok: false, error: `${sideLabel}对象「${ontologyId}」选中了多个不同实例，无法测试` };
    }
    const next: TestOntologyActionEntityBinding = existing
      ? { ...existing, dataPrimaryKeys: existing.dataPrimaryKeys ? { ...existing.dataPrimaryKeys } : undefined }
      : { entityPrimaryKey: selection.entityPrimaryKey };
    if (!isMainStorageGroup(storageGroup) && storageGroup) {
      if (!hasUsablePrimaryKey(selection.dataPrimaryKey)) {
        return { ok: false, error: `请先选择${sideLabel}对象「${ontologyId}」存储分组「${storageGroup}」的数据行` };
      }
      next.dataPrimaryKeys = {
        ...(next.dataPrimaryKeys ?? {}),
        [storageGroup]: selection.dataPrimaryKey as string | number | boolean | Record<string, unknown>,
      };
    }
    bindings[ontologyId] = next;
  }
  return { ok: true, bindings };
}

/**
 * @description 按文档规则组装应用行为测试请求体。
 * inputEntities / outputEntities 承载对象实例；关系仅写入 entityPrimaryKeys.from/to。
 * @param input 表单快照。
 * @returns 请求体或错误信息。
 */
export function buildApplicationTestRequestParams(input: BuildApplicationTestRequestParamsInput): BuildApplicationTestRequestParamsResult {
  const ontologySpaceId = input.ontologySpaceId.trim();
  const actionApi = input.actionApi.trim();
  if (!ontologySpaceId) return { ok: false, error: "缺少对象空间 id，无法测试" };
  if (!actionApi) return { ok: false, error: "缺少行为 api，无法测试" };

  const inputAggregated = aggregateEntityBindings(input.inputEntitySelections, "入参");
  if (!inputAggregated.ok) return inputAggregated;
  const outputAggregated = aggregateEntityBindings(input.outputEntitySelections, "出参");
  if (!outputAggregated.ok) return outputAggregated;

  const request: TestOntologyActionParams = {
    ontologySpaceId,
    actionApi,
  };

  if (Object.keys(input.params).length) {
    request.params = { ...input.params };
  }

  if (Object.keys(inputAggregated.bindings).length) {
    request.inputEntities = inputAggregated.bindings;
  }
  if (Object.keys(outputAggregated.bindings).length) {
    request.outputEntities = outputAggregated.bindings;
  }

  const link = input.linkEntitySelection;
  if (link) {
    if (!hasUsablePrimaryKey(link.primaryKeyFrom)) return { ok: false, error: "请先选择 From 侧实体实例" };
    if (!hasUsablePrimaryKey(link.primaryKeyTo)) return { ok: false, error: "请先选择 To 侧实体实例" };
    request.entityPrimaryKeys = {
      from: link.primaryKeyFrom,
      to: link.primaryKeyTo,
    };
  }

  return { ok: true, request };
}
