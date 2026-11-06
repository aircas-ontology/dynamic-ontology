# 基础函数测试结果 textarea 展示

## 需求理解

基础函数算子「开始测试」成功后，将接口 `data` 用只读 textarea 展示在提示文案下方。

## 修改范围

- `BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改上述文件

## 核心实现方式

- 基础函数测试模式展示 readonly textarea
- 成功后写入 `JSON.stringify(response.data, null, 2)`
- 打开/关闭弹框清空

## 新增依赖

无

## 验证方式

- 相关测试、`format:check`；type-check / build:verify
