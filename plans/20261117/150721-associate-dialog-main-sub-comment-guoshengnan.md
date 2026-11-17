# 关联数据源弹窗：主/子表 + 字段 comment

## 需求理解

- 「关联数据源」弹窗左侧画布表徽章体现主表 / 子表。
- 主子表用对象属性的 `storageGroup` 反推：`main`/空 → 主表，其余 → 子表。
- 字段列表增加 comment，来源为列接口现有 `description`；`dataType` 仅用 `type`。

## 修改范围

- 仅关联数据源弹窗链路（`OntologyObjectAttributePanel`）。
- 不改数据源构建弹窗；不触碰无关脏文件与受保护目录。

## 新增、修改和删除文件

| 操作 | 路径                                                                              |
| ---- | --------------------------------------------------------------------------------- |
| 新增 | `src/views/OntologyObjectAttributePanel/utils/resolveDatasourceTableRole.ts`      |
| 修改 | `src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue` |
| 修改 | `src/views/OntologyObjectAttributePanel/index.vue`                                |
| 修改 | `tests/data-source-associate-dialog.test.mjs`（及必要时新增反推纯函数测试）       |

## 核心实现方式

1. 属性映射透传 `storageGroup`。
2. `mapDatasourceColumns`：`comment` ← `description`；`dataType` ← `type`（不再用 description 兜底）。
3. `resolveDatasourceTableRole`：已绑定按属性 storageGroup；未绑定用表名匹配非 main 存储分组 → 子表，对象存在 main/空分组 → 主表，否则「表」。
4. 左侧徽章展示角色；字段表增加「说明」列。

## 新增依赖及必要性

无。

## 验证方式

1. TDD：先写反推与 comment 映射测试（RED）再实现（GREEN）。
2. `npm test -- tests/data-source-associate-dialog.test.mjs`（及相关）。
3. `npm run test:coverage`（任务相关覆盖）。
4. `npm run type-check`、`npm run build:verify`。
5. `npm run format` / `format:check` 仅限本任务文件。
