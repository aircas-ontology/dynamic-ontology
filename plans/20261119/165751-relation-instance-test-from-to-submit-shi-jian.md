# 关系实例测试按 From/To 提交

## 需求理解

关系实例测试不依赖 relationMountSide；From → entityPrimaryKey，To → linkEntityPrimaryKey。

## 修改范围

BehaviorTestDialog.vue 关系实例提交与相关详情取值；测试断言。

## 新增、修改和删除文件

- 修改：BehaviorTestDialog.vue、相关测试
- 无新依赖

## 核心实现方式

提交取 selectedFrom/To 首条；提示用对象名；详情主键用 From。

## 新增依赖及必要性

无。

## 验证方式

相关测试、format、type-check、build:verify。
