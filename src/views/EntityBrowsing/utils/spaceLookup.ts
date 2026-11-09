import type { OntologySpaceItem } from "@/types";

/**
 * @description 在对象空间列表中按 id 查找空间。
 * @param spaces 对象空间列表。
 * @param spaceId 目标空间 id。
 * @returns 命中空间；未命中返回 null。
 */
export function findSpaceById(spaces: readonly OntologySpaceItem[], spaceId: string): OntologySpaceItem | null {
  const id = spaceId.trim();
  if (!id) return null;
  return spaces.find((space) => space.id === id) ?? null;
}
