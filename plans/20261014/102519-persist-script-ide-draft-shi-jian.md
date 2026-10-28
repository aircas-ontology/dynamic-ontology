# 脚本 IDE 返回上一步保留代码

## 需求理解

返回上一步保留 IDE 代码；关闭新建弹框才清空。

## 修改范围

FormDialog、ScriptIdeDialog、契约测试。

## 新增、修改和删除文件

- 修改：FunctionOperatorFormDialog.vue、FunctionOperatorScriptIdeDialog.vue、function-operator-workspace.test.mjs

## 核心实现方式

父组件持有 scriptDraft*；IDE 受控；关窗与离开 code 类型时重置。

## 新增依赖及必要性

无。

## 验证方式

契约测试 + format:check。
