# 脚本函数 Web-IDE 前端界面

## 需求理解

新建脚本函数点下一步打开全屏 Web-IDE（仅前端 UI）：三栏布局 + Monaco 四语言高亮；编排仍提示未开放。

## 修改范围

FunctionOperatorFormDialog、新增 ScriptIdeDialog / ScriptCodeEditor、类型常量、契约测试。

## 新增、修改和删除文件

- 新增：FunctionOperatorScriptIdeDialog.vue、FunctionOperatorScriptCodeEditor.vue
- 修改：FunctionOperatorFormDialog.vue、ontologyFunctionOperatorType.ts、function-operator-workspace.test.mjs

## 核心实现方式

code 校验后打开 fullscreen IDE；Monaco 复用项目 worker 模式；Groovy 复用 Java 词法；测试/保存本地提示。

## 新增依赖及必要性

无。

## 验证方式

契约测试、type-check、format:check。
