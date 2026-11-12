# Plan：实例详情「返回」右对齐

## 需求理解

实体详情嵌入区顶栏「返回」从左侧移到右侧。

## 修改范围

- `src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityList.vue`

## 新增、修改和删除文件

- 仅修改上述文件。

## 核心实现方式

`.object-profile-entity-list__embed-header` 增加 `justify-content: flex-end`。

## 新增依赖及必要性

无。

## 验证方式

- format:check（该文件）
