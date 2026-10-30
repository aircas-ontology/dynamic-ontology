# 编排保存后保持弹框

## 需求理解

新建与编辑函数编排时，点击「保存」成功后：工作流弹框与上层表单均保持打开，仅提示成功并可继续编辑/再保存。

## 修改范围

- `useFunctionOperatorWorkspace.ts` 中 `saveCompositeOperator`
- `tests/function-operator-workspace.test.mjs`

不改弹框 UI、不改接口契约。

## 新增、修改和删除文件

**修改**

- `src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts`
- `tests/function-operator-workspace.test.mjs`

## 核心实现方式

对齐 `saveScriptOperator`：新增 composite 的 operator/draft 组装函数；保存成功后回填编辑态且不关闭 `formVisible`。

## 新增依赖

无。

## 验证方式

相关测试、`format:check`、`type-check`、`build:verify`。
