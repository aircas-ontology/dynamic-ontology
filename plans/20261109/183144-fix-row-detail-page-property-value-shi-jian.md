# 修复 row_detail/page 属性值展示

## 需求理解

真实返回使用 `propertyValue`、`propertyDisplayName`；当前读 `propertyValues` 导致属性值列空白。

## 修改范围

- 类型、适配器、Mock/fixture、文档 Schema、单测

## 核心实现方式

对齐真实字段；适配时写入 `propertyValue`，展示名优先 `propertyDisplayName`。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- format / type-check / build:verify
