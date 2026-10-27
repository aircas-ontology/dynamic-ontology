/** 函数编排（COMPOSITE）后端 compositeConfig 节点。 */
export interface OntologyCompositeNode {
  /** 画布节点 id。 */
  id: string;
  /** 节点类型：function/loop/branch/transform/switch/start/end。 */
  kind?: string;
  /** 函数节点：被引用函数 API 名。 */
  functionId?: string;
  /** 函数节点：被引用函数版本。 */
  functionVersion?: string;
  /** 节点显示名称。 */
  label?: string;
  /** 函数节点：入参端口默认值（端口名到手填值）。 */
  inputDefaults?: Record<string, unknown>;
  /** 循环节点配置。 */
  loopConfig?: {
    mode?: "foreach" | "times";
    collectionPath?: string;
    times?: number;
    itemName?: string;
  };
  /** 分支节点配置。 */
  branchConfig?: { expression?: string };
  /** Switch 节点配置。 */
  switchConfig?: {
    /** 开关取值路径（上游出参名）。 */
    switchOnPath?: string;
    /** case 列表；id 与控制边 sourceParameterId 对齐。 */
    cases?: Array<{ id: string; value: string }>;
  };
  /** 转换节点配置。 */
  transformConfig?: {
    mappingMode?: "json" | "script";
    mappings?: Array<{
      outputField: string;
      mappingType: "direct" | "transform" | "constant";
      inputPath?: string;
      constantValue?: string | number | boolean | null;
      transformExpression?: string;
    }>;
    language?: string;
    script?: string;
  };
  /** 逻辑节点输入端口定义。 */
  inputParameters?: OntologyCompositeParameter[];
  /** 逻辑节点输出端口定义。 */
  outputParameters?: OntologyCompositeParameter[];
}

/** 函数编排后端 compositeConfig 连线。 */
export interface OntologyCompositeEdge {
  id?: string;
  sourceNodeId: string;
  /** 源输出端口名；控制流为 __flow_out__，分支命中为 true/false。 */
  sourceParameterId: string;
  targetNodeId: string;
  /** 目标输入端口名；控制流为 __flow_in__。 */
  targetParameterId: string;
}

/** 函数编排对外参数定义。 */
export interface OntologyCompositeParameter {
  id?: string;
  name: string;
  /** string/number/boolean/object/array。 */
  type?: string;
  description?: string;
}

/** 函数编排对外参数到节点端口的映射。 */
export interface OntologyCompositePortMapping {
  id?: string;
  externalParameterId: string;
  nodeId: string;
  nodeParameterId: string;
}

/** 函数编排后端 compositeConfig 契约（PUT/POST /ontology/function 的 compositeConfig 字段与详情返回结构）。 */
export interface OntologyCompositeConfig {
  kind?: string;
  nodes: OntologyCompositeNode[];
  edges: OntologyCompositeEdge[];
  inputMappings: OntologyCompositePortMapping[];
  outputMappings: OntologyCompositePortMapping[];
  inputParameters: OntologyCompositeParameter[];
  outputParameters: OntologyCompositeParameter[];
  /** 画布原始图（LogicFlow getGraphRawData 结构）；服务端仅透传，回显优先使用。 */
  graph?: unknown;
}
