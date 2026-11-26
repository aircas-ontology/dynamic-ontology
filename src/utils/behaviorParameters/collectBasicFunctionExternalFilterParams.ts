import type { BasicFilterOp, CreateOntologyActionBasicFunctionFilterNode, CreateOntologyActionBasicFunctionFilters } from "@/types";
import { opNeedsList, opNeedsRange, opNeedsValue } from "../functionOperatorBasicFilter.ts";

/** 基础函数 EXTERNAL 条件在测试弹框中的取值形态。 */
export type BasicFunctionExternalFilterValueKind = "single" | "range" | "list" | "none";

/** 基础函数测试需填写的一条 EXTERNAL 过滤条件。 */
export interface BasicFunctionExternalFilterParam {
  /** 属性 apiName；同时作为测试请求 params 的键。 */
  propertyApiName: string;
  /** 过滤算子。 */
  op: string;
  /** 取值形态。 */
  valueKind: BasicFunctionExternalFilterValueKind;
}

/** 测试弹框中 EXTERNAL 条件草稿。 */
export interface BasicFunctionExternalFilterDraft {
  single?: string;
  left?: string;
  right?: string;
  list?: string;
}

/**
 * @description 将未知算子收成可判定的 BasicFilterOp；未知时按 EQ（单值）。
 * @param op 原始算子。
 * @returns 可判定算子。
 */
function resolveBasicFilterOp(op: unknown): BasicFilterOp {
  if (typeof op !== "string") return "EQ";
  const trimmed = op.trim().toUpperCase();
  if (
    trimmed === "EQ" ||
    trimmed === "NE" ||
    trimmed === "LIKE" ||
    trimmed === "LIKE_LEFT" ||
    trimmed === "LIKE_RIGHT" ||
    trimmed === "IN" ||
    trimmed === "NOT_IN" ||
    trimmed === "BETWEEN" ||
    trimmed === "NOT_BETWEEN" ||
    trimmed === "GT" ||
    trimmed === "GE" ||
    trimmed === "LT" ||
    trimmed === "LE" ||
    trimmed === "IS_NULL" ||
    trimmed === "IS_NOT_NULL"
  ) {
    return trimmed;
  }
  return "EQ";
}

/**
 * @description 按算子解析 EXTERNAL 条件的取值形态。
 * @param op 算子。
 * @returns 取值形态。
 */
export function resolveBasicFunctionExternalFilterValueKind(op: unknown): BasicFunctionExternalFilterValueKind {
  const resolved = resolveBasicFilterOp(op);
  if (opNeedsRange(resolved)) return "range";
  if (opNeedsList(resolved)) return "list";
  if (opNeedsValue(resolved)) return "single";
  return "none";
}

/**
 * @description 递归收集基础函数 filters 中 EXTERNAL 条件（按 propertyApiName 去重，保留首次）。
 * @param filters 行为详情 basicFunction.filters。
 * @returns 测试弹框所需 EXTERNAL 条件列表。
 */
export function collectBasicFunctionExternalFilterParams(
  filters: CreateOntologyActionBasicFunctionFilters | null | undefined,
): BasicFunctionExternalFilterParam[] {
  if (!filters || !Array.isArray(filters.children)) return [];
  const collected: BasicFunctionExternalFilterParam[] = [];
  const seen = new Set<string>();

  /**
   * @description 深度优先遍历过滤节点。
   * @param nodes 子节点列表。
   */
  function walkNodes(nodes: CreateOntologyActionBasicFunctionFilterNode[]): void {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      if (node.type === "GROUP" && node.group?.children) {
        walkNodes(node.group.children);
        continue;
      }
      if (node.type !== "FILTER" || !node.filter) continue;
      const source = typeof node.filter.source === "string" ? node.filter.source.trim().toUpperCase() : "";
      if (source !== "EXTERNAL") continue;
      const propertyApiName = typeof node.filter.propertyApiName === "string" ? node.filter.propertyApiName.trim() : "";
      if (!propertyApiName || seen.has(propertyApiName)) continue;
      seen.add(propertyApiName);
      const op = typeof node.filter.op === "string" && node.filter.op.trim() ? node.filter.op.trim() : "EQ";
      collected.push({
        propertyApiName,
        op,
        valueKind: resolveBasicFunctionExternalFilterValueKind(op),
      });
    }
  }

  walkNodes(filters.children);
  return collected;
}

/**
 * @description 将逗号分隔文本拆成列表值。
 * @param text 原始文本。
 * @returns 去空白后的非空片段。
 */
function splitListValues(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * @description 按 EXTERNAL 条件列表与草稿组装测试请求 params；缺值时返回 error。
 * @param params 条件列表。
 * @param drafts propertyApiName → 草稿。
 * @returns params 对象或错误文案。
 */
export function buildBasicFunctionExternalFilterTestParams(
  params: BasicFunctionExternalFilterParam[],
  drafts: Record<string, BasicFunctionExternalFilterDraft | undefined>,
): { params: Record<string, unknown> } | { error: string } {
  const next: Record<string, unknown> = {};
  for (const item of params) {
    if (item.valueKind === "none") continue;
    const draft = drafts[item.propertyApiName] ?? {};
    if (item.valueKind === "single") {
      const value = (draft.single ?? "").trim();
      if (!value) return { error: `请填写外部输入条件「${item.propertyApiName}」` };
      next[item.propertyApiName] = value;
      continue;
    }
    if (item.valueKind === "range") {
      const left = (draft.left ?? "").trim();
      const right = (draft.right ?? "").trim();
      if (!left || !right) return { error: `请填写外部输入条件「${item.propertyApiName}」的区间上下界` };
      next[item.propertyApiName] = [left, right];
      continue;
    }
    const listText = (draft.list ?? "").trim();
    const values = splitListValues(listText);
    if (!values.length) return { error: `请填写外部输入条件「${item.propertyApiName}」` };
    next[item.propertyApiName] = values;
  }
  return { params: next };
}
