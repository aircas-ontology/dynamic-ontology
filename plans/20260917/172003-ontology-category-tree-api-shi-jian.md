# Plan：对接本体分类体系树（仅左树）

确认范围（用户 2026-09-17「按照暂定假设修改」）。

## 需求理解

按 `docs/20260917/getOntologyCategoryTreeApi-shijian.md` 生成 API/Types/Mock，并映射到对象页概念层级树；右侧 sections 仍为空。

## 契约映射

| 契约 | 实现 |
| --- | --- |
| GET `ONTOLOGYMANAGE_URL` + `/ontology`，`params.spaceId` | `getOntologyCategoryTreeInterface` → `ontologyManageApi.ts` |
| Params / Data / 嵌套节点与 meta | `src/types/apis/ontologyCategoryTreeType.ts` + `types/index.ts` |
| 成功样例 Mock，`message: 查询成功`，`success: true` | `src/mocks/ontologyCategoryTreeMock/ontologyCategoryTreeMock.ts` |
| `data` 单根 → `OntologyConceptNode[]` | 详情页 `utils/mapOntologyCategoryTree.ts`：`id=String(categoryId)`，`label=name??""`，`count=ontologyMetaInfos?.length??0`，`targetCategoryId=String(categoryId)` |
| 对象页加载 | `useOntologyObjectWorkspace` 调接口；`code===200` 映射树；失败 error；无 spaceId 空壳 |

## 新增依赖

无。

## 验证方式

TDD + 相关测试 / `check:types-conventions` / `type-check` / `build:verify`
