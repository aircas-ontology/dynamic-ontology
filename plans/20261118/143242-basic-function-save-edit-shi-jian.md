# Plan：基础函数行为保存/编辑对接

## 需求理解

按 createActionApi §3.4 对接 BASIC_FUNCTION 创建/编辑；确认点：有聚合=AGGREGATE/无=QUERY；多对象仅聚合；filters 不传 dataType 且去掉行为侧类型下拉；空过滤省略 filters；详情 basicFunction 同构回填。

## 修改范围

类型、builder、draft、表单提交/回显、workspace 创建更新、过滤组件 prop、测试。

## 新增依赖

无

## 验证方式

`node --test tests/ontology-space-behavior.test.mjs tests/basic-filter-op-options.test.mjs`；format:check
