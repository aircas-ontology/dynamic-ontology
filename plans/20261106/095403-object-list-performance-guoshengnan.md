# 需求理解

对象数量较多时，对象列表页面加载缓慢。优化列表渲染期间的重复对象查找与重复扁平化计算，保持现有卡片、表格展示和交互行为不变，暂不引入虚拟滚动。

# 修改范围

- 优化 `src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue` 的对象行解析，使用对象索引缓存替代每个单元格的分类遍历查找。
- 优化 `src/views/ObjectWorkspacePanel/index.vue` 的扁平对象列表计算，复用已缓存的计算结果。
- 更新必要测试，覆盖对象索引和列表计算的性能相关行为。
- 不新增依赖，不修改受保护目录。

# 核心实现方式

在对象列表组件中基于 sections 建立 `Map<string, OntologyObjectItem>`，表格行直接通过 id 查找；页面层将 sections 的扁平对象列表保留为单个 computed，并供继承对象回退和对象定位复用。

# 新增依赖

无。

# 验证方式

执行相关测试、`npm run type-check`、`npm run build:verify`、当前修改文件的 Prettier 格式检查，以及 `git diff --check` 和工作区范围检查。
