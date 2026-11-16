# 去掉执行面板顶部提示文案

## 需求理解

去除「执行 / 日志」工具栏下方红框中的固定说明与 idle 提示。

## 修改范围

- `src/components/BehaviorTreeExecPanel.vue`：删除两段提示；保留 loading / error / empty

## 新增、修改和删除文件

- 修改：上述文件及必要时测试
- 无新增/删除

## 核心实现方式

仅移除展示文案，不改按钮与读取逻辑。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测 + format:check
