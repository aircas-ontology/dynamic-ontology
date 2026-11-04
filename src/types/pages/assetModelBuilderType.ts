/** 资产模型构建 · 类型定义 */

/** 单条属性元数据（类似表单校验规则，如"必填""数值范围"） */
export interface AssetModelPropertyMeta {
  /** 规则名称，如"必填""数值范围" */
  label: string;
  /** 规则取值展示，如"是""0 - 850" */
  value: string;
}

/** 模型概念属性（资产标准数据元） */
export interface AssetModelProperty {
  /** 数据元标识符 */
  id: string;
  /** 数据元名称 */
  name: string;
  /** 数据元简称；无简称时为空字符串 */
  shortName: string;
  /** API 名称（默认与标识符一致，供对象属性落库） */
  apiName: string;
  /** 数据元值的数据类型，如字符串型、数值型 */
  dataType: string;
  /** 数据元值的表示形式，如普通文本、代码文本、复合文本 */
  representation: string;
  /** 是否必填 */
  required: boolean;
  /** 计量单位（可选） */
  unit?: string;
  /** 数据元定义 */
  description: string;
  /** 属性元数据（表单校验规则） */
  metaList: AssetModelPropertyMeta[];
  /** 属性元数据“值”的可选范围。 */
  enumValues?: string[];
}

/** 根据资产数据元生成的可编辑对象属性。 */
export interface AssetObjectPropertyDraft extends AssetModelProperty {
  sourceKey: string;
  defaultValue: string;
  isPrimary: boolean;
  isNameKey: boolean;
}

/** 资产模型概要 */
export interface AssetModelSummary {
  id: string;
  /** 模型名称 */
  name: string;
  /** API 名称 */
  apiName: string;
  description: string;
  /** 所属域（分组名） */
  domain: string;
  version: string;
  updatedAt: string;
  propertyCount: number;
}

/** 资产模型详情（含属性列表） */
export interface AssetModelDetail extends AssetModelSummary {
  properties: AssetModelProperty[];
}

/** 资产模型树节点：分组节点含 children，叶子节点 modelId 关联资产模型 */
export interface AssetModelTreeNode {
  id: string;
  label: string;
  children?: AssetModelTreeNode[];
  modelId?: string;
}
