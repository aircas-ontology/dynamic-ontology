# 详情抽屉版本切换与发布状态

## 需求理解

版本下拉切换后展示该版本详情；函数类型右侧展示发布状态。

## 修改范围

mapOntologyFunctionDetail、useFunctionOperatorWorkspace、DetailDrawer、index、测试。

## 新增、修改和删除文件

- 修改：上述文件；必要时抽出 publishStatus 映射 util

## 核心实现方式

openDetail 拉 versions；changeDetailVersion 重拉详情；映射 publishStatus→status；抽屉类型+状态+版本 select。

## 新增依赖及必要性

无。

## 验证方式

契约测试 + format:check。
