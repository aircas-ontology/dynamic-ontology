# Basic function operator behavior form

## 需求理解

`valueType=basicFunctionOperator` 时右侧改为「函数基础算子」下拉（本空间 BASIC_QUERY）；选中后展示参数配置（选择对象 + 参数绑定属性 apiName）。本轮不对接 createAction。

## 修改范围

- 草稿：`functionOperatorVersion`、`operatorParamBindings`
- `BehaviorFormDialog.vue`：显隐、详情与属性加载、校验
- ObjectBehavior 默认草稿与测试

## 新增依赖

无

## 验证方式

相关测试 + format:check
