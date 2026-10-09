import type { SubspaceCreateSelectedObject } from "./mapSubspaceCreateSelectedObject";

export interface SubspaceCreateSelectedInstance {
  id: string;
  name: string;
  objectId: string;
  objectLabel: string;
}

/**
 * @description 按选中对象生成可纳入子空间的实例行，每个对象默认两条样例实例。
 * @param objects 第一步勾选的本体对象。
 * @returns 实例表格行。
 */
export function mapSubspaceCreateSelectedInstances(objects: SubspaceCreateSelectedObject[]): SubspaceCreateSelectedInstance[] {
  return objects.flatMap((object) =>
    [1, 2].map((index) => ({
      id: `${object.id}-${index}`,
      name: `${object.label}实例${index}`,
      objectId: object.id,
      objectLabel: object.label,
    })),
  );
}
