# 配置属性下一步校验每个对象已选属性

## 需求理解

第三步「配置属性」点击下一步时，每个已选对象都必须至少勾选一个属性。存在未勾选对象时提示并停留在当前步，不进入关系配置。

## 修改范围

只改子空间创建页的下一步校验，不改属性勾选、接口和布局。

## 新增、修改和删除文件

- 修改 `src/views/OntologySubspaceCreate/utils/mapSubspaceCreateObjectProperty.ts`
- 修改 `src/views/OntologySubspaceCreate/index.vue`
- 修改 `tests/ontology-subspace-create.test.mjs`
- 不新增、不删除文件

## 核心实现方式

抽出纯函数列出尚未勾选任何属性的对象名称；属性列表为空的对象也视为未选择。第三步下一步先校验，未完成时 `ElMessage.warning` 提示 `请为对象「舰船、辽宁号」选择属性`，不加载关系、不跳转。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先写分组校验行为测试并确认失败，再实现
- `node --test --experimental-strip-types tests/ontology-subspace-create.test.mjs`
- 任务文件 `format:check`
- `npm run type-check`、`npm run build:verify`（应用代码变更）
- 浏览器：漏选对象属性时提示且不跳转；每个对象都勾选后可进入下一步
