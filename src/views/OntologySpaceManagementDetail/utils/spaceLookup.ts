import type { OntologySpaceItem } from "@/types";

export function findSpaceById(spaces: readonly OntologySpaceItem[], spaceId: string): OntologySpaceItem | null {
  const id = spaceId.trim();
  if (!id) return null;
  return spaces.find((space) => space.id === id) ?? null;
}
