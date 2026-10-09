# Plan：空间/对象图标上传仅支持 PNG/JPEG

确认范围（用户 2026-09-29「开始实施」）。

## 需求理解

上传空间图片与对象创建弹框图标统一：不支持 WebP，对象侧同步取消 SVG；仅 PNG/JPEG，最大 2MB。

## 修改范围

| 操作 | 路径                                                            |
| ---- | --------------------------------------------------------------- |
| 修改 | `SpaceFormDialog.vue`                                           |
| 修改 | `spaceOperations.ts`                                            |
| 修改 | `OntologyObjectCreateDialog.vue`                                |
| 修改 | `tests/space-form-icon-upload.test.mjs`（必要时补对象弹框断言） |

## 核心实现

- `accept` / 校验白名单仅 `image/png`、`image/jpeg`
- 文案改为 PNG/JPEG（或 PNG / JPG）

## 新增依赖

无。

## 验证方式

相关单测、`format:check`
