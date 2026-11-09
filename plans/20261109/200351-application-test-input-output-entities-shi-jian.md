# 应用行为测试：inputEntities / outputEntities

## 需求理解

请求体改为 `params` + 关系 `entityPrimaryKeys.from/to` + `inputEntities` / `outputEntities`；非 main 的 `mappingIns.storageGroup` 需选子表行写入 `dataPrimaryKeys`。

## 修改范围

- 类型、组装器、收集器、详情映射、BehaviorTestDialog、单测

## 核心实现方式

1. mappingIns / view 行透传 `storageGroup`。
2. 组装器按 ontology 聚合 input/output entities。
3. 弹框非 main 分组拉 page 选 dataPrimaryKey。

## 新增依赖及必要性

无。

## 验证方式

- ontology-space-behavior 单测、format、type-check、build:verify
