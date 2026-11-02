# 保存脚本函数前要求已解析，并提交解析参数

## 需求理解

点击脚本 IDE 保存时，若当前代码尚未成功解析，或解析后又改过代码，提示先执行解析，不发起保存。已解析时，把解析得到的参数（含多级 `fields`）放进创建/修改请求的 `parameters`。

## 修改范围

- 保存组装不再使用前端 `name - type` 标签。
- 创建参数类型补上 `paramOrder`、`referenceType`、递归 `fields`，`paramType` 改为字符串以保留接口返回的 DOUBLE、LIST、BOOL 等值。
- 不新增依赖，不改 `public/`、`html/`。

## 新增、修改和删除文件

- 修改：`src/types/apis/createOntologyFunctionType.ts`
- 修改：`src/views/FunctionOperatorPanel/utils/buildCreateOntologyScriptFunctionParams.ts`
- 修改：`src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue`
- 修改：`tests/build-create-ontology-script-function-params.test.mjs`
- 修改：`tests/function-operator-workspace.test.mjs`

## 核心实现方式

- `parseLocked` 仅在当前代码与语言都等于上次成功解析时为真。
- 未锁定时 `ElMessage.warning("请先执行解析")` 并返回。
- 保存参数为输入树与输出树按顺序拼接，字段原样传递。

## 新增依赖及必要性

无。

## 验证方式

- 先更新测试确认失败，再实现并通过相关测试。
- `npm run type-check`、`npm run build:verify`、`npm run check:types-conventions`、本次文件 `format:check`。
- 浏览器因登录服务不可用，无法进入脚本 IDE。
