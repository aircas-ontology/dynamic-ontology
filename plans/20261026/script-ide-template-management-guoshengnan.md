# 脚本函数 Web-IDE 模板管理

## 需求理解

在函数算子的脚本函数 Web-IDE 全屏弹窗右上角增加“模板管理”按钮，打开右侧抽屉，支持模板查询、查看、新增、编辑和删除。模板必须区分语言类型，新增、编辑、查看均使用现有 Monaco 代码编辑器。

## 修改范围

- 在脚本函数 Web-IDE 头部增加模板管理入口。
- 新增页面私有模板管理抽屉和模板表单/查看组件。
- 复用现有脚本语言选项、`FunctionOperatorScriptCodeEditor`、Aircas 主题变量和 Element Plus 组件。
- 模板数据使用页面内存状态，不新增后端依赖。

## 文件

- 修改 `src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue`。
- 新增 `src/views/FunctionOperatorPanel/components/FunctionOperatorTemplateDrawer.vue`。
- 新增 `src/views/FunctionOperatorPanel/components/FunctionOperatorTemplateFormDialog.vue`。
- 按实现需要新增或修改测试文件。

## 核心实现方式

模板记录包含 id、名称、语言、描述、代码和更新时间。抽屉提供搜索、语言筛选和操作菜单；新增/编辑表单校验名称、语言和代码，查看模式只读；保存、删除均防止重复操作并提供反馈。打开模板时可将代码和语言回填 Web-IDE 草稿。

## 新增依赖

无。

## 验证方式

运行相关测试及 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`、`npm run check:project-conventions`，并对本次文件执行格式检查。
