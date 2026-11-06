# 应用行为编辑

## 需求理解

列表「编辑」支持 `actionKind=APPLICATION`：详情回填算子、绑定关系、入出参；保存走 `PUT /ontology/action`（body 与创建一致）。

## 修改范围

- `mapOntologyActionInfoToFormState.ts`：清除 unsupported；映射关系与 mappingIns 绑定种子
- `applyApplicationActionInfoBindings.ts`（新建）：按 functionParamId + path/name 匹配扁平行并写入 bindings
- `BehaviorFormDialog.vue`：hydrate 回填
- `useSpaceBehaviorWorkspace.ts`：updateBehavior 远程 PUT
- 测试同步

## 新增、修改和删除文件

- 新增：`applyApplicationActionInfoBindings.ts`
- 修改：上述映射、弹框、composables、测试

## 核心实现方式

- 详情 mappingIns → 绑定种子；函数详情展开行后匹配回填
- 保存复用 `buildApplicationCreateActionParams` + `putEditOntologyActionInterface`

## 新增依赖

无

## 验证方式

- 相关测试、`format:check`、`type-check`、`build:verify`
