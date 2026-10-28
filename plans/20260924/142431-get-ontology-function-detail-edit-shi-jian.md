# Plan：函数算子编辑回显（getFunInfo）

确认范围（用户 2026-09-24「确认」）。

## 需求理解

点击编辑打开与新建基础函数同结构弹框；先调详情接口回填表单。本期不做更新保存接口。

## 契约冲突处理（已确认）

1. Mock `message` 用 `SUCCESS`
2. Mock 补 `success: true`
3. GET query `functionApi`
4. 回显优先 `queryConfig`；`data.code` 保留为 string

## 修改范围

- Types / API / Mock / barrel
- `functionOperatorBasicFilter` 反向映射
- `openEdit` 拉详情后打开弹框
- 相关单测

## 新增依赖

无。

## 验证方式

相关单测、format、types-conventions、type-check、build:verify
