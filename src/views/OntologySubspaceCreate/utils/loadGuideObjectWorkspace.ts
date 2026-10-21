import type { OntologyObjectWorkspace } from "@/types";
import { GUIDE_ONTOLOGY_CATEGORY_TREE_DATA } from "@/mocks/ontologySubspaceCreateGuideMock/ontologySubspaceCreateGuideMock";
import { mapOntologyCategorySections, mapOntologyCategoryTree } from "@/views/ObjectWorkspacePanel/utils/mapOntologyCategoryTree";

/**
 * @description 加载创建主题演示模式的对象工作区：用演示分类树数据走与真实接口一致的映射链路。
 * @param spaceId 当前空间 id。
 * @returns 演示分类树与对象分区组成的工作区。
 */
export async function loadGuideObjectWorkspace(spaceId: string): Promise<OntologyObjectWorkspace> {
  return {
    spaceId,
    tree: mapOntologyCategoryTree(GUIDE_ONTOLOGY_CATEGORY_TREE_DATA),
    sections: mapOntologyCategorySections(GUIDE_ONTOLOGY_CATEGORY_TREE_DATA),
  };
}
