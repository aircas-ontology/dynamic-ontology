# listAction updateTime 对接更新时间

## 需求理解

`GET /ontology/action/list` 记录新增 `updateTime`，映射到行为列表「更新时间」列（`SpaceBehaviorItem.updatedAt`）。

## 修改范围

- 类型：`listOntologyActionType.ts`
- 映射：`mapListOntologyActionRecord.ts`
- Mock：`action.list.get.json`
- 测试：`ontology-space-behavior.test.mjs`、`list-ontology-action-api.test.mjs`

## 新增、修改和删除文件

- 修改上述文件；无新增/删除业务文件

## 核心实现方式

- `ListOntologyActionRecord` 增加 `updateTime?: string | null`
- `updatedAt = record.updateTime?.trim() || "-"`
- Mock 样例补 `updateTime`

## 新增依赖

无

## 验证方式

- 相关测试、`format:check`、`type-check`、`build:verify`
