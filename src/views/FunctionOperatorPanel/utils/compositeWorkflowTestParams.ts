import type { OntologyFunctionScriptTestInputRow } from "@/utils/mapOntologyFunctionTest";

/** 开始节点入参摘要（画布 outputParameters）。 */
export interface CompositeWorkflowStartParamBrief {
  name: string;
  type: string;
}

/**
 * @description 按开始节点入参生成测试表单行；同名参数保留已有 paramValue。
 * @param previousRows 当前已填测试行。
 * @param startParams 开始节点 outputParameters。
 * @returns 与开始节点结构对齐的测试入参行。
 */
export function syncCompositeWorkflowTestInputRows(
  previousRows: OntologyFunctionScriptTestInputRow[],
  startParams: CompositeWorkflowStartParamBrief[],
): OntologyFunctionScriptTestInputRow[] {
  const previousByName = new Map<string, OntologyFunctionScriptTestInputRow>();
  for (const row of previousRows) {
    const key = row.paramName.trim();
    if (key && !previousByName.has(key)) {
      previousByName.set(key, row);
    }
  }
  const next: OntologyFunctionScriptTestInputRow[] = [];
  for (const param of startParams) {
    const paramName = typeof param.name === "string" ? param.name.trim() : "";
    if (!paramName) {
      continue;
    }
    const paramType = typeof param.type === "string" ? param.type.trim() : "";
    const previous = previousByName.get(paramName);
    next.push({
      paramName,
      paramType,
      paramValue: previous?.paramValue ?? "",
    });
  }
  return next;
}
