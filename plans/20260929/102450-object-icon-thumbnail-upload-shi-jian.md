# Plan：对象图标改为缩略图上传

确认范围（用户 2026-09-29「确认」）。

## 需求理解

对象创建/编辑选图标与空间一致：校验后调 `postUploadOntologyThumbnailInterface`，写入返回 URL；去掉 Data URL。

## 修改范围

| 操作 | 路径                                    |
| ---- | --------------------------------------- |
| 修改 | `OntologyObjectCreateDialog.vue`        |
| 修改 | `tests/space-form-icon-upload.test.mjs` |

## 核心实现

`handleIconChange` → 缩略图接口 → `draft.iconUrl = response.data`；上传中禁用。

## 新增依赖

无。

## 验证方式

相关单测、`format:check`
