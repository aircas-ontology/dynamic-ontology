# 基础函数算子测试可选 entityPrimaryKey

## 需求理解

基础行为-基础函数算子测试请求增加非必填 `entityPrimaryKey`；弹框增加按 `ontologyUniqIdentifier` 加载的可选实体列表；无选中则不传该字段。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `src/types/apis/testOntologyActionType.ts`
- `tests/ontology-space-behavior.test.mjs`
- 本 Plan

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除

## 核心实现方式

1. 复用实体分页列表与单选；标题标注「可选」；再次点击可取消
2. 打开时有对象标识则 `loadEntityList`
3. 提交有选中才带 `entityPrimaryKey`
4. 更新类型 JSDoc 与单测

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
