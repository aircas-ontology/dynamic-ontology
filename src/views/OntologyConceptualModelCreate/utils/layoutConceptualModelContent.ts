import { DagreLayout } from "@antv/layout";
import { conceptualObjectHeight, type ConceptualModelGraphAttribute } from "./groupConceptualAttributes.ts";
import type { MappedCanvasObject, MappedCanvasRelation } from "./mapCanvasContentToConceptualModel.ts";

const NODE_WIDTH = 240;
const COMPONENT_GAP = 180;
const INITIAL_X = 120;
const INITIAL_Y = 100;

interface PositionedObject {
  id: number;
  x: number;
  y: number;
  attributes: ConceptualModelGraphAttribute[];
}

interface ConnectedRelation {
  id: number;
  sourceId: number | null;
  targetId: number | null;
}

/**
 * @description 按关系连通分组，使用节点实际尺寸进行分层排布，并将不相连的分组排列成多行。
 * @param objects 已转换的画布对象。
 * @param relations 已转换的画布关系。
 * @returns 排布后的对象和按相对位置指定端口的关系。
 */
export function layoutConceptualModelContent(
  objects: MappedCanvasObject[],
  relations: MappedCanvasRelation[],
): { objects: MappedCanvasObject[]; relations: MappedCanvasRelation[] } {
  const nodes = objects.map((object) => ({ ...object }));
  const byId = new Map(nodes.map((object) => [object.id, object]));
  const neighbors = new Map(nodes.map((object) => [object.id, new Set<number>()]));
  for (const relation of relations) {
    const { sourceId, targetId } = relation;
    if (sourceId === null || targetId === null || sourceId === targetId || !byId.has(sourceId) || !byId.has(targetId)) continue;
    neighbors.get(sourceId)?.add(targetId);
    neighbors.get(targetId)?.add(sourceId);
  }

  const visited = new Set<number>();
  const components: MappedCanvasObject[][] = [];
  for (const object of nodes) {
    if (visited.has(object.id)) continue;
    const queue = [object.id];
    const component: MappedCanvasObject[] = [];
    visited.add(object.id);
    for (let index = 0; index < queue.length; index++) {
      const id = queue[index];
      if (id === undefined) continue;
      const member = byId.get(id);
      if (member) component.push(member);
      for (const neighbor of neighbors.get(id) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
    components.push(component);
  }

  const columns = Math.max(1, Math.ceil(Math.sqrt(components.length)));
  let nextX = INITIAL_X;
  let nextY = INITIAL_Y;
  let rowHeight = 0;
  components.forEach((component, index) => {
    const ids = new Set(component.map((object) => object.id));
    const edgeKeys = new Set<string>();
    const edges: Array<{ source: string; target: string }> = [];
    for (const relation of relations) {
      const { sourceId, targetId } = relation;
      if (sourceId === null || targetId === null || sourceId === targetId || !ids.has(sourceId) || !ids.has(targetId)) continue;
      const key = `${sourceId}:${targetId}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push({ source: String(sourceId), target: String(targetId) });
    }
    const layout = new DagreLayout({ type: "dagre", rankdir: "TB", nodesep: 60, ranksep: 70, controlPoints: false });
    const result = layout.layout({
      nodes: component.map((object) => ({ id: String(object.id), size: [NODE_WIDTH, conceptualObjectHeight(object.attributes)] })),
      edges,
    });
    const positions = new Map<string, { x: number; y: number }>();
    for (const item of result.nodes ?? []) {
      if ("x" in item && "y" in item && typeof item.x === "number" && typeof item.y === "number" && Number.isFinite(item.x) && Number.isFinite(item.y)) {
        positions.set(item.id, { x: item.x, y: item.y });
      }
    }
    if (positions.size !== component.length) positions.clear();
    const minX = Math.min(...component.map((object) => (positions.get(String(object.id))?.x ?? NODE_WIDTH / 2) - NODE_WIDTH / 2));
    const minY = Math.min(
      ...component.map(
        (object) => (positions.get(String(object.id))?.y ?? conceptualObjectHeight(object.attributes) / 2) - conceptualObjectHeight(object.attributes) / 2,
      ),
    );
    let width = 0;
    let height = 0;
    component.forEach((object, objectIndex) => {
      const position = positions.get(String(object.id));
      object.x = Math.round(nextX + (position ? position.x - NODE_WIDTH / 2 - minX : objectIndex * (NODE_WIDTH + COMPONENT_GAP)));
      object.y = Math.round(nextY + (position ? position.y - conceptualObjectHeight(object.attributes) / 2 - minY : 0));
      width = Math.max(width, object.x + NODE_WIDTH - nextX);
      height = Math.max(height, object.y + conceptualObjectHeight(object.attributes) - nextY);
    });
    rowHeight = Math.max(rowHeight, height);
    if ((index + 1) % columns === 0) {
      nextX = INITIAL_X;
      nextY += rowHeight + COMPONENT_GAP;
      rowHeight = 0;
    } else {
      nextX += width + COMPONENT_GAP;
    }
  });

  const positionedRelations = relations.map((relation) => {
    const source = relation.sourceId === null ? undefined : byId.get(relation.sourceId);
    const target = relation.targetId === null ? undefined : byId.get(relation.targetId);
    if (!source || !target || source.id === target.id) return { ...relation };
    const dx = target.x - source.x;
    const dy = target.y + conceptualObjectHeight(target.attributes) / 2 - source.y - conceptualObjectHeight(source.attributes) / 2;
    if (Math.abs(dx) > Math.abs(dy)) {
      return { ...relation, sourcePort: dx > 0 ? "right" : "left", targetPort: dx > 0 ? "left" : "right" } satisfies MappedCanvasRelation;
    }
    return { ...relation, sourcePort: dy > 0 ? "bottom" : "top", targetPort: dy > 0 ? "top" : "bottom" } satisfies MappedCanvasRelation;
  });
  return { objects: nodes, relations: positionedRelations };
}

/**
 * @description 为相同对象对的多条关系分配不同的中间点，支持正反向关系和节点移动后的重算。
 * @param objects 当前画布对象及位置。
 * @param relations 当前画布关系。
 * @returns 每条需要分离的关系所对应的中间点。
 */
export function calculateParallelRelationVertices(objects: PositionedObject[], relations: ConnectedRelation[]): Map<number, Array<{ x: number; y: number }>> {
  const byId = new Map(objects.map((object) => [object.id, object]));
  const groups = new Map<string, ConnectedRelation[]>();
  for (const relation of relations) {
    const { sourceId, targetId } = relation;
    if (sourceId === null || targetId === null || sourceId === targetId || !byId.has(sourceId) || !byId.has(targetId)) continue;
    const key = `${Math.min(sourceId, targetId)}:${Math.max(sourceId, targetId)}`;
    const group = groups.get(key) ?? [];
    group.push(relation);
    groups.set(key, group);
  }
  const vertices = new Map<number, Array<{ x: number; y: number }>>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const first = group[0];
    if (!first || first.sourceId === null || first.targetId === null) continue;
    const a = byId.get(Math.min(first.sourceId, first.targetId));
    const b = byId.get(Math.max(first.sourceId, first.targetId));
    if (!a || !b) continue;
    const ax = a.x + NODE_WIDTH / 2;
    const ay = a.y + conceptualObjectHeight(a.attributes) / 2;
    const bx = b.x + NODE_WIDTH / 2;
    const by = b.y + conceptualObjectHeight(b.attributes) / 2;
    const length = Math.hypot(bx - ax, by - ay) || 1;
    group.forEach((relation, index) => {
      const offset = (index - (group.length - 1) / 2) * 56;
      vertices.set(relation.id, [
        { x: Math.round((ax + bx) / 2 - ((by - ay) / length) * offset), y: Math.round((ay + by) / 2 + ((bx - ax) / length) * offset) },
      ]);
    });
  }
  return vertices;
}
