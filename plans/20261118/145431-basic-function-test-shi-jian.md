# Plan：基础函数行为测试对接

## 需求理解

测试时单对象可选/可不选实例；多对象不选实例，仅传 spaceId + actionApi。

## 修改范围

BehaviorTestDialog.vue + ontology-space-behavior 测试断言。

## 核心实现方式

打开时拉详情取 basicFunction.ontologyIdentifiers；单对象展示可选实例并按该 id 加载实体；多对象隐藏实例区。

## 新增依赖

无

## 验证方式

相关单测 + format:check
