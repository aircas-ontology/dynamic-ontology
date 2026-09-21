/** 概念模型组件库条目类型。 */
export type ConceptualModelPaletteType = "object" | "attribute" | "relation";

/** 对象四边连接点。 */
export type ConceptualModelPort = "top" | "right" | "bottom" | "left";

/** 画布当前选中项。 */
export type ConceptualModelSelection = {
  kind: "object" | "attribute" | "relation";
  id: number;
};

/** 概念模型对象属性。 */
export interface ConceptualModelAttribute {
  id: number;
  displayName: string;
  apiName: string;
  dataType: string;
  defaultValue: string;
  description: string;
  isPrimary: boolean;
  isNameKey: boolean;
}

/** 概念模型本体对象节点。 */
export interface ConceptualModelObject {
  id: number;
  displayName: string;
  apiName: string;
  description: string;
  x: number;
  y: number;
  attributes: ConceptualModelAttribute[];
}

/** 概念模型对象关系。 */
export interface ConceptualModelRelation {
  id: number;
  displayName: string;
  apiName: string;
  description: string;
  sourceId: number | null;
  targetId: number | null;
  sourcePort: ConceptualModelPort | null;
  targetPort: ConceptualModelPort | null;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
}

/** 组件库展示项。 */
export interface ConceptualModelPaletteItem {
  type: ConceptualModelPaletteType;
  label: string;
  hint: string;
  glyph: string;
}

/** 属性检查器展示模型（含所属对象名）。 */
export interface ConceptualModelSelectedAttribute extends ConceptualModelAttribute {
  owner: string;
}
