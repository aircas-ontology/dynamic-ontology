# 创建主题增加进度条

## 需求理解

点击「创建」后接口较慢，需要全页遮罩进度条反馈；接口无真实分步进度，采用缓增至约 90%、成功到 100% 的展示。

## 修改范围

仅 `OntologySubspaceCreate` 创建提交链路。

## 新增、修改和删除文件

| 操作 | 路径                                         |
| ---- | -------------------------------------------- |
| 修改 | `src/views/OntologySubspaceCreate/index.vue` |
| 修改 | `tests/ontology-subspace-create.test.mjs`    |

## 核心实现方式

1. `creating` 时展示不可关闭遮罩与 `el-progress`。
2. 定时缓增至 90%；成功置 100% 后短暂停留再返回；失败归零关闭。
3. 演示模式不显示进度条。

## 新增依赖及必要性

无。

## 验证方式

更新相关测试后执行 `format:check`、相关 `npm test`、`build:verify`。
