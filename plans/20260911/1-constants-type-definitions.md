# 常量类型定义

## 需求理解

为 `src/utils/constants.ts` 中所有导出常量补充明确的 `number` 类型定义。

## 修改范围

仅修改 `src/utils/constants.ts`，不引入额外类型文件或依赖。

## 文件变更

- 新增：本 Plan 文件。
- 修改：`src/utils/constants.ts`。
- 删除：无。

## 核心实现方式

沿用现有导出方式，为每个常量显式标注 `: number`，保持现有计算逻辑和注释不变。

## 新增依赖

无。

## 验证方式

- 执行 `npm run type-check`。
- 执行 `npm run build`。
