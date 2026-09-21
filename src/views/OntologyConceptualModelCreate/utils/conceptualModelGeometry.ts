import type { ConceptualModelObject, ConceptualModelPort, ConceptualModelRelation } from "@/types";

/**
 * @description 计算本体对象四边连接点在画布坐标系中的位置。
 * @param object 本体对象节点
 * @param port 四边连接点
 * @returns 连接点坐标
 */
export function objectPoint(object: ConceptualModelObject, port: ConceptualModelPort) {
  return {
    x: object.x + (port === "left" ? 0 : port === "right" ? 190 : 95),
    y: object.y + (port === "top" ? 0 : port === "bottom" ? 120 : 60),
  };
}

/**
 * @description 获取关系源端或目标端坐标；已连接对象时跟随对象端口，否则使用自由端点。
 * @param relation 关系
 * @param endpoint 源端或目标端
 * @param objects 画布对象列表
 * @returns 端点坐标
 */
export function pointFor(relation: ConceptualModelRelation, endpoint: "source" | "target", objects: ConceptualModelObject[]) {
  const object = objects.find((item) => item.id === (endpoint === "source" ? relation.sourceId : relation.targetId));
  const port = endpoint === "source" ? (relation.sourcePort ?? "right") : (relation.targetPort ?? "left");
  return object ? objectPoint(object, port) : endpoint === "source" ? relation.sourcePoint : relation.targetPoint;
}
