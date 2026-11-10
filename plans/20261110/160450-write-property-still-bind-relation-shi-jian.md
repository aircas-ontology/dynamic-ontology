# 写入对象属性时仍可绑定关系

## 需求理解

应用行为创建与修改时，即使出参选择了「写入对象属性」（`WRITE_PROPERTY`），仍应可绑定关系（保持可选、非必填）。这与既有 Plan `plans/20261106/163814`「有 WRITE_PROPERTY 则隐藏绑定关系」相反，按本次明确要求调整。

## 修改范围

- `BehaviorFormDialog.vue`：`showApplicationRelationSection` 仅判断 `kind === "application"`；删除 `hasApplicationWritePropertyOutput`
- `tests/ontology-space-behavior.test.mjs`：更新相关断言
- Plan 保存 `plans/20261110/`

## 新增、修改和删除文件

- 修改：上述表单与单测
- 新增：本 Plan 文件
- 删除：无

## 核心实现方式

`showApplicationRelationSection = kind === "application"`；绑定关系始终可选；有关系 id 才带 `linkMapping`（既有组装逻辑不变）。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`（既有无关失败单独注明）
