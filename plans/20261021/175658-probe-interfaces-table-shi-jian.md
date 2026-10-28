# 探查接口列表表格展示

## 需求理解

探查成功后用多选可展开表格展示接口列表；展开行内子表展示入参/出参；本阶段选中仅本地保存。

## 修改范围

- 探查类型/Mock/fixture；functionApi JSDoc；FormDialog；相关测试

## 核心实现方式

1. `ProbeOntologyFunctionContainerInterfacesData` 改为接口数组及参数结构
2. Mock/fixture 对齐文档 getEcho/postEcho 样例
3. 「已发现接口」el-table：selection + expand + name/method/path/description；展开行入参/出参只读子表

## 新增依赖及必要性

无。

## 验证方式

相关 `npm test`、`format:check`、`check:types-conventions`、`type-check`（过滤）、`build:verify`
