import type { OntologyRelationClass, SpaceRelationHopLevel, SpaceRelationObjectOption } from "@/types";

function buildAdjacency(relations: OntologyRelationClass[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  const link = (a: string, b: string): void => {
    if (!a || !b) return;
    const left = adj.get(a) ?? new Set<string>();
    left.add(b);
    adj.set(a, left);
    const right = adj.get(b) ?? new Set<string>();
    right.add(a);
    adj.set(b, right);
  };
  relations.forEach((item) => {
    link(item.sourceName.trim(), item.targetName.trim());
  });
  return adj;
}

/** 计算从种子出发的跳数（无向，不超过 maxHop） */
export function computeHopDistances(relations: OntologyRelationClass[], seedNames: string[], maxHop: number = Number.POSITIVE_INFINITY): Map<string, number> {
  const seeds = seedNames.map((name) => name.trim()).filter(Boolean);
  const hop = new Map<string, number>();
  if (!seeds.length) return hop;
  const adj = buildAdjacency(relations);
  const queue: string[] = [];
  seeds.forEach((seed) => {
    if (!hop.has(seed)) {
      hop.set(seed, 0);
      queue.push(seed);
    }
  });
  while (queue.length) {
    const current = queue.shift();
    if (!current) continue;
    const distance = hop.get(current) ?? 0;
    if (distance >= maxHop) continue;
    for (const next of adj.get(current) ?? []) {
      if (hop.has(next)) continue;
      hop.set(next, distance + 1);
      queue.push(next);
    }
  }
  return hop;
}

/**
 * 按种子 + 最大跳数裁剪关系：
 * 只保留向外扩展的相邻跳层边（0↔1、1↔2…），不含同层互连。
 */
export function filterRelationsByHop(relations: OntologyRelationClass[], seedNames: string[], maxHop: SpaceRelationHopLevel): OntologyRelationClass[] {
  const seeds = seedNames.map((name) => name.trim()).filter(Boolean);
  if (!seeds.length) return relations;
  const hop = computeHopDistances(relations, seeds, maxHop);
  return relations.filter((item) => {
    const source = item.sourceName.trim();
    const target = item.targetName.trim();
    const sourceHop = hop.get(source);
    const targetHop = hop.get(target);
    if (sourceHop === undefined || targetHop === undefined) return false;
    if (sourceHop > maxHop || targetHop > maxHop) return false;
    return Math.abs(sourceHop - targetHop) === 1;
  });
}

/**
 * @description 按源本体筛选关系：保留源名称等于选中对象 value 或其展示 label 的关系。
 * @param relations 当前关系列表。
 * @param selectedValue 下拉选中的对象 value（通常为 uniqueIdentifier）。
 * @param objectOptions 对象下拉选项，用于把 value 解析为 label。
 * @returns 源本体匹配选中对象的关系子集；未选中时返回原列表。
 */
export function filterRelationsBySourceObject(
  relations: OntologyRelationClass[],
  selectedValue: string,
  objectOptions: SpaceRelationObjectOption[] = [],
): OntologyRelationClass[] {
  const trimmed = selectedValue.trim();
  if (!trimmed) return relations;
  const matchedLabel = objectOptions.find((item) => item.value === trimmed)?.label.trim() ?? "";
  const sourceKeys = new Set([trimmed, matchedLabel].filter(Boolean));
  return relations.filter((item) => sourceKeys.has(item.sourceName.trim()));
}
