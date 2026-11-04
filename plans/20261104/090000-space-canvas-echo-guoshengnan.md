# 空间画布查询回显

## 需求与确认

用户已确认从空间列表进入概念构建时查询全部对象、属性和关系并回显。实施中漏存计划，此文件补记已确认范围。

## 范围与文件

- 修改 ontologyManageApi.ts、API 和类型公共出口，新增 getOntologySpaceCanvasContentType.ts。
- 修改概念构建 index.vue，新增 mapCanvasContentToConceptualModel.ts。
- 修改 HTTP Mock 路由并新增 canvas.get.json。
- 更新 tests/create-ontology-space-canvas-api.test.mjs。
- 不新增依赖，不删除文件。

## 实现

按 spaceId 查询 GET /ontology/space/canvas；将 API 名称映射为本地节点 ID，保留属性与关系，使用默认网格布局。加载期间阻止编辑和保存，处理空数据、错误及过期响应，卸载时使响应失效。

## 验证

先执行失败测试，再完成实现；执行 npm test、test:coverage、check:types-conventions、type-check、build:verify、限定文件格式检查与 git diff --check。浏览器可用时验证受影响流程；已有无关失败如实记录。
