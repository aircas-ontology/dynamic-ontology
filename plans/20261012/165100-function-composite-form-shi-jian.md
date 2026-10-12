# Plan: 函数编排表单（红框）

## 需求理解

选择「函数编排」时展示截图红框通用配置表单（源函数/源版本、函数名称、API名称、版本号、调用协议、函数说明）；源函数与源版本列表暂时留空；页脚为「下一步」（校验通过后提示后续步骤暂未开放，不真正提交创建）。

## 修改范围

- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `src/types/pages/ontologyFunctionOperatorType.ts`（编排类型描述文案）
- `tests/function-operator-workspace.test.mjs`

## 新增、修改和删除文件

- 修改：上述三个文件
- 新增 / 删除：无

## 核心实现方式

1. `form.type === 'composite'` 时渲染编排专用表单区；基础函数表单保持不变。
2. `compositeSourceOptions` / `sourceVersionOptions` 返回空数组；接口接入前不下拉数据。
3. 调用协议使用既有 `FunctionOperatorProtocol`：`HTTP`。
4. 编排校验：名称、API名称、版本号、协议、函数说明必填；基础函数校验文案与规则保持原样。
5. 页脚编排显示「下一步」→ `goCompositeNextStep` 校验后 `ElMessage.info` 提示暂未开放。
6. 类型选项中「函数编排」描述改为「通过编排多个函数构建复杂流程」。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/function-operator-workspace.test.mjs`
- `npm run format -- <任务文件>` + `format:check`
- `npm run type-check`、`npm run build:verify`（应用代码变更）
