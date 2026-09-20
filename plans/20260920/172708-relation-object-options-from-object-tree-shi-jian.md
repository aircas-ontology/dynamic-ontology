# Plan：添加关系源/目标本体取自对象树

确认范围（用户 2026-09-20）：1 用 ontologyMetaInfos；2 去掉手动输入，仅可选列表。

## 需求理解

- 源/目标本体选项来自对象分类树接口中的本体对象
- 禁止 allow-create；源与目标不能相同

## 修改范围

- 新增映射工具；useSpaceRelationWorkspace 并行拉对象树填 objectOptions
- SpaceRelationFormDialog 去掉 allow-create，校验文案对齐
- 相关测试

## 新增依赖

无

## 验证方式

TDD + 相关测试 + type-check + format
