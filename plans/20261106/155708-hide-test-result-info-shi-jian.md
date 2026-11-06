# 去掉行为测试 result info 提示

## 需求理解

测试成功后不再弹出 `response.data.result` 的 info（原始 JSON）；保留 success 提示。

## 修改范围

- `BehaviorTestDialog.vue`：删除三处 `ElMessage.info(response.data.result.trim())`

## 新增、修改和删除文件

- 仅修改上述文件

## 核心实现方式

成功路径只保留 `ElMessage.success`。

## 新增依赖

无

## 验证方式

- 相关测试、`format:check`；type-check / build:verify 按需
