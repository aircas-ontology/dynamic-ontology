# 应用行为测试关系传参改为 entityPrimaryKeys.from/to

## 需求理解

有关系实例选择时不传 linkEntityPrimaryKey，改为 entityPrimaryKeys.from / to。

## 修改范围

- buildApplicationTestRequestParams.ts
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 仅修改上述文件

## 核心实现方式

link 两端写入 entityPrimaryKeys 的 from、to 键；不再设置 linkEntityPrimaryKey。

## 新增依赖

无

## 验证方式

相关单测、format
