# 函数算子弹框高度随内容自适应

## 需求理解

编辑/新建函数算子弹框在内容较少时出现大块空白。保留 max-height；未达上限时高度随内容收缩。

## 修改范围

- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue` 弹框样式

## 新增、修改和删除文件

### 修改

- 上述 Vue 文件非 scoped 弹框样式

### 新增 / 删除

- 无源码新增或删除（仅本 Plan 历史文件）

## 核心实现方式

弹框 `height: auto` + `max-height: 80vh`；`.el-dialog__body` 改为 `flex: 0 1 auto`，避免撑满留白。

## 新增依赖及必要性

无。

## 验证方式

格式检查；相关 workspace 测试无 CSS 硬断言需改。
