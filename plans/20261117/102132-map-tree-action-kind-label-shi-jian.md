# TREE 行为类别映射为行为树

## 需求理解

详情面板 `actionKind=TREE` 展示为「行为树」。

## 修改范围

- `mapOntologyActionInfoToViewState.ts`：`mapActionKindLabel` 增加 TREE
- 相关单测断言

## 新增、修改和删除文件

- 修改：上述文件与测试
- 无新增/删除

## 核心实现方式

与列表口径一致：TREE → 行为树。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测 + format:check
