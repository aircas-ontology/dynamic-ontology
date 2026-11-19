# 基础函数写入字段改为可选

## 需求理解

基础函数行为（单对象 QUERY / 多对象 AGGREGATE）的「写入字段」均为可选：可清空、可不填；前端不再因未填而拦截保存。有完整对象+属性时仍按现有规则组装 `writeBack`，全空则不传。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `src/views/SpaceBehaviorWorkspace/utils/buildBasicFunctionCreateActionParams.ts`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改：上述三文件
- 无新增依赖

## 核心实现方式

1. 删除对话框保存前两处「请完善写入字段」必填拦截
2. 写入字段四个 `el-select` 增加 `clearable`
3. `buildQueryWriteBack` / `buildAggregateWriteBack`：空或半填跳过，不报错；仅完整 binding 组装 writeBack；QUERY 去掉必须填满全部展示字段

## 新增依赖及必要性

无

## 验证方式

- 更新/补充 `ontology-space-behavior` 测试后实现
- `npm test`（触及）、`format:check`、`type-check`、`build:verify`
