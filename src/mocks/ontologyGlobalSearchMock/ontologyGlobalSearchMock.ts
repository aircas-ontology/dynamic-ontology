import type { ApiResponse, OntologyGlobalSearchData } from "@/types";

/** 全局检索成功样例（与契约输出样例一致，并补齐对象/属性直跳字段）。 */
export const ontologyGlobalSearchMock: ApiResponse<OntologyGlobalSearchData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: [
    {
      name: "sj测试",
      type: "空间",
      desc: "测试空间",
      spaceId: 37,
    },
    {
      name: "测试本体对象-修改",
      type: "对象",
      desc: "这是修改后的本体描述",
      spaceId: 11,
      spaceName: "测试空间",
      uniqueIdentifier: "ae6cca59ced9432189da4af315554957",
      objectId: 9,
    },
    {
      name: "飞机id",
      type: "属性",
      desc: "飞机id",
      spaceId: 46,
      spaceName: "测试-rwl",
      ontologyName: "飞机",
      ontologyUniqueIdentifier: "246ef68e87524c33911b92af900700f9",
      objectId: 106,
      propertyId: 243,
    },
    {
      name: "轰-6K中程轰炸机",
      type: "实例",
      desc: "轰-6K中程轰炸机 PL-204 204",
      spaceId: 1,
      objectId: 1,
      instanceId: "space_a.airplane.d58eecff239c4c7f908d9c640a95d68e.204",
    },
    {
      name: "a",
      type: "关系分组",
      spaceId: 11,
      spaceName: "测试空间",
    },
  ],
};
