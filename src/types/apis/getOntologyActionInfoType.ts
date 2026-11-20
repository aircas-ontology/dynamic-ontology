import type {
  CreateOntologyActionBasicFunction,
  CreateOntologyActionKind,
  CreateOntologyActionOperation,
  CreateOntologyActionOutputMode,
  CreateOntologyActionSourceType,
  CreateOntologyActionSubjectType,
} from "./createOntologyActionType";
import type { BehaviorTreeDefinition } from "../pages/behaviorTreeOrchestrationType";

/** 行为详情查询参数。 */
export interface GetOntologyActionInfoParams {
  /** 行为 api 名称。 */
  actionApi: string;
  /** 本体空间 id。 */
  ontologySpaceId: string;
}

/** 行为详情 mappingIns 单项。 */
export interface GetOntologyActionInfoMappingIn {
  functionParamId?: number | null;
  parameterName?: string | null;
  /** 属性展示名称；部分详情响应会返回。 */
  displayName?: string | null;
  /** 属性类型；部分详情响应会返回。 */
  propertyType?: string | null;
  /** 入出参类别；部分详情响应会返回。 */
  category?: "INPUT" | "OUTPUT" | string | null;
  sourceType?: CreateOntologyActionSourceType | string | null;
  sourceConfig?: string | null;
  paramPath?: string | null;
  propertyUniqueIdentifier?: string | null;
  ontologyUniqueIdentifier?: string | null;
  functionParamExpression?: string | null;
  /** 出参输出方式；部分详情响应会返回。 */
  outputMode?: CreateOntologyActionOutputMode | string | null;
  /** 属性存储分组；应用行为测试非 main 时需选子表行。 */
  storageGroup?: string | null;
}

/** 行为详情持续时段；详情接口可能返回毫秒数字或 ISO 时间字符串。 */
export interface GetOntologyActionInfoVisibilityWindow {
  startTime: number | string;
  endTime: number | string;
}

/** 行为详情 linkMapping。 */
export interface GetOntologyActionInfoLinkMapping {
  ontologyLinkUniqIdentifier?: string | null;
  ontologyLinkFunctionParamExpression?: string | null;
  targetStatus?: "ENABLE" | "DELETE" | "DISABLE" | string | null;
  visibilityWindows?: GetOntologyActionInfoVisibilityWindow[] | null;
}

/** 行为详情 functionParams 单项。 */
export interface GetOntologyActionInfoFunctionParam {
  paramId: number;
  paramName: string;
  paramType: string;
  category: string;
  paramOrder: number;
  description?: string | null;
  referenceType?: string | null;
}

/** 行为树执行入参取值来源（详情 executeInputs.nodes[].inputParams）。 */
export type BehaviorTreeExecuteInputSourceType = "EXTERNAL" | "PROPERTY" | "FIXED" | "OBJECT" | "LIST" | string;

/** 行为树执行要求：节点级算子入参。 */
export interface BehaviorTreeExecuteInputParam {
  key: string;
  /** 试跑/提交时 inputParams 的键；缺省回退 key。 */
  paramName?: string;
  valueType?: string;
  required?: boolean;
  description?: string | null;
  /** 取值来源；缺省按 EXTERNAL。 */
  sourceType?: BehaviorTreeExecuteInputSourceType;
  /** PROPERTY/OBJECT/LIST 时按该对象选实例。 */
  objectIdentifier?: string;
  propertyDisplayName?: string | null;
  /** 属性存储分组；LIST+PROPERTY 且非 main 时用于多选子表行。 */
  storageGroup?: string | null;
  /** 旧扁平结构兼容字段；新格式由所属 node 提供。 */
  nodeIds?: string[];
  actionApis?: string[];
}

/** 黑板对象属性键落在非主分组时的分组行要求。 */
export interface BehaviorTreeExecuteBlackboardStorageGroup {
  /** 属性存储分组名。 */
  storageGroup?: string;
  /** 依赖该分组行的黑板键。 */
  blackboardKeys?: string[];
}

/** 行为树执行要求：实例依赖。 */
export interface BehaviorTreeExecuteInstanceRequirement {
  actionApi?: string;
  actionDisplayName?: string;
  objectIdentifier?: string;
  /** 旧扁平结构兼容；新格式挂在所属 node 下。 */
  nodeIds?: string[];
  blackboardKeys?: string[];
  /** 黑板属性平铺时保留的非主分组行要求。 */
  storageGroups?: BehaviorTreeExecuteBlackboardStorageGroup[];
  linkEntityPrimaryKeyRequired?: boolean;
  linkObjectIdentifier?: string;
  linkFromObjectIdentifier?: string;
  linkToObjectIdentifier?: string;
  selfRelation?: boolean;
}

/** 行为树执行要求：写回/出参位置。 */
export interface BehaviorTreeExecuteOutputParam {
  key?: string;
  paramName?: string;
  /** 详情字段名；与 paramName 同义。 */
  parameterName?: string;
  displayName?: string;
  storageGroup?: string;
  objectIdentifier?: string;
  mode?: "DATA_PRIMARY_KEY" | "OUTPUT_PARAM" | "RESULT_ONLY" | string;
  /** 非主表写回时需要行主键。 */
  rowRequired?: boolean;
  /** 旧扁平结构兼容字段。 */
  nodeIds?: string[];
}

/** 行为树执行要求：单个行为节点的入参/实例/写回规划。 */
export interface BehaviorTreeExecuteNodePlan {
  nodeId: string;
  /** 节点展示名称（执行要求返回）。 */
  nodeDisplayName?: string;
  actionApi?: string;
  actionDisplayName?: string;
  entityPrimaryKeyRequired?: boolean;
  inputParams?: BehaviorTreeExecuteInputParam[];
  instanceRequirements?: BehaviorTreeExecuteInstanceRequirement[];
  outputParams?: BehaviorTreeExecuteOutputParam[];
}

/** 黑板对象属性键按对象选实例的要求。 */
export interface BehaviorTreeExecuteBlackboardInstance {
  objectIdentifier?: string;
  blackboardKeys?: string[];
  /** 非主分组：除实例外还要选分组行。 */
  storageGroups?: BehaviorTreeExecuteBlackboardStorageGroup[];
}

/** 行为树详情中的执行入参规划（以 nodes 为准）。 */
export interface BehaviorTreeExecuteInputs {
  /** 按节点的执行要求（新格式主结构）。 */
  nodes?: BehaviorTreeExecuteNodePlan[];
  /** 黑板 PROPERTY 来源按对象选实例。 */
  blackboardInstances?: BehaviorTreeExecuteBlackboardInstance[];
  /** 旧扁平结构兼容；有 nodes 时优先用 nodes。 */
  entityPrimaryKeyRequired?: boolean;
  inputParams?: BehaviorTreeExecuteInputParam[];
  instanceRequirements?: BehaviorTreeExecuteInstanceRequirement[];
  outputParams?: BehaviorTreeExecuteOutputParam[];
  variables?: Array<{ name: string; valueType?: string; defaultValue?: unknown }>;
}

/** 行为详情 data。 */
export interface GetOntologyActionInfoData {
  id: number;
  actionApi: string;
  displayName: string;
  description?: string | null;
  ontologyUniqIdentifier: string;
  /** 创建时间。 */
  createTime?: string | null;
  categoryId: number;
  /** 1 启用，0 失效。 */
  status: number;
  actionKind: CreateOntologyActionKind | string;
  subjectType?: CreateOntologyActionSubjectType | string | null;
  operation?: CreateOntologyActionOperation | string | null;
  storageGroup?: string | null;
  functionApi?: string | null;
  functionDescription?: string | null;
  outputMode?: CreateOntologyActionOutputMode | string | null;
  linkMapping?: GetOntologyActionInfoLinkMapping | null;
  mappingIns?: GetOntologyActionInfoMappingIn[] | null;
  functionParams?: GetOntologyActionInfoFunctionParam[] | null;
  /** 行为树定义；仅 actionKind=TREE 时有值。 */
  treeDefinition?: BehaviorTreeDefinition | null;
  /** 行为树执行要求；仅 actionKind=TREE 时可能有值。 */
  executeInputs?: BehaviorTreeExecuteInputs | null;
  /** 基础函数配置；subjectType=BASIC_FUNCTION 时与创建同构。 */
  basicFunction?: CreateOntologyActionBasicFunction | null;
}
