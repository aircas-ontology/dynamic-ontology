import type { CompositeWorkflowParamBrief, FunctionOperatorParameter, FunctionOperatorParameterField, ParseOntologyFunctionParamItem } from "@/types";

/**
 * @description 将页面参数字段树转为脚本 IDE 参数树节点。
 * @param field 页面参数字段。
 * @param category INPUT 或 OUTPUT。
 * @param order 同层顺序，从 1 开始。
 * @returns 树节点。
 */
function mapParameterFieldToScriptParamTreeNode(
  field: FunctionOperatorParameterField,
  category: "INPUT" | "OUTPUT",
  order: number,
): ParseOntologyFunctionParamItem {
  const node: ParseOntologyFunctionParamItem = {
    paramName: field.name,
    paramType: field.apiParamType?.trim() || field.type.toUpperCase(),
    category,
    paramOrder: order,
    referenceType: "",
  };
  if (field.itemFields && field.itemFields.length > 0) {
    node.fields = field.itemFields.map((child, index) => mapParameterFieldToScriptParamTreeNode(child, category, index + 1));
  }
  return node;
}

/**
 * @description 将详情映射后的输入/输出参数转为脚本 IDE 左侧同款参数树节点。
 * @param parameters 页面参数列表。
 * @param category INPUT 或 OUTPUT。
 * @returns 可交给 FunctionOperatorScriptParamTree 的节点。
 */
export function mapOperatorParametersToScriptParamTree(
  parameters: FunctionOperatorParameter[],
  category: "INPUT" | "OUTPUT",
): ParseOntologyFunctionParamItem[] {
  return parameters.map((item, index) =>
    mapParameterFieldToScriptParamTreeNode(
      {
        id: item.id,
        name: item.name,
        type: item.type,
        required: item.required,
        description: item.description,
        apiParamType: item.apiParamType,
        itemFields: item.itemFields,
      },
      category,
      index + 1,
    ),
  );
}

/**
 * @description 递归将编排参数摘要转为树节点。
 * @param brief 参数摘要。
 * @param category INPUT 或 OUTPUT。
 * @param order 同层顺序。
 * @returns 树节点。
 */
function mapBriefToScriptParamTreeNode(brief: CompositeWorkflowParamBrief, category: "INPUT" | "OUTPUT", order: number): ParseOntologyFunctionParamItem {
  const node: ParseOntologyFunctionParamItem = {
    paramName: brief.paramName,
    paramType: brief.paramType,
    category,
    paramOrder: order,
    referenceType: "",
  };
  if (brief.fields && brief.fields.length > 0) {
    node.fields = brief.fields.map((child, index) => mapBriefToScriptParamTreeNode(child, category, index + 1));
  }
  return node;
}

/**
 * @description 将编排参数摘要（可含 fields）转为脚本 IDE 参数树节点。
 * @param briefs 参数摘要列表。
 * @param category INPUT 或 OUTPUT。
 * @returns 树节点列表。
 */
export function mapCompositeParamBriefsToScriptParamTree(
  briefs: CompositeWorkflowParamBrief[],
  category: "INPUT" | "OUTPUT",
): ParseOntologyFunctionParamItem[] {
  return briefs.map((item, index) => mapBriefToScriptParamTreeNode(item, category, index + 1));
}
