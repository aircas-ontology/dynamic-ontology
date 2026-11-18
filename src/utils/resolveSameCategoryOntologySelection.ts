import type { OntologyCategoryObjectOption } from "./mapOntologyObjectsToCategoryOptions.ts";

/** 同目录多选对象的解析结果。 */
export interface ResolveSameCategoryOntologySelectionResult {
  /** 可接受的下一组选中 id。 */
  nextIds: string[];
  /** 跨目录时的提示；空串表示合法。 */
  error: string;
}

/**
 * @description 解析对象多选变更：多选必须落在同一分类目录。
 * @param previousIds 变更前已选 id。
 * @param candidateIds 控件给出的候选 id。
 * @param options 带 categoryId 的对象选项。
 * @returns 下一组选中 id；跨目录时保留 previousIds 并返回错误文案。
 */
export function resolveSameCategoryOntologySelection(
  previousIds: string[],
  candidateIds: string[],
  options: OntologyCategoryObjectOption[],
): ResolveSameCategoryOntologySelectionResult {
  const optionById = new Map(options.map((item) => [item.value, item]));
  const next = [...new Set(candidateIds.map((id) => id.trim()).filter(Boolean))];
  if (next.length <= 1) {
    return { nextIds: next, error: "" };
  }
  const categories = new Set<number>();
  for (const id of next) {
    const option = optionById.get(id);
    if (!option) {
      return { nextIds: [...previousIds], error: "所选对象无效，请重新选择" };
    }
    categories.add(option.categoryId);
  }
  if (categories.size > 1) {
    return { nextIds: [...previousIds], error: "多选对象须属于同一目录" };
  }
  return { nextIds: next, error: "" };
}
