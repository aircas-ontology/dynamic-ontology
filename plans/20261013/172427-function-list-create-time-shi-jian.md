# 函数列表展示创建时间

## 需求理解

列表接口 createTime 映射为 createdAt，卡片与表格展示。

## 修改范围

类型、映射、Mock/fixture、FunctionOperatorPanel、测试。

## 新增、修改和删除文件

- 修改：getOntologyFunctionListType、ontologyFunctionOperatorType、mapOntologyFunctionList、index.vue、mock/fixture、createEmptyDraft 等、相关测试

## 核心实现方式

createTime 格式化同 updateTime；卡片展示创建/更新；表格增加创建时间列。

## 新增依赖及必要性

无。

## 验证方式

列表相关测试 + format:check。
