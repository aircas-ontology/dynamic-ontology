# Plan: 去除关联数据源弹框顶栏渐变线

## 需求理解

「关联数据源」弹框标题上方的横向渐变装饰线（`el-dialog__header::before`）需去除。

## 修改范围

- `src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue`
- `tests/data-source-associate-dialog.test.mjs`（断言不再存在该伪元素样式）

## 新增、修改和删除文件

| 操作 | 路径                                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| 修改 | `DataSourceAssociateDialog.vue`：删除 `.el-dialog__header::before` 样式；去掉 header 上仅为该伪元素服务的 `position: relative` |
| 修改 | `tests/data-source-associate-dialog.test.mjs`                                                                                  |
| 新增 | 本 Plan 文件                                                                                                                   |

## 核心实现方式

删除局部 `:global(.property-datasource-mapping-dialog .el-dialog__header::before)` 整段规则；保留弹框其它结构与业务逻辑不变。

## 新增依赖及必要性

无。

## 验证方式

1. TDD：先更新测试确认因未删除而失败，再删除样式并通过。
2. `node --test tests/data-source-associate-dialog.test.mjs`
3. 任务文件 `format:check`
4. 应用代码变更执行 `type-check`、`build:verify`（若有既有失败则区分记录）
