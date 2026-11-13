# 行为树黑板三种来源移植

## 需求理解

将 `behavior-tree-editor/index.html` 更新后的黑板/变量能力移植到编排系统：来源 FIXED / EXTERNAL / PROPERTY，按来源填值与序列化/校验。

## 修改范围

- 类型与常量
- definition 序列化/导入、validate、属性类型映射
- BlackboardPanel UI、composable 属性目录加载与字段切换
- 单测与 readme

## 新增、修改和删除文件

| 操作 | 路径                                                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 修改 | `behaviorTreeOrchestrationType.ts`、constants、definition、validate、BlackboardPanel、composable、Dialog（补 EXTERNAL 字段）、readme、测试 |
| 新增 | `behaviorTreeBlackboard.ts`（来源解析、属性类型映射）                                                                                      |
| 新增 | 本 Plan                                                                                                                                    |

## 核心实现方式

1. 黑板草稿增加 `source`、`fixedValueText`；定义侧 blackboard 增加 `source`、`value`（FIXED）。
2. `variables` 仅 EXTERNAL 且默认值非空时输出。
3. 校验：黑板可空；按来源校验固定值/默认值/属性；目录未加载时不误报属性类型。
4. 面板：来源列 + 条件值单元格 + 属性下拉；加载空间对象属性目录。

## 新增依赖及必要性

无。

## 验证方式

TDD 更新 `tests/behavior-tree-orchestration.test.mjs`；format:check；check:types-conventions；build:verify。
