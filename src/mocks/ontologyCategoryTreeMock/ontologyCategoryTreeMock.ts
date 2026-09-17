import type { ApiResponse, OntologyCategoryTreeData } from "@/types";

/** 查询本体分类体系树成功响应样例（对齐契约正文与约定 message）。 */
export const ontologyCategoryTreeMock: ApiResponse<OntologyCategoryTreeData> = {
  code: 200,
  message: "查询成功",
  success: true,
  data: {
    categoryId: 1,
    name: "舰船",
    ontologyMetaInfos: [
      {
        uniqueIdentifier: "d3e1b0c27f29452eb7cadd1f51eac535",
        createTime: "2026-09-17 11:15:13",
        updateTime: "2026-09-17 11:15:13",
        latestQueryTime: "2026-09-17 11:15:13",
        displayName: "舰船",
        description: "我方舰船",
        apiName: "ship",
        metaGroupId: [],
        spaceId: 1,
        ontologyCategoryId: 1,
        entityCount: 0,
        relationCount: 1,
        propertyCount: 4,
        actionCount: 0,
      },
      {
        uniqueIdentifier: "17829f55e64e4efba9fdcee03eb46675",
        createTime: "2026-09-17 11:46:31",
        updateTime: "2026-09-17 11:46:31",
        latestQueryTime: "2026-09-17 11:46:31",
        displayName: "舰船1",
        description: "我方舰船",
        apiName: "ship1",
        metaGroupId: [],
        spaceId: 1,
        ontologyCategoryId: 1,
        parentOntologyUniqueIdentifier: "d3e1b0c27f29452eb7cadd1f51eac535",
        parentOntologyDisplayName: "舰船",
        entityCount: 0,
        relationCount: 2,
        propertyCount: 2,
        actionCount: 0,
      },
      {
        uniqueIdentifier: "d58eecff239c4c7f908d9c640a95d68e",
        createTime: "2026-09-16 15:51:55",
        updateTime: "2026-09-16 15:51:55",
        latestQueryTime: "2026-09-16 15:51:55",
        icon: "",
        displayName: "飞机",
        description: "这是一架我方战斗机",
        apiName: "airplane",
        metaGroupId: [],
        spaceId: 1,
        ontologyCategoryId: 1,
        entityCount: 0,
        relationCount: 1,
        propertyCount: 6,
        actionCount: 0,
      },
    ],
    children: [
      {
        categoryId: 2,
        name: "航空母舰",
        children: [
          {
            categoryId: 3,
            name: "航空母舰",
            children: [
              {
                categoryId: 4,
              },
            ],
          },
        ],
      },
    ],
  },
};
