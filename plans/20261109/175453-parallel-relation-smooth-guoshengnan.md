# 多关系连线改用 smooth 圆滑曲线

## 需求理解

同对象对多条关系展示时，折线偏僵硬；仅对这些关系使用 X6 `smooth` 连接器，单关系保持直线。

## 修改范围

- `src/views/OntologyConceptualModelCreate/components/ConceptualModelGraphCanvas.vue`
- `tests/conceptual-canvas-layout.test.mjs`（断言多关系使用 smooth）

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除；无新依赖

## 核心实现方式

画布同步时：存在 `parallelLayouts` 的边使用 `connector: { name: "smooth" }`，其余仍用 `normal`；同步更新已有边的 connector。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/conceptual-canvas-layout.test.mjs`
- `npm run format:check -- <本次文件>`
