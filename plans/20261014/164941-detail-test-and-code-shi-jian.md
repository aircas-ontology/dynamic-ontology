# 详情抽屉：测试按钮与脚本 code

## 需求理解

详情抽屉增加测试按钮（测选中版本）；脚本函数展示 definition.code。

## 修改范围

FunctionOperatorDetailDrawer、index、契约测试。

## 新增、修改和删除文件

- 修改：DetailDrawer、index、get-ontology-function-detail-api.test.mjs

## 核心实现方式

emit test → openTest(selectedOperator)；kind===code 展示只读 code。

## 新增依赖及必要性

无。

## 验证方式

契约测试 + format:check。
