# 函数算子代码模板管理接口对接

## 需求理解

将函数算子代码模板管理抽屉从本地内存数据切换为真实接口，支持模板查询、新增、编辑和删除。

## 修改范围

- 新增函数算子模板 API 类型与接口文件。
- 更新 `src/apis/index.ts`、`src/types/index.ts`。
- 更新 `FunctionOperatorTemplateDrawer.vue` 的查询和命令流程。
- 复用真实后端接口；本次不新增 Mock fixture，避免将未提供的模板数据写入本地 Mock。

## 核心实现方式

使用 `FunctionOperatorTemplateParam` 和 `FunctionOperatorTemplate` 契约；页面内部继续使用小写语言枚举，通过请求映射转换为服务端大写枚举。抽屉打开时查询列表，保存时按新增或编辑调用 POST/PUT，删除时调用 DELETE；成功后刷新列表，失败保留当前数据并提示错误。

## 新增依赖

无。

## 验证方式

执行现有测试、类型检查、构建验证、格式检查和 Git diff 检查；记录与本次无关的既有失败。
