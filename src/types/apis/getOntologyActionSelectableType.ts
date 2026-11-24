/** 查询可选已发布行为请求参数（扁平 query）。 */
export interface GetOntologyActionSelectableParams {
  /** 对象空间 id，必填。 */
  ontologySpaceId: number;
  /** 对象编号；可重复传参或逗号分隔。 */
  ontologyIdentifiers?: string | string[];
  /** 函数 api；可重复传参或逗号分隔。 */
  functionApis?: string | string[];
}

/** 行为类别。 */
export type OntologyActionSelectableActionKind = "BASE" | "APPLICATION" | "TREE";

/** 基础行为类型。 */
export type OntologyActionSelectableSubjectType = "PROPERTY_VALUE" | "LINK" | "BASIC_OPERATOR" | "BASIC_FUNCTION";

/** 基础操作。 */
export type OntologyActionSelectableOperation = "CREATE" | "UPDATE" | "DELETE";

/** 输出方式。 */
export type OntologyActionSelectableOutputMode = "RESULT_ONLY" | "WRITE_PROPERTY";

/** 可选已发布行为条目（OntologyActionInfoVO）。 */
export interface GetOntologyActionSelectableItem {
  /** 行为 id。 */
  id?: number;
  /** 对象 icon。 */
  icon?: string | null;
  /** 创建时选的对象 id。 */
  ontologyUniqIdentifier?: string | null;
  /** api 名称。 */
  actionApi?: string | null;
  /** 行为描述。 */
  description?: string | null;
  /** 行为显示名称。 */
  displayName?: string | null;
  /** 对象下函数 api。 */
  functionApi?: string | null;
  /** 函数名称。 */
  functionName?: string | null;
  /** 函数描述。 */
  functionDescription?: string | null;
  /** 所属行为分类 id。 */
  categoryId?: number | null;
  /** 状态：1 已发布，2 草稿。 */
  status?: number | null;
  /** 行为类别。 */
  actionKind?: OntologyActionSelectableActionKind | string | null;
  /** 基础行为类型。 */
  subjectType?: OntologyActionSelectableSubjectType | string | null;
  /** 基础操作。 */
  operation?: OntologyActionSelectableOperation | string | null;
  /** 属性值操作的目标存储分组。 */
  storageGroup?: string | null;
  /** 输出方式。 */
  outputMode?: OntologyActionSelectableOutputMode | string | null;
  /** 创建时间。 */
  createTime?: string | null;
  /** 修改时间。 */
  updateTime?: string | null;
}

/** 查询可选已发布行为响应 data。 */
export type GetOntologyActionSelectableData = GetOntologyActionSelectableItem[];
