# 20260915 Prompt 归档

## 1. 修改 AGENTS.md 增加 Prompt 归档规则

- 执行时间：2026-09-15 09:51（Asia/Shanghai）

修改 \dynamic-ontology\AGENTS.md 文件中的内容，添加一段规则，规则为：每执行完任务后的Prompt 保存在docs文件夹下，按照时间（年月日）作为文件夹名，用户作为文件名，把提示词按照顺序写入文件中

## 2. 新增全文检索菜单与路由

- 执行时间：2026-09-15 18:07（Asia/Shanghai）

在左侧目录树代码位置 src\layout\components\NavigationMenu.vue中添加一个菜单【全文检索】，并对应创建一个新的路由，按照语义化进行路由命名，对应的右侧内容为一个输入框组件placeholder为：检索空间，对象，实例，属性..

确认
