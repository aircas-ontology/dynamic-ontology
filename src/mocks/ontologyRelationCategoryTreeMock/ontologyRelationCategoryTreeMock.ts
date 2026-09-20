import type { ApiResponse, OntologyRelationCategoryTreeData } from "@/types";

/** 查询空间关系分类体系树成功样例（与契约输出样例一致）。 */
export const ontologyRelationCategoryTreeMock: ApiResponse<OntologyRelationCategoryTreeData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    categoryId: 1,
    name: "全部关系1",
    links: [
      {
        uniqueIdentifier: "4fcd1a4cb21244898ee0497b6e529625",
        name: "a",
        type: "COMPOSITION",
        categoryId: 1,
        ontologyUniqueIdentifierFrom: "d7749eaded274a8f98fa0ac78032d3d0",
        ontologyNameFrom: "舰船2",
        ontologyUniqueIdentifierTo: "17829f55e64e4efba9fdcee03eb46675",
        ontologyNameTo: "舰船1",
      },
    ],
    children: [
      {
        categoryId: 2,
        name: "编制隶书",
        children: [
          {
            categoryId: 3,
            name: "指挥控制",
          },
        ],
      },
    ],
  },
};

/** 创建空间关系分类体系树成功样例（与契约输出样例一致）。 */
export const createOntologyRelationCategoryTreeMock: ApiResponse<undefined> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: undefined,
};

/** 修改空间关系分类名称成功样例（与契约输出样例一致）。 */
export const updateOntologyRelationCategoryNameMock: ApiResponse<undefined> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: undefined,
};

/** 删除空间关系分类成功样例（与契约输出样例一致）。 */
export const deleteOntologyRelationCategoryTreeMock: ApiResponse<undefined> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: undefined,
};
