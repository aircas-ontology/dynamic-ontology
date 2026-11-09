# 概念构建同对象对多关系展示优化

## 需求理解

同一组对象间多条关系时，统一主向端口并用顶点偏移分叉，同时错开边上标签位置，减少交叉与标签重叠。

## 修改范围

- `src/views/OntologyConceptualModelCreate/utils/layoutConceptualModelContent.ts`
- `src/views/OntologyConceptualModelCreate/utils/conceptualModelGraph.ts`（标签支持 distance）
- `src/views/OntologyConceptualModelCreate/components/ConceptualModelGraphCanvas.vue`
- `tests/conceptual-canvas-layout.test.mjs`

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除；无新依赖

## 核心实现方式

1. 新增 `calculateParallelRelationLayouts`：同无向对象对多关系时，按相对位置统一源/目标端口，计算平行顶点与标签 distance。
2. 画布同步时对多关系组应用上述端口/顶点/标签；单关系保持原端口逻辑。
3. `calculateParallelRelationVertices` 继续由 layouts 派生，兼容既有测试。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/conceptual-canvas-layout.test.mjs`
- `npm run format:check -- <本次文件>`
