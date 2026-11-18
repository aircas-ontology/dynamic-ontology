# 编辑对象支持修改 apiName（未关联数据源可改）

## 需求理解

编辑对象时支持修改 `apiName`：未关联数据源可改，已关联则禁用；保存时在可改场景把 `apiName` 传给修改接口。

## 修改范围

仅对象工作区编辑链路与更新对象类型；不碰无关脏文件。

## 新增、修改和删除文件

| 操作 | 路径                                                                            |
| ---- | ------------------------------------------------------------------------------- |
| 新增 | `src/views/ObjectWorkspacePanel/utils/isOntologyObjectDatasourceBound.ts`       |
| 修改 | `src/types/apis/updateOntologyObjectType.ts`                                    |
| 修改 | `src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts` |
| 修改 | `src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue`      |
| 修改 | `src/views/ObjectWorkspacePanel/index.vue`                                      |
| 修改 | `tests/update-ontology-object-api.test.mjs`（及必要的绑定判定测试）             |

## 核心实现方式

1. 打开编辑时查询 `getOntologyPropertyDetailByOntologyIdInterface`；任一条属性 `datasourceId` 非空则锁定 apiName；查询失败保守锁定。
2. 弹窗按锁定态启用/禁用 apiName，锁定时提示已关联数据源。
3. `UpdateOntologyObjectParams` 增加可选 `apiName`；未锁定提交时传入，锁定时不传。

## 新增依赖及必要性

无。

## 验证方式

TDD 更新测试后执行相关 `npm test`、`build:verify`、任务文件 `format:check`；`type-check` 记录既有失败。
