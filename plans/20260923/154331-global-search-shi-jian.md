# Plan：全文检索（全局搜索）

## 需求理解

全文检索页与 Header banner 搜索框能力一致：调用全局检索接口展示结果，点击按类型路由跳转。本期仅实现「空间→overview」「对象→object」。

## 已确认决策

1. API 放在 `src/apis/ontologySearchApi.ts`（不写入 ontologyDocApi）。
2. Header 结果用下拉浮层展示。

## 修改范围

- 类型 / API / Mock / 转导出
- 共享 composable + 公共检索组件（输入 + 结果列表/浮层）
- FullTextSearch 页、HeaderBar 接入
- 测试

## 新增 / 修改文件

| 路径                                                             | 动作                       |
| ---------------------------------------------------------------- | -------------------------- |
| `src/types/apis/ontologyGlobalSearchType.ts`                     | 新增                       |
| `src/types/index.ts`                                             | 转导出                     |
| `src/apis/ontologySearchApi.ts`                                  | 新增 POST `/search/global` |
| `src/apis/index.ts`                                              | 转导出                     |
| `src/mocks/ontologyGlobalSearchMock/ontologyGlobalSearchMock.ts` | 契约样例                   |
| `src/composables/ontology/useOntologyGlobalSearch.ts`            | 检索状态与跳转             |
| `src/utils/ontologyGlobalSearchRoute.ts`                         | 路由解析                   |
| `src/components/OntologyGlobalSearchField.vue`                   | 输入 + 浮层/内嵌结果       |
| `src/components/register.ts`                                     | 注册组件                   |
| `src/views/FullTextSearch/index.vue`                             | 接入                       |
| `src/layout/components/HeaderBar.vue`                            | 启用并接入浮层             |
| `tests/ontology-global-search.test.mjs`                          | 新增                       |
| `tests/full-text-search.test.mjs`                                | 更新                       |

## 核心实现方式

1. 契约：`POST ONTOLOGYMANAGE_URL/search/global`，body `{ keyword, sizs? }`，data 为数组。
2. 共享 composable 处理 loading/success/empty/error 与防过期。
3. 组件 `placement=overlay|page`：Header 用 overlay 浮层，全文检索页用 page 内嵌列表。
4. 跳转：空间→Overview 命名路由；对象→Object 命名路由；其它类型不跳转。

## 新增依赖

无。

## 验证方式

- `node --test tests/ontology-global-search.test.mjs tests/full-text-search.test.mjs`
- `npm run check:types-conventions`、`format:check`、`type-check`、`build:verify`
