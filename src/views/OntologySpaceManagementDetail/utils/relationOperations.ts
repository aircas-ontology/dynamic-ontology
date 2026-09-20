import type {
  OntologyRelationCategoryNode,
  OntologyRelationClass,
  RelationCategoryUpdatePayload,
  RelationCategoryWritePayload,
  RelationClassUpdatePayload,
  RelationClassWritePayload,
  SpaceRelationObjectOption,
  SpaceRelationWorkspaceData,
} from "@/types";
import { buildObjectOptions } from "../../../mocks/ontologySpaceRelationMock/ontologySpaceRelationMock.ts";

const ROOT_RELATION_CATEGORY_ID = "relation-all";

/**
 * @description 判断分类是否为关系分类树根节点（兼容 mock 根 id 与接口根 categoryId）。
 * @param categoryTree 关系分类树。
 * @param categoryId 待判断分类 id。
 * @returns 是否为根分类。
 */
function isRootRelationCategory(categoryTree: OntologyRelationCategoryNode[], categoryId: string): boolean {
  return categoryId === ROOT_RELATION_CATEGORY_ID || categoryId === categoryTree[0]?.id;
}

export function findRelationCategoryNode(nodes: OntologyRelationCategoryNode[], categoryId: string): OntologyRelationCategoryNode | null {
  for (const node of nodes) {
    if (node.id === categoryId) return node;
    const found = findRelationCategoryNode(node.children, categoryId);
    if (found) return found;
  }
  return null;
}

export function collectCategoryIds(node: OntologyRelationCategoryNode): string[] {
  return [node.id, ...node.children.flatMap(collectCategoryIds)];
}

export function findParentCategory(nodes: OntologyRelationCategoryNode[], categoryId: string): OntologyRelationCategoryNode | null {
  for (const node of nodes) {
    if (node.children.some((child) => child.id === categoryId)) return node;
    const found = findParentCategory(node.children, categoryId);
    if (found) return found;
  }
  return null;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function refreshObjectOptions(data: SpaceRelationWorkspaceData): SpaceRelationObjectOption[] {
  return buildObjectOptions(data.relations);
}

export function addRelationCategory(data: SpaceRelationWorkspaceData, payload: RelationCategoryWritePayload): SpaceRelationWorkspaceData {
  const name = payload.name.trim();
  const color = payload.color.trim();
  if (!name) throw new Error("分类名称不能为空");
  if (data.categoryTree.length === 0) {
    return {
      ...data,
      categoryTree: [
        {
          id: createId("rel-cat"),
          label: name,
          ...(color ? { color } : {}),
          children: [],
        },
      ],
      objectOptions: refreshObjectOptions(data),
    };
  }
  const parent = findRelationCategoryNode(data.categoryTree, payload.parentId);
  if (!parent) throw new Error("父分类不存在");
  if (parent.children.some((child) => child.label === name)) throw new Error("同级分类名称已存在");
  const nextTree = structuredClone(data.categoryTree);
  const nextParent = findRelationCategoryNode(nextTree, payload.parentId);
  if (!nextParent) throw new Error("父分类不存在");
  nextParent.children.push({
    id: createId("rel-cat"),
    label: name,
    ...(color ? { color } : {}),
    children: [],
  });
  return { ...data, categoryTree: nextTree, objectOptions: refreshObjectOptions(data) };
}

export function updateRelationCategory(data: SpaceRelationWorkspaceData, payload: RelationCategoryUpdatePayload): SpaceRelationWorkspaceData {
  const name = payload.name.trim();
  const color = payload.color.trim();
  if (!name) throw new Error("分类名称不能为空");
  if (isRootRelationCategory(data.categoryTree, payload.id)) throw new Error("根分类不可编辑");
  const nextTree = structuredClone(data.categoryTree);
  const node = findRelationCategoryNode(nextTree, payload.id);
  if (!node) throw new Error("分类不存在");
  const parent = findParentCategory(nextTree, payload.id);
  if (parent?.children.some((child) => child.id !== payload.id && child.label === name)) {
    throw new Error("同级分类名称已存在");
  }
  node.label = name;
  if (color) node.color = color;
  else delete node.color;
  const relations = data.relations.map((item) => (item.categoryId === payload.id ? { ...item, categoryName: name } : item));
  return { categoryTree: nextTree, relations, objectOptions: buildObjectOptions(relations) };
}

export function removeRelationCategory(data: SpaceRelationWorkspaceData, categoryId: string): SpaceRelationWorkspaceData {
  if (isRootRelationCategory(data.categoryTree, categoryId)) throw new Error("根分类不可删除");
  const node = findRelationCategoryNode(data.categoryTree, categoryId);
  if (!node) throw new Error("分类不存在");
  const ids = new Set(collectCategoryIds(node));
  if (data.relations.some((item) => ids.has(item.categoryId))) {
    throw new Error("分类下仍有关系，无法删除");
  }
  const nextTree = structuredClone(data.categoryTree);
  const parent = findParentCategory(nextTree, categoryId);
  if (!parent) throw new Error("分类不存在");
  parent.children = parent.children.filter((child) => child.id !== categoryId);
  return { ...data, categoryTree: nextTree, objectOptions: refreshObjectOptions(data) };
}

export function addRelation(data: SpaceRelationWorkspaceData, payload: RelationClassWritePayload): SpaceRelationWorkspaceData {
  const category = findRelationCategoryNode(data.categoryTree, payload.categoryId);
  if (!category) throw new Error("关系分类不存在");
  const displayName = payload.displayName.trim();
  const apiName = payload.apiName.trim();
  const sourceName = payload.sourceName.trim();
  const targetName = payload.targetName.trim();
  if (!displayName || !apiName || !sourceName || !targetName) throw new Error("请完整填写关系信息");
  if (sourceName === targetName) throw new Error("源本体与目标本体不能相同");
  if (data.relations.some((item) => item.apiName === apiName)) throw new Error("API 名称已存在");
  const relations = [
    ...data.relations,
    {
      id: createId("rel"),
      categoryId: payload.categoryId,
      categoryName: category.label,
      displayName,
      apiName,
      sourceName,
      targetName,
      cardinality: payload.cardinality,
      description: payload.description.trim(),
    },
  ];
  return { ...data, relations, objectOptions: buildObjectOptions(relations) };
}

export function updateRelation(data: SpaceRelationWorkspaceData, payload: RelationClassUpdatePayload): SpaceRelationWorkspaceData {
  const index = data.relations.findIndex((item) => item.id === payload.id);
  if (index < 0) throw new Error("关系不存在");
  const category = findRelationCategoryNode(data.categoryTree, payload.categoryId);
  if (!category) throw new Error("关系分类不存在");
  const displayName = payload.displayName.trim();
  const apiName = payload.apiName.trim();
  const sourceName = payload.sourceName.trim();
  const targetName = payload.targetName.trim();
  if (!displayName || !apiName || !sourceName || !targetName) throw new Error("请完整填写关系信息");
  if (sourceName === targetName) throw new Error("源本体与目标本体不能相同");
  if (data.relations.some((item) => item.id !== payload.id && item.apiName === apiName)) {
    throw new Error("API 名称已存在");
  }
  const relations = data.relations.map((item) =>
    item.id === payload.id
      ? {
          ...item,
          categoryId: payload.categoryId,
          categoryName: category.label,
          displayName,
          apiName,
          sourceName,
          targetName,
          cardinality: payload.cardinality,
          description: payload.description.trim(),
        }
      : item,
  );
  return { ...data, relations, objectOptions: buildObjectOptions(relations) };
}

export function removeRelation(data: SpaceRelationWorkspaceData, relationId: string): SpaceRelationWorkspaceData {
  if (!data.relations.some((item) => item.id === relationId)) throw new Error("关系不存在");
  const relations = data.relations.filter((item) => item.id !== relationId);
  return { ...data, relations, objectOptions: buildObjectOptions(relations) };
}

export function filterRelationsByCategory(
  relations: OntologyRelationClass[],
  categoryTree: OntologyRelationCategoryNode[],
  categoryId: string,
): OntologyRelationClass[] {
  if (!categoryId || isRootRelationCategory(categoryTree, categoryId)) return relations;
  const node = findRelationCategoryNode(categoryTree, categoryId);
  if (!node) return [];
  const ids = new Set(collectCategoryIds(node));
  return relations.filter((item) => ids.has(item.categoryId));
}
