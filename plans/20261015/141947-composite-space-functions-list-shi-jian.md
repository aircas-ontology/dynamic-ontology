# 编排画布：当前空间函数列表接 list 接口

## 需求理解

左侧当前空间函数改为 CUSTOMIZE list 接口拉取。

## 修改范围

CompositeWorkflowDialog、FormDialog、契约测试。

## 新增、修改和删除文件

- 修改：上述文件

## 核心实现方式

打开弹框请求 list；本地搜索；loading/empty/error。

## 新增依赖及必要性

无。

## 验证方式

契约测试 + format:check。
