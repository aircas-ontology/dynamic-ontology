import type {
  OntologyConceptNode,
  OntologyObjectItem,
  OntologyObjectSection,
  OntologyObjectWorkspace,
} from "@/types";

interface CategorySample {
  id: string;
  name: string;
  apiPrefix: string;
  parentDisplayName: string;
  objects: string[];
}

const navyCategories: CategorySample[] = [
  { id: "carrier", name: "航空母舰", apiPrefix: "carrier", parentDisplayName: "舰船", objects: ["福特级航空母舰(CVN)", "尼米兹级航空母舰(CVN)"] },
  { id: "destroyer", name: "驱逐舰", apiPrefix: "destroyer", parentDisplayName: "舰船", objects: ["阿利·伯克级驱逐舰(DDG)", "阿利伯克级Flight-I驱逐舰(DDG)", "阿利伯克级Flight-II驱逐舰(DDG)", "阿利伯克级Flight-IIA驱逐舰(DDG)", "阿利伯克级Flight-III驱逐舰(DDG)", "朱姆沃尔特级驱逐舰(DDG)"] },
  { id: "cruiser", name: "巡洋舰", apiPrefix: "cruiser", parentDisplayName: "舰船", objects: ["提康德罗加级巡洋舰(CG)", "基洛夫级巡洋舰(CG)", "光荣级巡洋舰(CG)"] },
  { id: "frigate", name: "护卫舰", apiPrefix: "frigate", parentDisplayName: "舰船", objects: ["星座级护卫舰(FFG)", "佩里级护卫舰(FFG)", "萨克森级护卫舰(FFG)", "拉法叶级护卫舰(FFG)"] },
  { id: "amphibious", name: "两栖战舰", apiPrefix: "amphibious", parentDisplayName: "舰船", objects: ["美国级两栖攻击舰", "黄蜂级两栖攻击舰", "圣安东尼奥级船坞运输舰"] },
  { id: "submarine", name: "潜艇", apiPrefix: "submarine", parentDisplayName: "舰船", objects: ["弗吉尼亚级攻击核潜艇", "洛杉矶级攻击核潜艇", "俄亥俄级战略核潜艇", "哥伦比亚级战略核潜艇"] },
];

function createItems(category: CategorySample, categoryIndex: number): OntologyObjectItem[] {
  return category.objects.map((displayName, itemIndex) => ({
    id: `${category.id}-${itemIndex + 1}`,
    categoryId: category.id,
    displayName,
    apiName: `${category.apiPrefix}_${itemIndex + 1}`,
    parentDisplayName: category.parentDisplayName,
    createdAt: `2026-${String(3 + categoryIndex).padStart(2, "0")}-${String(10 + itemIndex).padStart(2, "0")} 09:30`,
    iconUrl: "",
    metrics: {
      attribute: 56 + categoryIndex * 3 + itemIndex,
      relation: 46_180 + categoryIndex * 4_760 + itemIndex * 2_730,
      behavior: 17 + categoryIndex + itemIndex,
    },
  }));
}

const navySections: OntologyObjectSection[] = navyCategories.map((category, index) => ({
  categoryId: category.id,
  name: category.name,
  items: createItems(category, index),
}));

const navyTree: OntologyConceptNode[] = [
  {
    id: "navy-overview",
    label: "本体空间总览",
    count: 22,
    children: [
      {
        id: "ship",
        label: "舰船",
        count: 22,
        children: navySections.map(section => ({
          id: `category-${section.categoryId}`,
          label: section.name,
          count: section.items.length,
          targetCategoryId: section.categoryId,
          children: section.items.map(item => ({
            id: `object-${item.id}`,
            label: item.displayName,
            count: 0,
            targetCategoryId: section.categoryId,
            children: [],
          })),
        })),
      },
    ],
  },
];

export const ontologySpaceObjectMock: OntologyObjectWorkspace[] = [
  { spaceId: "navy", tree: navyTree, sections: navySections },
];
