import type { CanvasOntology, GetOntologySpaceCanvasContentData } from "@/types";
import { layoutConceptualModelContent } from "./layoutConceptualModelContent.ts";

export interface MappedCanvasAttribute {
  id: number;
  displayName: string;
  apiName: string;
  dataType: string;
  defaultValue: string;
  description: string;
  isPrimary: boolean;
  isNameKey: boolean;
  storageGroup: string;
}

export interface MappedCanvasObject {
  id: number;
  displayName: string;
  apiName: string;
  description: string;
  x: number;
  y: number;
  attributes: MappedCanvasAttribute[];
}

export interface MappedCanvasRelation {
  id: number;
  displayName: string;
  apiName: string;
  description: string;
  sourceId: number | null;
  targetId: number | null;
  sourcePort: "top" | "right" | "bottom" | "left" | null;
  targetPort: "top" | "right" | "bottom" | "left" | null;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
}

export interface MappedCanvasContent {
  objects: MappedCanvasObject[];
  relations: MappedCanvasRelation[];
  nextSequence: number;
}

/**
 * @description 将后端画布内容转换为概念模型页面的本地节点、属性和关系模型。
 * @param data 后端画布响应数据。
 * @returns 可直接交给概念模型画布渲染的内容和下一个本地序号。
 */
export function mapCanvasContentToConceptualModel(data: GetOntologySpaceCanvasContentData | null | undefined): MappedCanvasContent {
  let sequence = 0;
  const objects = (data?.ontologies ?? []).map((ontology, index) => {
    const id = ++sequence;
    const object = mapCanvasOntology(ontology, id, index, () => ++sequence);
    return object;
  });
  const objectIdByApiName = new Map(objects.map((object) => [object.apiName, object.id]));
  const relations = (data?.links ?? []).map((link) => {
    const id = ++sequence;
    const sourceId = objectIdByApiName.get(link.fromOntologyApiName) ?? null;
    const targetId = objectIdByApiName.get(link.toOntologyApiName) ?? null;
    return {
      id,
      displayName: link.name,
      apiName: link.apiName ?? `relation_${id}`,
      description: link.description ?? "",
      sourceId,
      targetId,
      sourcePort: sourceId === null ? null : "right",
      targetPort: targetId === null ? null : "left",
      sourcePoint: { x: 0, y: 0 },
      targetPoint: { x: 0, y: 0 },
    } satisfies MappedCanvasRelation;
  });
  return { ...layoutConceptualModelContent(objects, relations), nextSequence: sequence };
}

/**
 * @description 将一个后端对象和其属性转换为画布对象。
 * @param ontology 后端对象。
 * @param id 本地对象标识。
 * @param index 排布序号。
 * @param nextSequence 生成本地属性标识。
 * @returns 完整画布对象。
 */
function mapCanvasOntology(ontology: CanvasOntology, id: number, index: number, nextSequence: () => number): MappedCanvasObject {
  return {
    id,
    displayName: ontology.displayName,
    apiName: ontology.apiName,
    description: ontology.description ?? "",
    x: 120 + index * 340,
    y: 100,
    attributes: (ontology.properties ?? []).map((property) => ({
      id: nextSequence(),
      displayName: property.displayName,
      apiName: property.apiName,
      dataType: property.dataType ?? "String",
      defaultValue: property.defaultValue ?? "",
      description: property.description ?? "",
      isPrimary: property.isPrimaryKey ?? false,
      isNameKey: property.isTitleKey ?? false,
      storageGroup: property.storageGroup ?? "main",
    })),
  };
}
