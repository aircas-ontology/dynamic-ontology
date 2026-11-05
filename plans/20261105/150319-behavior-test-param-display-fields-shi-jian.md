# 测试弹窗同步展示 mappingIns.displayName / propertyType

## 需求理解

行为详情 `mappingIns` 新增属性名称 `displayName`、属性类型 `propertyType`。测试弹窗展示这两项；`params` 仍以 `parameterName` 为 key。

## 修改范围

- 扩展详情 mapping 类型与 view 映射字段
- 测试弹窗参数表列改为属性名称 / 类型
- 更新相关测试断言

## 新增、修改和删除文件

### 新增

- `plans/20261105/150319-behavior-test-param-display-fields-shi-jian.md`

### 修改

- `src/types/apis/getOntologyActionInfoType.ts`
- `src/views/SpaceBehaviorWorkspace/utils/mapOntologyActionInfoToViewState.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

### 删除

无

## 核心实现方式

1. `GetOntologyActionInfoMappingIn` 增加可选 `displayName`、`propertyType`。
2. view 行增加 `propertyDisplayName`、`propertyType`；`paramType` 优先 `propertyType`，再回退函数参数类型。
3. 测试弹窗列：属性名称（displayName，空回退 parameterName）、类型（propertyType）；输入与提交仍用 parameterName。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <任务文件>`
