import type { CompositeWorkflowBranchConfig, CompositeWorkflowBranchOperator } from "@/types";

const BRANCH_OPERATORS: readonly CompositeWorkflowBranchOperator[] = ["eq", "ne", "gt", "gte", "lt", "lte"];

/**
 * @description 创建条件分支节点的默认配置。
 * @returns 默认 branch 配置。
 */
export function createDefaultCompositeWorkflowBranchConfig(): CompositeWorkflowBranchConfig {
  return {
    kind: "branch",
    left: { mode: "fromUpstream", upstreamParamName: "", upstreamParamPath: [] },
    operator: "eq",
    right: { mode: "manual", value: "" },
  };
}

/**
 * @description 判断是否为合法分支比较运算符。
 * @param value 待检查值。
 * @returns 是否合法。
 */
function isCompositeWorkflowBranchOperator(value: unknown): value is CompositeWorkflowBranchOperator {
  return typeof value === "string" && (BRANCH_OPERATORS as readonly string[]).includes(value);
}

/**
 * @description 将历史或残缺分支配置归一为当前结构（fromUpstream 路径 + 比较运算符 + 手填右值）。
 * @param raw 原始配置；可为空。
 * @returns 归一后的分支配置。
 */
export function normalizeCompositeWorkflowBranchConfig(raw: unknown): CompositeWorkflowBranchConfig {
  const fallback = createDefaultCompositeWorkflowBranchConfig();
  if (!raw || typeof raw !== "object") {
    return fallback;
  }
  const record = raw as Record<string, unknown>;
  const leftRaw = record.left;
  let left = fallback.left;
  if (leftRaw && typeof leftRaw === "object") {
    const leftRecord = leftRaw as Record<string, unknown>;
    if (leftRecord.mode === "fromUpstream") {
      const upstreamParamName = typeof leftRecord.upstreamParamName === "string" ? leftRecord.upstreamParamName.trim() : "";
      const pathRaw = leftRecord.upstreamParamPath;
      const upstreamParamPath = Array.isArray(pathRaw)
        ? pathRaw.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
        : upstreamParamName
          ? [upstreamParamName]
          : [];
      left = {
        mode: "fromUpstream",
        upstreamParamName: upstreamParamPath[upstreamParamPath.length - 1] ?? upstreamParamName,
        upstreamParamPath,
      };
    }
  }
  const operator = isCompositeWorkflowBranchOperator(record.operator) ? record.operator : "eq";
  const rightRaw = record.right;
  const rightValue =
    rightRaw && typeof rightRaw === "object" && typeof (rightRaw as Record<string, unknown>).value === "string"
      ? ((rightRaw as Record<string, unknown>).value as string)
      : "";
  return {
    kind: "branch",
    left,
    operator,
    right: { mode: "manual", value: rightValue },
  };
}
