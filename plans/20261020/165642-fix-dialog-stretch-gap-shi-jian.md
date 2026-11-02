# 修复函数算子弹框底部留白

## 需求理解

align-center 下弹框被拉满视口，footer 下方留白。需贴合内容高度，保留 max-height。

## 修改范围

- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue` 弹框样式

## 新增、修改和删除文件

### 修改

- 上述样式：`align-self: center`、`margin: auto`，去掉 5vh 顶底边距

### 新增 / 删除

- 无源码新增或删除（仅本 Plan 历史文件）

## 核心实现方式

抵消 overlay `display:flex` 默认 stretch；恢复 EP 居中 margin。

## 新增依赖及必要性

无。

## 验证方式

`npm run format:check -- <本次修改文件>`；人工确认短表单无底空白。
