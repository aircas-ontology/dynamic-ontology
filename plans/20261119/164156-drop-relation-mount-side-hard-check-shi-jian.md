# 取消关系测试挂载侧匹配硬拦截

## 需求理解

关系实例测试加载时取消「挂载对象必须匹配关系两端」硬拦截；匹配不上时挂载侧置空并继续加载两端实例。

## 修改范围

`src/composables/behavior/useBehaviorParameters.ts` 的 `loadRelationTestContext`；相关测试断言。

## 新增、修改和删除文件

- 修改：`useBehaviorParameters.ts`、相关测试
- 无新依赖

## 核心实现方式

对齐 `loadApplicationLinkContext`：不匹配时 `relationMountSide = ""`，不再 throw。

## 新增依赖及必要性

无。

## 验证方式

相关测试、`format:check`、`type-check`、`build:verify`。
