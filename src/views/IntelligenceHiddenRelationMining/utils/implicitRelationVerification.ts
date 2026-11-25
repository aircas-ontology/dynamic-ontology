import type { ImplicitRelationVerificationRow } from "@/types";

export interface ImplicitRelationVerificationSummary {
  total: number;
  pending: number;
}

/**
 * @description 统计隐含关系校验弹窗的关系总数与待校验数量。
 * @param rows 隐含关系校验记录。
 * @returns 关系总数与待校验数量。
 */
export function summarizeVerificationRows(rows: ImplicitRelationVerificationRow[]): ImplicitRelationVerificationSummary {
  return {
    total: rows.length,
    pending: rows.filter((row) => row.status === "待校验").length,
  };
}
