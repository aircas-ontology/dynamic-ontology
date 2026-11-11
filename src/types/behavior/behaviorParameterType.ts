import type { OntologyEntityInfo, TestOntologyActionParams } from "../index";

/** 行为查看入出参行。 */
export interface SpaceBehaviorActionInfoViewParamRow {
  rowKey: string;
  paramName: string;
  paramPath: string;
  paramType: string;
  /** 属性展示名称（mappingIns.displayName）。 */
  propertyDisplayName: string;
  /** 属性类型（mappingIns.propertyType）。 */
  propertyType: string;
  description: string;
  sourceType: string;
  sourceConfig: string;
  propertyUniqueIdentifier: string;
  ontologyUniqueIdentifier: string;
  functionParamExpression: string;
  outputMode: string;
  /** mappingIns.storageGroup；应用行为测试非 main 时需选子表行。 */
  storageGroup: string;
  /** 绑定摘要文案。 */
  bindSummary: string;
}

/** 测试弹窗可选的实体属性数据行。 */
export interface BehaviorTestEntityDataRow {
  rowKey: string;
  storageGroup: string;
  dataPrimaryKey: string | number | boolean | Record<string, unknown>;
  dataPrimaryKeyLabel: string;
  propertySummary: string;
}

/** 关系实例测试挂载侧。 */
export type RelationMountSide = "from" | "to" | "";

/** 测试弹窗实体表格行。 */
export interface BehaviorTestEntityRow {
  rowKey: string;
  displayName: string;
  primaryKeyLabel: string;
  ontologyName: string;
  propertySummary: string;
  primaryKey: string | number;
  raw: OntologyEntityInfo;
}

/** 测试弹窗外部输入参数行。 */
export interface BehaviorTestParamRow {
  rowKey: string;
  /** params 提交用的参数名（parameterName）。 */
  paramName: string;
  /** 属性展示名称。 */
  propertyDisplayName: string;
  /** 属性类型。 */
  propertyType: string;
}

/** 应用行为 PROPERTY / WRITE_PROPERTY 对象实例选择器状态（按参数名独立）。 */
export interface ApplicationOntologyEntityPicker {
  /** 选择器键：参数名。 */
  pickerKey: string;
  paramName: string;
  ontologyUniqueIdentifier: string;
  label: string;
  /**
   * 入参 PROPERTY 为 multiple：表单单选草稿，经添加累加多条记录后提交；
   * 写回出参为 single：表单单选直接提交。
   */
  selectionMode: "single" | "multiple";
  loading: boolean;
  error: string;
  rows: BehaviorTestEntityRow[];
  total: number;
  page: number;
  pageSize: number;
  /** 已选行键（跨页保留）。 */
  selectedRowKeys: string[];
  /** 已选实体（跨页保留）。 */
  selectedEntities: BehaviorTestEntityRow[];
}

/** 非 main 存储分组下，单个已选实例对应的数据行选择槽。 */
export interface ApplicationStorageGroupEntitySlot {
  entityRowKey: string;
  entityPrimaryKey: string | number | boolean | Record<string, unknown>;
  entityDisplayName: string;
  loading: boolean;
  error: string;
  rows: BehaviorTestEntityDataRow[];
  total: number;
  page: number;
  pageSize: number;
  selectedRowKey: string;
  selectedDataRow: BehaviorTestEntityDataRow | null;
}

/** 应用行为非 main 存储分组数据行选择器状态（按参数名独立）。 */
export interface ApplicationStorageGroupPicker {
  pickerKey: string;
  paramName: string;
  ontologyUniqueIdentifier: string;
  storageGroup: string;
  label: string;
  /** 按已选实例维护的数据行槽位。 */
  entitySlots: ApplicationStorageGroupEntitySlot[];
}

/** 入参 PROPERTY 多选经「添加」固化后的绑定记录。 */
export interface ApplicationInputBindingRecord {
  /** 稳定键：实体主键 + 可选数据行主键。 */
  recordKey: string;
  entityPrimaryKey: string | number | boolean | Record<string, unknown>;
  entityDisplayName: string;
  dataPrimaryKey?: string | number | boolean | Record<string, unknown> | null;
  dataPrimaryKeyLabel?: string;
}
/** 可独立恢复的行为参数配置；仅保存数据，不执行接口。 */
export interface BehaviorParameterSnapshot {
  actionApi: string;
  spaceId: string;
  request: TestOntologyActionParams;
  values: Record<string, string>;
  inputBindings: Record<string, ApplicationInputBindingRecord[]>;
  ontologyPickers: ApplicationOntologyEntityPicker[];
  storagePickers: ApplicationStorageGroupPicker[];
  fromEntities: BehaviorTestEntityRow[];
  toEntities: BehaviorTestEntityRow[];
}
/** 调度行为选项，稳定标识与显示名称分离。 */
export interface ScheduleBehaviorOption {
  id: string;
  actionApi: string;
  displayName: string;
  ontologyUniqIdentifier: string;
}
