# 修复添加关系分类默认显示 1

## 需求理解

「添加关系」弹框在选中根分类「全部关系」时，分类字段显示裸值 `1`，应显示占位符「请选择关系分类」。

## 修改范围

- 修改：`src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationFormDialog.vue`
- 修改：`tests/ontology-space-relation.test.mjs`
- 不新增依赖；不改接口/类型/mock

## 核心实现方式

create 初始化时：仅当 `defaultCategoryId` 能在 `categoryOptions`（根下子树）中找到时才预填；否则置 `""`。

- 选中根（id `1` / `relation-all`）→ 空，显示占位符
- 选中子分类 → 仍预填
- `categoryOptions` 为空时保留 `allowRootCategory` 分支

## 新增依赖

无

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-relation.test.mjs`
- `npm run type-check`
- `npm run format:check --` 任务相关文件
