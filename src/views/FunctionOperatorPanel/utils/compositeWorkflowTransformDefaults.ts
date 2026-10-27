import type { CompositeWorkflowParamBrief, CompositeWorkflowTransformConfig, ParseOntologyFunctionParamItem } from "@/types";

/** 数据格式转换节点默认 TypeScript 脚本模版。 */
export const COMPOSITE_WORKFLOW_TRANSFORM_DEFAULT_CODE = `interface Input {
  id: number;
}

interface Output { 
  name: string;
}

export function handle(input: Input): Output {
    return {
        name:input.id+'name',
    }
}
`;

/**
 * @description 创建数据格式转换节点的默认配置。
 * @returns 默认 transform 配置。
 */
export function createDefaultCompositeWorkflowTransformConfig(): CompositeWorkflowTransformConfig {
  return {
    kind: "transform",
    mappingMode: "script",
    language: "typescript",
    code: COMPOSITE_WORKFLOW_TRANSFORM_DEFAULT_CODE,
    paramsSnapshot: { inputs: [], outputs: [] },
    inputBindings: [],
  };
}

/**
 * @description 将解析接口参数项递归转为编排参数摘要。
 * @param item 解析参数项。
 * @returns 参数摘要；无名参数返回 null。
 */
function mapParsedParamItemToCompositeBrief(item: ParseOntologyFunctionParamItem): CompositeWorkflowParamBrief | null {
  const paramName = typeof item.paramName === "string" ? item.paramName.trim() : "";
  if (!paramName) {
    return null;
  }
  const brief: CompositeWorkflowParamBrief = {
    paramName,
    paramType: typeof item.paramType === "string" ? item.paramType : "",
  };
  if (Array.isArray(item.fields) && item.fields.length > 0) {
    brief.fields = item.fields
      .map((child) => mapParsedParamItemToCompositeBrief(child))
      .filter((child): child is CompositeWorkflowParamBrief => child !== null);
  }
  return brief;
}

/**
 * @description 将解析参数列表转为编排参数摘要列表。
 * @param parameters 解析参数（已按 INPUT 或 OUTPUT 拆分）。
 * @returns 参数摘要。
 */
export function mapParsedScriptParametersToCompositeBriefs(parameters: ParseOntologyFunctionParamItem[]): CompositeWorkflowParamBrief[] {
  return parameters.map((item) => mapParsedParamItemToCompositeBrief(item)).filter((item): item is CompositeWorkflowParamBrief => item !== null);
}

/**
 * @description 读取转换节点可供下游选择的输出树；优先解析快照，其次 JSON mappings，兼容旧 outputKeys。
 * @param config 转换配置。
 * @returns 输出参数摘要。
 */
export function resolveCompositeWorkflowTransformOutputs(config?: CompositeWorkflowTransformConfig): CompositeWorkflowParamBrief[] {
  if (config?.paramsSnapshot?.outputs && config.paramsSnapshot.outputs.length > 0) {
    return config.paramsSnapshot.outputs;
  }
  if (config?.mappingMode === "json" && Array.isArray(config.mappings) && config.mappings.length > 0) {
    return config.mappings
      .map((rule) => {
        const paramName = typeof rule.outputField === "string" ? rule.outputField.trim() : "";
        if (!paramName) {
          return null;
        }
        return { paramName, paramType: "object" } satisfies CompositeWorkflowParamBrief;
      })
      .filter((item): item is CompositeWorkflowParamBrief => item !== null);
  }
  return (config?.outputKeys ?? []).map((paramName) => ({
    paramName,
    paramType: "object",
  }));
}
