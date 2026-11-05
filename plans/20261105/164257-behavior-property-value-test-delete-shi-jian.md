# 属性值-删除测试（与编辑同流程）

## 需求理解

删除测试交互与编辑一致（选实体、按 storageGroup 选数据行、展示测试参数区）；提交按契约只传 `ontologySpaceId`、`actionApi`、`entityPrimaryKey`、`dataPrimaryKey`，不传 `params`。

## 修改范围

- 扩展 `BehaviorTestDialog` 支持 `basicAction=delete`
- 更新相关测试断言

## 新增、修改和删除文件

### 新增

- `plans/20261105/164257-behavior-property-value-test-delete-shi-jian.md`

### 修改

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

### 删除

无

## 核心实现方式

1. `needsDataRowSelection = update | delete` 控制数据行区与加载逻辑。
2. 删除提交省略 `params`；编辑/新增仍传 `params`。
3. 提示文案覆盖新增/编辑/删除。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <任务文件>`
