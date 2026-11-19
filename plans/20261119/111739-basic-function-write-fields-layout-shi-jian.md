# Plan: 基础函数「写入字段」横向排版

## 需求理解

提高「创建行为」基础函数「写入字段」区块的横向空间利用率，减少纵向占位；不改变交互、校验与数据流。

## 修改范围

仅调整 `BehaviorFormDialog.vue` 中基础函数写入字段区块的布局样式（及必要时最小模板结构调整）。

## 新增、修改和删除文件

- 修改：`src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- 不新增、不删除文件

## 核心实现方式

每行改为三列 grid：`展示字段标签 | 对象下拉 | 属性下拉`。仅作用于基础函数写入字段容器，不改 Application 表内共用的 `.object-property-pickers` 纵向布局。窄屏（≤900px）回退为单列。

## 新增依赖及必要性

无

## 验证方式

- 相关测试（写入字段相关断言）
- `npm run format:check --` 本文件
- 人工确认多展示字段时一行排开、下拉可选
