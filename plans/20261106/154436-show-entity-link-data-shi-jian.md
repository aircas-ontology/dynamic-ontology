# 展示实例关系数据弹框

## 需求理解

按 `docs/20261106/entityAllLinkApi.md` 响应 `data` 数组，在「实例关系数据」弹框中展示关系内容；至少覆盖创建/编辑关系实例行为表单字段：关系名称与两端、状态、持续时间；其余文档字段一并只读展示。

## 修改范围

- 类型：`postOntologyEntityAllLinkType.ts`、`types/index.ts`
- Mock：fixture、`postOntologyEntityAllLinkMock.ts`
- 弹框：`BehaviorEntityLinkDataDialog.vue`
- 测试：all-link API、ontology-space-behavior

## 新增、修改和删除文件

- 修改上述文件
- 无新增 / 删除业务文件

## 核心实现方式

- 定义 `PostOntologyEntityAllLinkItem` 与 visibility window 类型，`data` 为数组
- Mock 使用文档示例数据
- 弹框按 loading/error/empty/success 渲染多条关系描述与时段列表

## 新增依赖

无

## 验证方式

- 相关测试、`format:check`、`type-check`、`build:verify`
