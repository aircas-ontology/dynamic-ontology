# Plan: 新建函数弹框增加源函数/源版本

## 需求理解

基础函数新建弹框在「函数名称」上方增加可选「源函数」「源版本」。源函数用当前列表中的基础函数（展示名称）；源版本暂空列表。

## 修改范围

- `FunctionOperatorFormDialog.vue`
- `FunctionOperatorPanel/index.vue` 传入 `operators`
- 相关测试

## 核心实现方式

新建且 `basic` 时展示；源函数 options 过滤 `type === 'basic'`；源版本 options 为空；不调新接口、不回填模板。

## 新增依赖

无。

## 验证方式

定向测试 + format。
