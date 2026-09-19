import type { ApiResponse, OntologySpaceItem } from "@/types";
import airForceImage from "@/assets/pages/ontologySpaceManagement/images/airForce.webp";
import armyImage from "@/assets/pages/ontologySpaceManagement/images/army.webp";
import environmentImage from "@/assets/pages/ontologySpaceManagement/images/environment.webp";
import navyImage from "@/assets/pages/ontologySpaceManagement/images/navy.webp";
import rocketForceImage from "@/assets/pages/ontologySpaceManagement/images/rocketForce.webp";
import spaceForceImage from "@/assets/pages/ontologySpaceManagement/images/spaceForce.webp";

const ontologySpaces: OntologySpaceItem[] = [
  {
    id: "army",
    apiName: "army_space",
    displayName: "陆军本体空间",
    description: "陆军作战体系相关本体空间",
    iconUrl: armyImage,
    category: "陆军",
    metrics: { ontology: 18, behavior: 12, relation: 36, rule: 124, source: 28 },
    createdTime: "2025-04-12 09:20",
    updatedTime: "2025-05-20 14:18",
    isSubspace: false,
    parentSpaceDisplayName: "",
  },
  {
    id: "navy",
    apiName: "navy_space",
    displayName: "海军本体空间",
    description: "海军作战体系相关本体空间",
    iconUrl: navyImage,
    category: "海军",
    metrics: { ontology: 22, behavior: 15, relation: 48, rule: 168, source: 36 },
    createdTime: "2025-04-15 11:05",
    updatedTime: "2025-05-20 14:08",
    isSubspace: false,
    parentSpaceDisplayName: "",
  },
  {
    id: "air-force",
    apiName: "air_force_space",
    displayName: "空军本体空间",
    description: "空军作战体系相关本体空间",
    iconUrl: airForceImage,
    category: "空军",
    metrics: { ontology: 20, behavior: 12, relation: 40, rule: 112, source: 32 },
    createdTime: "2025-04-18 16:40",
    updatedTime: "2025-05-20 11:45",
    isSubspace: false,
    parentSpaceDisplayName: "",
  },
  {
    id: "rocket-force",
    apiName: "rocket_force_space",
    displayName: "火箭军本体空间",
    description: "火箭军作战体系相关本体空间",
    iconUrl: rocketForceImage,
    category: "火箭军",
    metrics: { ontology: 14, behavior: 11, relation: 28, rule: 118, source: 20 },
    createdTime: "2025-04-22 08:15",
    updatedTime: "2025-05-20 10:21",
    isSubspace: false,
    parentSpaceDisplayName: "",
  },
  {
    id: "space-force",
    apiName: "space_force_space",
    displayName: "太空军本体空间",
    description: "太空军作战体系相关本体空间",
    iconUrl: spaceForceImage,
    category: "太空军",
    metrics: { ontology: 12, behavior: 9, relation: 24, rule: 84, source: 16 },
    createdTime: "2025-05-01 13:28",
    updatedTime: "2025-05-20 09:37",
    isSubspace: false,
    parentSpaceDisplayName: "",
  },
  {
    id: "environment",
    apiName: "environment_space",
    displayName: "环境本体空间",
    description: "环境要素相关本体空间",
    iconUrl: environmentImage,
    category: "环境",
    metrics: { ontology: 20, behavior: 14, relation: 38, rule: 132, source: 26 },
    createdTime: "2025-05-06 10:02",
    updatedTime: "2025-05-20 08:55",
    isSubspace: false,
    parentSpaceDisplayName: "",
  },
];

/** 页面演示/详情与接口失败回退用的本体空间样例（页面模型，非接口契约）。 */
export const ontologySpaceListMock: ApiResponse<OntologySpaceItem[]> = {
  code: 200,
  message: "列表查询成功",
  success: true,
  data: ontologySpaces,
};
