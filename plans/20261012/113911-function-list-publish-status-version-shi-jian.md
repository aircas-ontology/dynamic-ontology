# Plan: 函数列表展示发布状态与版本号

## 需求理解

查询函数列表接口新增 `publishStatus`（0 未发布 / 1 已发布）与 `version`（x.y.z）。函数列表卡片与表格需展示这两项。

## 修改范围

- API 类型、列表映射、页面 Mock、HTTP Mock fixture、相关测试。
- 列表 UI 已有「版本」「状态」列/卡片位，无需改模板结构。
- 发布状态文案沿用现有 `草稿` / `已发布`（0 → draft，1 → published）。

## 新增、修改和删除文件

| 操作 | 路径                                                                   |
| ---- | ---------------------------------------------------------------------- |
| 修改 | `src/types/apis/getOntologyFunctionListType.ts`                        |
| 修改 | `src/utils/mapOntologyFunctionList.ts`                                 |
| 修改 | `src/mocks/getOntologyFunctionListMock/getOntologyFunctionListMock.ts` |
| 修改 | `src/mockData/fixtures/ontology/function/list.get.json`                |
| 修改 | `tests/get-ontology-function-list-api.test.mjs`                        |
| 新增 | 本 Plan 文件                                                           |

## 核心实现方式

1. `GetOntologyFunctionListItem` 增加 `publishStatus`、`version`。
2. `mapOntologyFunctionListItem`：写入 `version`；`publishStatus === 1` → `published`，`=== 0` → `draft`，其它 → `""`。
3. Mock / fixture 与文档样例对齐。

## 新增依赖及必要性

无。

## 验证方式

1. TDD：先更新测试确认失败，再实现并通过。
2. `node --test tests/get-ontology-function-list-api.test.mjs`
3. `npm run check:types-conventions`
4. `npm run type-check`、`npm run build:verify`
5. 任务文件 `format:check`
