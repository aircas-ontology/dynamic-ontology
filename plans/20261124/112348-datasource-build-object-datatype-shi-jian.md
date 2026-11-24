# Plan：数据源构建对象提交增加 dataType

## 需求理解

数据源构建对象向导第四步点击「创建」时，`tables[].columns[]` 需携带页面「数据类型」列的值（如 `Int` / `String`），请求字段名为 `dataType`。

## 修改范围

- 类型：`BuildObjectFromDatasourceSelectedColumn` 增加必填 `dataType: string`
- 映射：`createOntologyObjectFromDatasource` 将 `field.dataType` 写入 column
- 文档：`docs/20261103/1.buildObjectApi.md` 同步示例与字段说明
- 测试：`tests/datasource-create-error.test.mjs` 断言 payload 含 `dataType`

## 新增、修改和删除文件

| 操作 | 路径                                                                            |
| ---- | ------------------------------------------------------------------------------- |
| 修改 | `src/types/apis/buildObjectFromDatasourceType.ts`                               |
| 修改 | `src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts` |
| 修改 | `docs/20261103/1.buildObjectApi.md`                                             |
| 修改 | `tests/datasource-create-error.test.mjs`                                        |
| 新增 | 本 Plan 文件                                                                    |

## 核心实现方式

在现有 column 映射中追加：

```ts
dataType: field.dataType;
```

取值即为向导「数据类型」列展示的本体类型（`ontologyDataType || nativeType` 已在字段步骤写入 `field.dataType`）。不改弹窗 UI。

## 新增依赖及必要性

无。

## 验证方式

1. TDD：先更新测试期望 `dataType`，确认失败；再改类型与映射，确认通过。
2. `npm test`、`npm run test:coverage`
3. `npm run type-check`、`npm run build:verify`
4. `npm run format:check -- <本任务修改文件列表>`
