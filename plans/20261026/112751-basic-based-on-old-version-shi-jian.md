# 基础函数基于源版本创建传 basedOnOldVersion

## 需求理解

创建基础函数选了源版本时，POST 传 `basedOnOldVersion: true`，与脚本一致；未选则为 false。编辑 PUT 不传。

## 修改范围

- `FunctionOperatorDraft` 可选 `sourceVersion`
- `submitDraft` 携带源版本
- `saveOperator` 新建分支 `basedOnOldVersion`
- 相关测试

## 新增依赖及必要性

无。

## 验证方式

相关测试、`format:check`、`type-check`、`build:verify`。
