# 详情面板操作按钮（基于当前版本）

## 需求理解

详情抽屉输出参数下增加编辑、下线/发布、删除；基于当前选中版本。

## 修改范围

FunctionOperatorDetailDrawer.vue、index.vue、契约测试。

## 新增、修改和删除文件

- 修改：上述文件

## 核心实现方式

抽屉 emit edit/toggle-publish/delete；父级用 selectedOperator 调现有方法。

## 新增依赖及必要性

无。

## 验证方式

契约测试 + format:check。
